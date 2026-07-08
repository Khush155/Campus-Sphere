const PDFDocument = require('pdfkit');
const FeeStructure = require('../models/FeeStructure');
const FeePayment = require('../models/FeePayment');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');
const { logAuditEvent } = require('../utils/auditLogger');
const logger = require('../utils/logger');

/**
 * List all fee structures with optional filters.
 */
const getFeeStructures = async ({ courseId, branchId, semester, academicYear } = {}) => {
  const filter = {};
  if (courseId) filter.courseId = courseId;
  if (branchId) filter.branchId = branchId;
  if (semester) filter.semester = Number(semester);
  if (academicYear) filter.academicYear = academicYear;

  const structures = await FeeStructure.find(filter)
    .populate('courseId', 'name code')
    .populate('branchId', 'name code')
    .populate('createdBy', 'name')
    .sort({ academicYear: -1, semester: 1, label: 1 });

  return structures.map((s) => ({
    id: s._id,
    course: s.courseId ? { id: s.courseId._id, name: s.courseId.name, code: s.courseId.code } : null,
    branch: s.branchId ? { id: s.branchId._id, name: s.branchId.name, code: s.branchId.code } : null,
    semester: s.semester,
    amount: s.amount,
    label: s.label,
    academicYear: s.academicYear,
    createdBy: s.createdBy ? s.createdBy.name : 'System',
    createdAt: s.createdAt,
  }));
};

/**
 * Create a new fee structure entry.
 */
const createFeeStructure = async (data, adminId) => {
  // Check for duplicate before attempting insert (better error message)
  const existing = await FeeStructure.findOne({
    courseId: data.courseId,
    branchId: data.branchId || null,
    semester: data.semester,
    academicYear: data.academicYear,
    label: data.label,
  });

  if (existing) {
    throw new AppError(
      `A fee structure for this course/branch/semester/year with label "${data.label}" already exists.`,
      409,
      ERROR_CODES.DUPLICATE_ENTRY
    );
  }

  const structure = await FeeStructure.create({
    ...data,
    branchId: data.branchId || null,
    createdBy: adminId,
  });

  await logAuditEvent({
    actorId: adminId,
    action: 'FEE_STRUCTURE_CREATED',
    targetId: structure._id,
    targetModel: 'FeeStructure',
    after: { label: structure.label, amount: structure.amount, academicYear: structure.academicYear },
  });

  logger.info(`[Fee Structure Created] ID: ${structure._id} by Admin: ${adminId}`);

  return {
    id: structure._id,
    label: structure.label,
    amount: structure.amount,
    semester: structure.semester,
    academicYear: structure.academicYear,
  };
};

/**
 * Get all fee payments for a specific student.
 */
const getStudentFees = async (studentId) => {
  // Verify student exists
  const student = await User.findById(studentId).select('name email role status');
  if (!student) {
    throw new AppError('Student not found.', 404, ERROR_CODES.NOT_FOUND);
  }

  const payments = await FeePayment.find({ studentId })
    .populate({
      path: 'feeStructureId',
      select: 'label amount semester academicYear courseId branchId',
      populate: [
        { path: 'courseId', select: 'name code' },
        { path: 'branchId', select: 'name code' },
      ],
    })
    .populate('recordedBy', 'name')
    .sort({ paidAt: -1 });

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  return {
    student: {
      id: student._id,
      name: student.name,
      email: student.email,
      role: student.role,
    },
    totalPaid,
    payments: payments.map((p) => ({
      id: p._id,
      amount: p.amount,
      paidAt: p.paidAt,
      transactionReference: p.transactionReference,
      paymentMethod: p.paymentMethod,
      remarks: p.remarks,
      recordedBy: p.recordedBy ? p.recordedBy.name : 'System',
      feeStructure: p.feeStructureId
        ? {
            id: p.feeStructureId._id,
            label: p.feeStructureId.label,
            amount: p.feeStructureId.amount,
            semester: p.feeStructureId.semester,
            academicYear: p.feeStructureId.academicYear,
            course: p.feeStructureId.courseId
              ? { name: p.feeStructureId.courseId.name, code: p.feeStructureId.courseId.code }
              : null,
            branch: p.feeStructureId.branchId
              ? { name: p.feeStructureId.branchId.name, code: p.feeStructureId.branchId.code }
              : null,
          }
        : null,
    })),
  };
};

/**
 * Record a new fee payment.
 * Idempotent: rejects if transactionReference already exists.
 */
const recordPayment = async (data, adminId) => {
  // Verify fee structure exists
  const feeStructure = await FeeStructure.findById(data.feeStructureId);
  if (!feeStructure) {
    throw new AppError('Fee structure not found.', 404, ERROR_CODES.NOT_FOUND);
  }

  // Verify student exists
  const student = await User.findById(data.studentId).select('name email role');
  if (!student) {
    throw new AppError('Student not found.', 404, ERROR_CODES.NOT_FOUND);
  }

  // Idempotency check — reject duplicate transactionReference
  const existingPayment = await FeePayment.findOne({
    transactionReference: data.transactionReference,
  });

  if (existingPayment) {
    throw new AppError(
      `A payment with transaction reference "${data.transactionReference}" already exists. Duplicate payments are rejected.`,
      409,
      ERROR_CODES.DUPLICATE_ENTRY
    );
  }

  const payment = await FeePayment.create({
    studentId: data.studentId,
    feeStructureId: data.feeStructureId,
    amount: data.amount,
    transactionReference: data.transactionReference,
    paymentMethod: data.paymentMethod,
    remarks: data.remarks || '',
    paidAt: data.paidAt ? new Date(data.paidAt) : new Date(),
    recordedBy: adminId,
  });

  await logAuditEvent({
    actorId: adminId,
    action: 'FEE_PAYMENT_RECORDED',
    targetId: payment._id,
    targetModel: 'FeePayment',
    after: {
      studentId: data.studentId,
      amount: data.amount,
      transactionReference: data.transactionReference,
    },
  });

  logger.info(`[Fee Payment] TxRef: ${data.transactionReference} | Student: ${data.studentId} | Amount: ${data.amount}`);

  return {
    id: payment._id,
    studentId: payment.studentId,
    studentName: student.name,
    amount: payment.amount,
    transactionReference: payment.transactionReference,
    paymentMethod: payment.paymentMethod,
    paidAt: payment.paidAt,
    remarks: payment.remarks,
  };
};

/**
 * Generate a PDF receipt for a payment and pipe it to the response stream.
 */
const generatePaymentReceipt = async (paymentId, res) => {
  const payment = await FeePayment.findById(paymentId)
    .populate('studentId', 'name email role')
    .populate({
      path: 'feeStructureId',
      select: 'label amount semester academicYear',
      populate: { path: 'courseId', select: 'name' },
    })
    .populate('recordedBy', 'name');

  if (!payment) {
    throw new AppError('Payment record not found.', 404, ERROR_CODES.NOT_FOUND);
  }

  const student = payment.studentId;
  const structure = payment.feeStructureId;

  // Set response headers for PDF download
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="receipt-${payment.transactionReference}.pdf"`
  );

  // Build PDF document using pdfkit
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  doc.pipe(res);

  // ── Header ──────────────────────────────────────────────────────────────
  doc
    .fontSize(22)
    .font('Helvetica-Bold')
    .text('CampusSphere ERP', { align: 'center' })
    .fontSize(12)
    .font('Helvetica')
    .text('Official Fee Payment Receipt', { align: 'center' })
    .moveDown(0.5);

  doc
    .moveTo(50, doc.y)
    .lineTo(545, doc.y)
    .strokeColor('#aaaaaa')
    .lineWidth(0.5)
    .stroke()
    .moveDown(1);

  // ── Receipt Info ─────────────────────────────────────────────────────────
  const receiptData = [
    ['Receipt ID', String(payment._id)],
    ['Transaction Reference', payment.transactionReference],
    ['Payment Date', new Date(payment.paidAt).toLocaleDateString('en-IN', { dateStyle: 'long' })],
    ['Payment Method', payment.paymentMethod.replace('_', ' ')],
  ];

  receiptData.forEach(([label, value]) => {
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text(label + ':', { continued: true, width: 200 })
      .font('Helvetica')
      .text('  ' + value);
  });

  doc.moveDown(1);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#eeeeee').stroke().moveDown(1);

  // ── Student Details ──────────────────────────────────────────────────────
  doc.fontSize(12).font('Helvetica-Bold').text('Student Details').moveDown(0.5);

  const studentData = [
    ['Name', student ? student.name : 'N/A'],
    ['Email', student ? student.email : 'N/A'],
    ['Role', student ? student.role : 'N/A'],
  ];

  studentData.forEach(([label, value]) => {
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text(label + ':', { continued: true, width: 200 })
      .font('Helvetica')
      .text('  ' + value);
  });

  doc.moveDown(1);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#eeeeee').stroke().moveDown(1);

  // ── Fee Details ──────────────────────────────────────────────────────────
  doc.fontSize(12).font('Helvetica-Bold').text('Fee Details').moveDown(0.5);

  const feeData = [
    ['Description', structure ? structure.label : 'N/A'],
    ['Academic Year', structure ? structure.academicYear : 'N/A'],
    ['Semester', structure ? `Semester ${structure.semester}` : 'N/A'],
    ['Course', structure?.courseId ? structure.courseId.name : 'N/A'],
  ];

  feeData.forEach(([label, value]) => {
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text(label + ':', { continued: true, width: 200 })
      .font('Helvetica')
      .text('  ' + value);
  });

  doc.moveDown(1);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#aaaaaa').lineWidth(1).stroke().moveDown(0.5);

  // ── Amount ───────────────────────────────────────────────────────────────
  doc
    .fontSize(16)
    .font('Helvetica-Bold')
    .text(`Amount Paid: ₹${payment.amount.toLocaleString('en-IN')}`, { align: 'right' });

  if (payment.remarks) {
    doc.moveDown(0.5).fontSize(9).font('Helvetica').fillColor('#888888').text(`Remarks: ${payment.remarks}`, { align: 'right' }).fillColor('#000000');
  }

  doc.moveDown(2);

  // ── Footer ───────────────────────────────────────────────────────────────
  doc
    .fontSize(8)
    .font('Helvetica')
    .fillColor('#888888')
    .text(`Recorded by: ${payment.recordedBy ? payment.recordedBy.name : 'System'}`, { align: 'center' })
    .text('This is a system-generated receipt. No signature required.', { align: 'center' })
    .text(`Generated on: ${new Date().toLocaleString('en-IN')}`, { align: 'center' });

  doc.end();
};

module.exports = {
  getFeeStructures,
  createFeeStructure,
  getStudentFees,
  recordPayment,
  generatePaymentReceipt,
};
