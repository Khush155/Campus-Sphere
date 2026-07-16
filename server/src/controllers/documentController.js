const DocumentRequest = require('../models/DocumentRequest');
const AuditLog = require('../models/AuditLog');
const AppError = require('../utils/AppError');

/**
 * POST /api/v1/documents
 * Submit a document request. Purpose and urgency determine SLA.
 */
exports.createDocumentRequest = async (req, res) => {
  const { documentType, purpose, addressedTo, urgency } = req.body;

  if (!documentType || !purpose) {
    throw new AppError('documentType and purpose are required.', 400);
  }

  const doc = await DocumentRequest.create({
    studentId: req.user.id,
    departmentId: req.user.departmentId,
    documentType,
    purpose,
    addressedTo: addressedTo || null,
    urgency: urgency || 'NORMAL',
  });

  res.status(201).json({ success: true, data: doc });
};

/**
 * GET /api/v1/documents
 * List document requests with SLA breach auto-update and pagination.
 */
exports.getDocumentRequests = async (req, res) => {
  const { departmentId, studentId, status, urgency, slaBreached, page = 1, limit = 20 } = req.query;
  const filters = {};

  if (departmentId) filters.departmentId = departmentId;
  if (studentId) filters.studentId = studentId;
  if (status) filters.status = status;
  if (urgency) filters.urgency = urgency;
  if (slaBreached !== undefined) filters.slaBreached = slaBreached === 'true';

  // Auto mark SLA breaches
  await DocumentRequest.updateMany(
    { slaDeadline: { $lt: new Date() }, slaBreached: false, status: { $nin: ['PROCESSED', 'REJECTED', 'READY_FOR_PICKUP'] } },
    { $set: { slaBreached: true } }
  );

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [docs, total] = await Promise.all([
    DocumentRequest.find(filters)
      .populate('studentId', 'name email semester branchId')
      .populate('processedBy', 'name')
      .sort({ urgency: -1, slaDeadline: 1 }) // Urgent first, then by SLA proximity
      .skip(skip)
      .limit(parseInt(limit)),
    DocumentRequest.countDocuments(filters),
  ]);

  res.status(200).json({
    success: true,
    data: docs,
    meta: { total, page: parseInt(page), limit: parseInt(limit) },
  });
};

/**
 * PATCH /api/v1/documents/:id/status
 * Approve, reject, or mark as processed.
 * - REJECTED requires rejectionReason (no silent rejections).
 * - PROCESSED sets issueDate and processedBy.
 * - documentRef can be set to a PDF URL/path when document is ready.
 */
exports.updateDocumentStatus = async (req, res) => {
  const { id } = req.params;
  const { status, rejectionReason, processingNotes, documentRef } = req.body;

  if (!status) throw new AppError('status is required.', 400);

  if (status === 'REJECTED' && !rejectionReason) {
    throw new AppError(
      'rejectionReason is mandatory when rejecting a document request. The student must know why.',
      400
    );
  }

  const doc = await DocumentRequest.findById(id);
  if (!doc) throw new AppError('Document request not found.', 404);

  const before = { status: doc.status };

  doc.status = status;
  if (rejectionReason) doc.rejectionReason = rejectionReason;
  if (processingNotes) doc.processingNotes = processingNotes;
  if (documentRef) doc.documentRef = documentRef; // PDF link/path
  if (status === 'PROCESSED' || status === 'READY_FOR_PICKUP') {
    doc.issueDate = new Date();
    doc.processedBy = req.user.id;
    doc.processedAt = new Date();
    if (new Date() > doc.slaDeadline) doc.slaBreached = true;
  }

  await doc.save();

  await AuditLog.create({
    actorId: req.user.id,
    action: `DOCUMENT_${status}`,
    targetId: doc._id,
    targetModel: 'DocumentRequest',
    before,
    after: { status, rejectionReason, documentRef },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.status(200).json({ success: true, data: doc });
};
