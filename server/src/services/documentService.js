const DocumentRequest = require('../models/DocumentRequest');
const { assertHODDeptBound } = require('../utils/privilegeGuard');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');
const ROLES = require('../constants/roles');
const { logAuditEvent } = require('../utils/auditLogger');
const paginate = require('../utils/paginate');

const createDocumentRequest = async (docData, actor) => {
  const { documentType, purpose, addressedTo, urgency } = docData;

  const doc = await DocumentRequest.create({
    studentId: actor.id,
    departmentId: actor.departmentId,
    documentType,
    purpose,
    addressedTo: addressedTo || null,
    urgency: urgency || 'NORMAL',
  });

  return doc;
};

const getDocumentRequests = async (queryOptions, actor) => {
  const { departmentId, studentId, status, urgency, slaBreached } = queryOptions;
  const filters = {};

  if (departmentId) {
    filters.departmentId = departmentId;
  }
  if (studentId) {
    filters.studentId = studentId;
  }
  if (status) {
    filters.status = status;
  }
  if (urgency) {
    filters.urgency = urgency;
  }
  if (slaBreached !== undefined) {
    filters.slaBreached = slaBreached === 'true' || slaBreached === true;
  }

  // Enforce HOD & Student boundaries
  if (actor.role === ROLES.HOD) {
    filters.departmentId = actor.departmentId;
  } else if (actor.role === ROLES.STUDENT) {
    filters.studentId = actor.id;
  }

  // Auto mark SLA breaches
  await DocumentRequest.updateMany(
    { slaDeadline: { $lt: new Date() }, slaBreached: false, status: { $nin: ['PROCESSED', 'REJECTED', 'READY_FOR_PICKUP'] } },
    { $set: { slaBreached: true } }
  );

  return await paginate(DocumentRequest, filters, {
    ...queryOptions,
    populate: [
      { path: 'studentId', select: 'name email semester branchId' },
      { path: 'processedBy', select: 'name' }
    ],
    sort: { urgency: -1, slaDeadline: 1 }
  });
};

const updateDocumentStatus = async (id, statusData, actor, req) => {
  const { status, rejectionReason, processingNotes, documentRef } = statusData;

  const doc = await DocumentRequest.findById(id);
  if (!doc) {
    throw new AppError('Document request not found.', 404, ERROR_CODES.NOT_FOUND);
  }

  // Enforce HOD department boundaries
  assertHODDeptBound(actor, doc.departmentId);

  const before = { status: doc.status };

  doc.status = status;
  if (rejectionReason) {
    doc.rejectionReason = rejectionReason;
  }
  if (processingNotes) {
    doc.processingNotes = processingNotes;
  }
  if (documentRef) {
    doc.documentRef = documentRef;
  }
  if (status === 'PROCESSED' || status === 'READY_FOR_PICKUP') {
    doc.issueDate = new Date();
    doc.processedBy = actor.id;
    doc.processedAt = new Date();
    if (new Date() > doc.slaDeadline) {
      doc.slaBreached = true;
    }
  }

  await doc.save();

  // Audit Log
  await logAuditEvent({
    actorId: actor.id,
    action: `DOCUMENT_${status}`,
    targetId: doc._id,
    targetModel: 'DocumentRequest',
    before,
    after: { status, rejectionReason, documentRef },
    req
  });

  return doc;
};

module.exports = {
  createDocumentRequest,
  getDocumentRequests,
  updateDocumentStatus
};
