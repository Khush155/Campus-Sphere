const Complaint = require('../models/Complaint');
const AuditLog = require('../models/AuditLog');
const AppError = require('../utils/AppError');

/**
 * POST /api/v1/complaints
 * Submit a complaint with category, priority, and auto-SLA.
 */
exports.createComplaint = async (req, res) => {
  const { title, description, category, priority } = req.body;

  if (!title || !description || !category) {
    throw new AppError('title, description, and category are required.', 400);
  }

  const complaint = await Complaint.create({
    title,
    description,
    category,
    priority: priority || 'MEDIUM',
    submittedBy: req.user.id,
    departmentId: req.user.departmentId,
    statusHistory: [{
      status: 'OPEN',
      changedBy: req.user.id,
      note: 'Complaint submitted.',
      timestamp: new Date(),
    }],
  });

  res.status(201).json({ success: true, data: complaint });
};

/**
 * GET /api/v1/complaints
 * List complaints with filters, SLA breach info, and pagination.
 */
exports.getComplaints = async (req, res) => {
  const { departmentId, status, category, priority, slaBreached, page = 1, limit = 20 } = req.query;
  const filters = {};

  if (departmentId) {filters.departmentId = departmentId;}
  if (status) {filters.status = status;}
  if (category) {filters.category = category;}
  if (priority) {filters.priority = priority;}
  if (slaBreached !== undefined) {filters.slaBreached = slaBreached === 'true';}

  // Auto-check SLA breaches on fetch — any complaint past deadline that isn't resolved
  const now = new Date();
  await Complaint.updateMany(
    { slaDeadline: { $lt: now }, slaBreached: false, status: { $nin: ['RESOLVED', 'CLOSED'] } },
    { $set: { slaBreached: true } }
  );

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [complaints, total] = await Promise.all([
    Complaint.find(filters)
      .populate('submittedBy', 'name email role')
      .populate('assignedTo', 'name email')
      .sort({ priority: -1, createdAt: -1 }) // Critical first
      .skip(skip)
      .limit(parseInt(limit)),
    Complaint.countDocuments(filters),
  ]);

  res.status(200).json({
    success: true,
    data: complaints,
    meta: { total, page: parseInt(page), limit: parseInt(limit) },
  });
};

/**
 * PATCH /api/v1/complaints/:id/status
 * Update status with immutable history trail.
 * HOD can also assign the complaint to a faculty for investigation.
 */
exports.updateComplaintStatus = async (req, res) => {
  const { id } = req.params;
  const { status, resolutionRemarks, note, assignedTo } = req.body;

  if (!status) {throw new AppError('status is required.', 400);}
  if (status === 'RESOLVED' && !resolutionRemarks) {
    throw new AppError('resolutionRemarks is required when resolving a complaint.', 400);
  }

  const complaint = await Complaint.findById(id);
  if (!complaint) {throw new AppError('Complaint not found.', 404);}

  const before = { status: complaint.status };

  // Append to immutable history trail
  complaint.statusHistory.push({
    status,
    changedBy: req.user.id,
    note: note || resolutionRemarks || `Status changed to ${status}`,
    timestamp: new Date(),
  });

  complaint.status = status;
  if (resolutionRemarks) {complaint.resolutionRemarks = resolutionRemarks;}
  if (assignedTo) {complaint.assignedTo = assignedTo;}
  if (status === 'RESOLVED' || status === 'CLOSED') {
    complaint.resolvedAt = new Date();
    // Check if SLA was breached
    if (new Date() > complaint.slaDeadline) {complaint.slaBreached = true;}
  }

  await complaint.save();

  await AuditLog.create({
    actorId: req.user.id,
    action: `COMPLAINT_STATUS_${status}`,
    targetId: complaint._id,
    targetModel: 'Complaint',
    before,
    after: { status, resolutionRemarks, assignedTo },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  res.status(200).json({ success: true, data: complaint });
};
