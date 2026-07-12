const admissionService = require('../services/admissionService');
const { applyAdmissionSchema, actionAdmissionSchema } = require('../validators/admissionValidator');
const { successResponse } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');
const { generateAdmissionLetter } = require('../utils/pdfService');
const AdmissionApplication = require('../models/AdmissionApplication');
const User = require('../models/User');

const apply = async (req, res) => {
  const parsedData = applyAdmissionSchema.safeParse(req.body);
  if (!parsedData.success) {
    throw new AppError('Validation failed', 400, ERROR_CODES.VALIDATION_ERROR, parsedData.error.errors);
  }

  if (!req.file) {
    throw new AppError('Photo upload is required', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  const application = await admissionService.submitApplication({
    ...parsedData.data,
    photoUrl: `/uploads/photos/${req.file.filename}`,
  });
  return successResponse(res, 201, 'Admission application submitted successfully', application);
};

const getPendingQueue = async (req, res) => {
  const queue = await admissionService.getPendingApplications();
  return successResponse(res, 200, 'Fetched pending applications', queue);
};

const actionApplication = async (req, res) => {
  const applicationId = req.params.id;
  const parsedData = actionAdmissionSchema.safeParse(req.body);
  if (!parsedData.success) {
    throw new AppError('Validation failed', 400, ERROR_CODES.VALIDATION_ERROR, parsedData.error.errors);
  }

  const result = await admissionService.actionApplication(applicationId, parsedData.data.action, parsedData.data.notes, req.user._id, req);
  
  if (parsedData.data.action === 'APPROVE') {
    return successResponse(res, 200, `Application approved and student account created.`, result);
  }
  return successResponse(res, 200, 'Application rejected', result);
};

const downloadLetter = async (req, res) => {
  const applicationId = req.params.id;
  const { rawPassword } = req.body;

  if (!rawPassword) {
    throw new AppError('Raw password is required to generate the letter', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  const application = await AdmissionApplication.findById(applicationId)
    .populate('departmentId')
    .populate('courseId')
    .populate('branchId');

  if (!application || application.status !== 'APPROVED') {
    throw new AppError('Valid approved application not found', 404, ERROR_CODES.NOT_FOUND);
  }

  const student = await User.findOne({ email: application.email });
  if (!student) {
    throw new AppError('Minted student account not found', 404, ERROR_CODES.NOT_FOUND);
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=Admission_Letter_${student._id}.pdf`);

  // Stream PDF to client
  generateAdmissionLetter(student, application, rawPassword, res);
};

module.exports = {
  apply,
  getPendingQueue,
  actionApplication,
  downloadLetter,
};
