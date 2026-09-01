const User = require('../models/User');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');
const ROLES = require('../constants/roles');

const buildReceiptForStudent = (user) => {
  const studentId = user._id || user.id;
  const feeStatus = user.feeStatus || 'CLEARED';
  const feeDues = user.feeDues || { tuition: 0, hostel: 0, library: 0, lab: 0 };
  const totalDues =
    Number(feeDues.tuition || 0) +
    Number(feeDues.hostel || 0) +
    Number(feeDues.library || 0) +
    Number(feeDues.lab || 0);

  const baseTuition = 45000;
  const baseLab = 8500;
  const baseLibrary = 3000;
  const baseHostel = 6500;
  const totalBaseFee = baseTuition + baseLab + baseLibrary + baseHostel;
  const totalPaid = Math.max(0, totalBaseFee - totalDues);

  if (totalPaid === 0 && feeStatus !== 'CLEARED') {
    return null;
  }

  const receiptId = `RCP-${String(studentId).slice(-6).toUpperCase()}-SEM${user.semester || 1}`;
  const receiptNumber = `REC-2026-${user.rollNumber || String(studentId).slice(-6).toUpperCase()}`;
  const transactionId = `TXN-ERP-${String(studentId).slice(-6).toUpperCase()}`;

  const issueDate = user.noDuesIssuedAt || user.updatedAt || user.createdAt || new Date();

  const tuitionPaid = Math.max(0, baseTuition - Number(feeDues.tuition || 0));
  const labPaid = Math.max(0, baseLab - Number(feeDues.lab || 0));
  const libraryPaid = Math.max(0, baseLibrary - Number(feeDues.library || 0));
  const hostelPaid = Math.max(0, baseHostel - Number(feeDues.hostel || 0));

  return {
    id: receiptId,
    receiptId,
    receiptNumber,
    transactionId,
    studentId: String(studentId),
    studentName: user.name,
    rollNumber: user.rollNumber || 'N/A',
    email: user.email,
    course: user.courseId?.name || user.courseId?.code || 'Bachelor of Engineering',
    branch: user.branchId?.name || user.branchId?.code || 'Computer Science & Engineering',
    semester: user.semester || 1,
    group: user.group || 'G1',
    academicYear: '2025-2026',
    paymentDate: issueDate,
    paymentMode: 'ONLINE ERP GATEWAY',
    feeStatus,
    isCleared: feeStatus === 'CLEARED' || totalDues === 0,
    totalBaseFee,
    totalPaid,
    totalDues,
    feeBreakdown: [
      {
        head: 'Semester Tuition Fee',
        baseAmount: baseTuition,
        paidAmount: tuitionPaid,
        dueAmount: Number(feeDues.tuition || 0),
        status: Number(feeDues.tuition || 0) === 0 ? 'PAID' : 'DUE',
      },
      {
        head: 'Laboratory & Computer Facility Fee',
        baseAmount: baseLab,
        paidAmount: labPaid,
        dueAmount: Number(feeDues.lab || 0),
        status: Number(feeDues.lab || 0) === 0 ? 'PAID' : 'DUE',
      },
      {
        head: 'Library & Learning Resources Fee',
        baseAmount: baseLibrary,
        paidAmount: libraryPaid,
        dueAmount: Number(feeDues.library || 0),
        status: Number(feeDues.library || 0) === 0 ? 'PAID' : 'DUE',
      },
      {
        head: 'Hostel & Residential Accommodation Fee',
        baseAmount: baseHostel,
        paidAmount: hostelPaid,
        dueAmount: Number(feeDues.hostel || 0),
        status: Number(feeDues.hostel || 0) === 0 ? 'PAID' : 'DUE',
      },
    ],
  };
};

const getStudentReceipts = async (studentUserId) => {
  const user = await User.findById(studentUserId)
    .populate('courseId', 'name code')
    .populate('branchId', 'name code');

  if (!user) {
    throw new AppError('Student account not found.', 404, ERROR_CODES.NOT_FOUND);
  }

  const receipt = buildReceiptForStudent(user);
  return receipt ? [receipt] : [];
};

const getReceiptById = async (receiptId, actor) => {
  let targetUser;

  if (actor.role === ROLES.STUDENT) {
    targetUser = await User.findById(actor.id)
      .populate('courseId', 'name code')
      .populate('branchId', 'name code');
  } else {
    // For ADMIN / HOD, locate the student whose receipt matches receiptId
    const students = await User.find({ role: ROLES.STUDENT })
      .populate('courseId', 'name code')
      .populate({
        path: 'branchId',
        select: 'name code hostingDepartmentId departmentId',
      });

    targetUser = students.find((s) => {
      const r = buildReceiptForStudent(s);
      return r && r.receiptId === receiptId;
    });

    if (targetUser && actor.role === ROLES.HOD) {
      const { assertHODDeptBound } = require('../utils/privilegeGuard');
      const studentDeptId =
        targetUser.departmentId ||
        targetUser.branchId?.hostingDepartmentId ||
        targetUser.branchId?.departmentId;
      assertHODDeptBound(actor, studentDeptId);
    }
  }

  if (!targetUser) {
    throw new AppError('Student record not found.', 404, ERROR_CODES.NOT_FOUND);
  }

  const receipt = buildReceiptForStudent(targetUser);

  if (!receipt) {
    throw new AppError('Fee receipt not found.', 404, ERROR_CODES.NOT_FOUND);
  }

  // Security guard: Student can only view their own receipt
  if (actor.role === 'STUDENT' && String(receipt.studentId) !== String(actor.id)) {
    throw new AppError('Access forbidden to this fee receipt.', 403, ERROR_CODES.FORBIDDEN);
  }

  return receipt;
};

const payStudentFee = async (actor) => {
  const user = await User.findById(actor.id);
  if (!user) {
    throw new AppError('Student account not found.', 404, ERROR_CODES.NOT_FOUND);
  }

  const feeDues = user.feeDues || { tuition: 0, hostel: 0, library: 0, lab: 0 };
  const totalDues =
    Number(feeDues.tuition || 0) +
    Number(feeDues.hostel || 0) +
    Number(feeDues.library || 0) +
    Number(feeDues.lab || 0);

  if (totalDues === 0 && user.feeStatus === 'CLEARED') {
    throw new AppError('No outstanding fee dues to pay.', 400, ERROR_CODES.BAD_REQUEST);
  }

  user.feeDues = { tuition: 0, hostel: 0, library: 0, lab: 0 };
  user.feeStatus = 'CLEARED';
  user.noDuesIssuedAt = new Date();

  await user.save();

  try {
    const { createNotification } = require('./notificationService');
    await createNotification({
      recipientId: user._id,
      title: '💳 Online Fee Payment Successful',
      message: `Your semester fee payment of ₹${totalDues.toLocaleString('en-IN')} has been processed successfully. Official clearance receipt generated.`,
      category: 'FEE_PAYMENT',
      link: '/student/fees',
      senderId: user._id,
    });
  } catch (err) {
    // Non-blocking notification error
  }

  const updatedUser = await User.findById(user._id)
    .populate('courseId', 'name code')
    .populate('branchId', 'name code');

  return buildReceiptForStudent(updatedUser);
};

module.exports = {
  getStudentReceipts,
  getReceiptById,
  payStudentFee,
};
