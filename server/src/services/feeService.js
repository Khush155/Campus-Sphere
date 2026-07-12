const FeeStructure = require('../models/FeeStructure');
const FeeTransaction = require('../models/FeeTransaction');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');
const { logAuditEvent } = require('../utils/auditLogger');
const mongoose = require('mongoose');

const createFeeStructure = async (data, actorId, req) => {
  const feeStructure = await FeeStructure.create(data);
  
  await logAuditEvent({
    actorId,
    action: 'FEE_STRUCTURE_CREATED',
    targetId: feeStructure._id,
    targetModel: 'FeeStructure',
    after: feeStructure.toObject(),
    req,
  });

  return feeStructure;
};

const getFeeStructures = async (filters = {}) => {
  return await FeeStructure.find(filters).populate('courseId branchId').sort({ createdAt: -1 });
};

const updateFeeStructure = async (id, data, actorId, req) => {
  const feeStructure = await FeeStructure.findById(id);
  if (!feeStructure) {
    throw new AppError('Fee structure not found', 404, ERROR_CODES.NOT_FOUND);
  }

  const before = feeStructure.toObject();
  
  Object.assign(feeStructure, data);
  await feeStructure.save();

  await logAuditEvent({
    actorId,
    action: 'FEE_STRUCTURE_UPDATED',
    targetId: feeStructure._id,
    targetModel: 'FeeStructure',
    before,
    after: feeStructure.toObject(),
    req,
  });

  return feeStructure;
};

// Gets the dues for a specific student
const getStudentFeeLedger = async (studentId) => {
  const student = await User.findById(studentId);
  if (!student) throw new AppError('Student not found', 404, ERROR_CODES.USER_NOT_FOUND);

  const feeStructures = await FeeStructure.find({
    $and: [
      { $or: [{ studentId: null }, { studentId: student._id }] },
      { $or: [{ courseId: null }, { courseId: student.courseId }] },
      { $or: [{ branchId: null }, { branchId: student.branchId }] },
      { $or: [{ semester: null }, { semester: student.semester }] }
    ]
  });

  const transactions = await FeeTransaction.find({ studentId, status: 'SUCCESS' });

  let baseFees = 0;
  let totalFines = 0;
  let totalDiscounts = 0;
  let totalPaid = 0;

  const today = new Date();

  const ledgerDetails = feeStructures.map(fee => {
    const feeTransactions = transactions.filter(t => t.feeStructureId.toString() === fee._id.toString());
    const paidTowardsThisFee = feeTransactions.reduce((sum, t) => sum + t.amountPaid, 0);
    
    let calculatedLateFee = 0;
    if (fee.type !== 'DISCOUNT' && fee.lateFeePerDay > 0) {
      const isBasePaid = paidTowardsThisFee >= fee.amount;
      let effectiveDate = today;
      
      if (isBasePaid && feeTransactions.length > 0) {
        const lastTx = feeTransactions.sort((a, b) => b.createdAt - a.createdAt)[0];
        effectiveDate = lastTx.createdAt;
      }

      if (effectiveDate > fee.dueDate) {
        const daysLate = Math.floor((effectiveDate - fee.dueDate) / (1000 * 60 * 60 * 24));
        if (daysLate > 0) {
          calculatedLateFee = daysLate * fee.lateFeePerDay;
        }
      }
    }

    const totalAmountWithFines = fee.amount + calculatedLateFee;
    let balance = 0;
    let isFullyPaid = true;

    if (fee.type === 'DISCOUNT') {
      totalDiscounts += fee.amount;
    } else {
      if (fee.type === 'FINE') {
        totalFines += fee.amount;
      } else {
        baseFees += fee.amount;
      }
      totalFines += calculatedLateFee;
      
      balance = totalAmountWithFines - paidTowardsThisFee;
      isFullyPaid = paidTowardsThisFee >= totalAmountWithFines;
      totalPaid += paidTowardsThisFee;
    }

    return {
      feeStructure: fee,
      baseAmount: fee.amount,
      lateFee: calculatedLateFee,
      amount: totalAmountWithFines,
      paid: paidTowardsThisFee,
      balance,
      isFullyPaid
    };
  });

  const totalDue = baseFees + totalFines;
  const totalBalance = Math.max(0, totalDue - totalDiscounts - totalPaid);

  return {
    student,
    summary: {
      baseFees,
      totalFines,
      totalDiscounts,
      totalDue,
      totalPaid,
      totalBalance
    },
    ledgerDetails,
    transactions
  };
};

const processPayment = async (studentId, data, actorId, req) => {
  try {
    const feeStructure = await FeeStructure.findById(data.feeStructureId);
    if (!feeStructure) throw new AppError('Fee structure not found', 404, ERROR_CODES.NOT_FOUND);

    // Idempotency Check: Does this transactionReference already exist?
    const existingTx = await FeeTransaction.findOne({ transactionReference: data.transactionReference });
    if (existingTx) {
      throw new AppError('Transaction reference already exists (Duplicate Request)', 409, ERROR_CODES.DUPLICATE_ENTRY);
    }

    const transaction = await FeeTransaction.create([{
      studentId,
      feeStructureId: data.feeStructureId,
      amountPaid: data.amountPaid,
      transactionReference: data.transactionReference,
      paymentMethod: data.paymentMethod,
      remarks: data.remarks
    }]);

    await logAuditEvent({
      actorId,
      action: 'FEE_PAYMENT_RECORDED',
      targetId: transaction[0]._id,
      targetModel: 'FeeTransaction',
      after: transaction[0].toObject(),
      req,
    });

    return transaction[0];
  } catch (error) {
    // If it's our custom AppError (like the duplicate entry), rethrow it
    if (error instanceof AppError) throw error;
    // Otherwise it might be a MongoDB duplicate key error on the unique index
    if (error.code === 11000) {
      throw new AppError('Transaction reference already exists (Duplicate Request)', 409, ERROR_CODES.DUPLICATE_ENTRY);
    }
    throw error;
  }
};

module.exports = {
  createFeeStructure,
  getFeeStructures,
  getStudentFeeLedger,
  processPayment,
  updateFeeStructure
};
