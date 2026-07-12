const AdmissionApplication = require('../models/AdmissionApplication');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const Department = require('../models/Department');
const Course = require('../models/Course');
const Branch = require('../models/Branch');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');
const logger = require('../utils/logger');
const { logAuditEvent } = require('../utils/auditLogger');
const { sendEmail } = require('../utils/emailService');
const crypto = require('crypto');

const generateRandomPassword = () => crypto.randomBytes(4).toString('hex'); // 8 char random password

const submitApplication = async (data) => {
  // Check if email already in use
  const existingUser = await User.findOne({ email: data.email });
  if (existingUser) {
    throw new AppError('An account with this email already exists.', 400, ERROR_CODES.VALIDATION_ERROR);
  }
  
  const existingApp = await AdmissionApplication.findOne({ email: data.email, status: 'PENDING' });
  if (existingApp) {
    throw new AppError('An admission application with this email is already pending.', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  // Verify Dept, Course, Branch
  const dept = await Department.findById(data.departmentId);
  if (!dept) throw new AppError('Department not found', 404, ERROR_CODES.NOT_FOUND);
  
  const course = await Course.findById(data.courseId);
  if (!course) throw new AppError('Course not found', 404, ERROR_CODES.NOT_FOUND);
  
  const branch = await Branch.findById(data.branchId);
  if (!branch) throw new AppError('Branch not found', 404, ERROR_CODES.NOT_FOUND);

  const application = await AdmissionApplication.create(data);
  return application;
};

const getPendingApplications = async () => {
  return await AdmissionApplication.find({ status: 'PENDING' })
    .populate('departmentId', 'name')
    .populate('courseId', 'name')
    .populate('branchId', 'name')
    .sort({ createdAt: 1 });
};

const actionApplication = async (applicationId, action, notes, actorId, req) => {
  const application = await AdmissionApplication.findById(applicationId);
  if (!application) {
    throw new AppError('Application not found', 404, ERROR_CODES.NOT_FOUND);
  }
  if (application.status !== 'PENDING') {
    throw new AppError(`Application is already ${application.status}`, 400, ERROR_CODES.VALIDATION_ERROR);
  }

  if (action === 'REJECT') {
    application.status = 'REJECTED';
    application.notes = notes;
    await application.save();
    
    await logAuditEvent({
      actorId,
      action: 'ADMISSION_REJECTED',
      targetId: application._id,
      targetModel: 'AdmissionApplication',
      after: { status: 'REJECTED' },
      req,
    });
    return application;
  }

  if (action === 'APPROVE') {
    // Mint Student User
    const rawPassword = generateRandomPassword();
    
    const newUser = await User.create({
      name: application.name,
      email: application.email,
      password: rawPassword,
      role: 'STUDENT',
      departmentId: application.departmentId,
      courseId: application.courseId,
      branchId: application.branchId,
      semester: 1, // Freshmen start at semester 1
    });

    // Create Student Profile
    await StudentProfile.create({
      userId: newUser._id,
      dateOfBirth: application.dateOfBirth,
      contactNumber: application.contactNumber,
      guardianName: application.guardianName,
      address: application.address,
    });

    application.status = 'APPROVED';
    application.notes = notes || `Minted user: ${newUser._id}`;
    await application.save();

    await logAuditEvent({
      actorId,
      action: 'ADMISSION_APPROVED',
      targetId: application._id,
      targetModel: 'AdmissionApplication',
      after: { status: 'APPROVED', mintedUserId: newUser._id },
      req,
    });
    
    // Send Automated Email
    try {
      await sendEmail({
        email: application.email,
        subject: 'Welcome to CampusSphere - Admission Approved!',
        message: `Dear ${application.name},\n\nCongratulations! Your admission has been approved.\n\nYou can log in to the student portal using these credentials:\nEmail: ${application.email}\nPassword: ${rawPassword}\n\nPlease change your password after logging in.\n\nBest,\nAdmissions Office`,
        html: `
          <h3>Welcome to CampusSphere, ${application.name}!</h3>
          <p>We are thrilled to inform you that your admission application has been approved.</p>
          <p>You can now log in to the student portal using your credentials below:</p>
          <div style="background: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Username:</strong> ${application.email}</p>
            <p><strong>Password:</strong> ${rawPassword}</p>
          </div>
          <p><em>Please ensure you change your password upon your first login.</em></p>
          <br/>
          <p>Best regards,<br/>The Admissions Office</p>
        `
      });
    } catch (err) {
      logger.error('Failed to send admission email', err);
    }

    return { application, mintedUser: newUser, rawPassword };
  }
};

module.exports = {
  submitApplication,
  getPendingApplications,
  actionApplication,
};
