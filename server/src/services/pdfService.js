const PDFDocument = require('pdfkit');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');
const { drawLetterhead } = require('../utils/pdfBranding');
const { logAuditEvent } = require('../utils/auditLogger');
const logger = require('../utils/logger');

/**
 * Builds bonafide certificate text block dynamically.
 */
const buildBonafideText = (user, purpose) => {
  const branchText = user.branchId?.name ? ` in the specialization branch of ${user.branchId.name}` : '';
  const courseText = user.courseId?.name ? ` enrolled in the ${user.courseId.name} program` : ' enrolled at this institution';
  const semesterText = user.semester ? `, currently studying in Semester ${user.semester}` : '';

  return `This is to certify that Mr./Ms. ${user.name}, registration ID ${user._id}, is a bonafide student of this institution${courseText}${branchText}${semesterText}. To the best of our knowledge, their conduct has been exemplary during their tenure here. This certificate is officially issued at their request for the purpose of: ${purpose || 'General Academic Purposes'}.`;
};

/**
 * Builds transfer certificate text block dynamically.
 */
const buildTransferText = (user) => {
  const branchText = user.branchId?.name ? ` in ${user.branchId.name}` : '';
  const courseText = user.courseId?.name ? ` the ${user.courseId.name} program` : ' their program';

  return `This is to certify that Mr./Ms. ${user.name}, registration ID ${user._id}, was a student of this institution studying${courseText}${branchText}. They have cleared all institutional dues, library returns, and laboratory balances. There is no objection from this institution to their seeking admission at any other accredited university or institution. We wish them success in their future academic pursuits.`;
};

/**
 * Builds character certificate text block dynamically.
 */
const buildCharacterText = (user) => {
  const branchText = user.branchId?.name ? ` in ${user.branchId.name}` : '';
  const courseText = user.courseId?.name ? ` the ${user.courseId.name} program` : ' their program';

  return `This is to certify that Mr./Ms. ${user.name}, registration ID ${user._id}, is/was a student of this institution, completing${courseText}${branchText}. During their tenure at CampusSphere, they have shown great diligence, high moral character, and cooperative behavior. Their character and conduct have been found to be Good.`;
};

/**
 * Streams a single ID card PDF to the write-stream response.
 */
const generateIdCardStream = async (userId, res) => {
  const user = await User.findById(userId)
    .populate('departmentId', 'name')
    .populate('branchId', 'name');

  if (!user) {
    throw new AppError('User not found.', 404, ERROR_CODES.NOT_FOUND);
  }

  if (!['STUDENT', 'FACULTY', 'HOD'].includes(user.role)) {
    throw new AppError(
      'ID cards are only available for Student, Faculty, and HOD roles.',
      400,
      ERROR_CODES.VALIDATION_ERROR
    );
  }

  // Set HTTP Stream Headers
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="idcard-${user._id}.pdf"`);

  const doc = new PDFDocument({ size: [243, 153], margin: 10 });
  doc.pipe(res);

  // Render branding header
  await drawLetterhead(doc);

  // ID Card Content Details
  doc.fontSize(9).font('Helvetica-Bold').fillColor('#1c2e45').text(user.name, 12, 45, { width: 219, ellipsis: true });
  doc.fontSize(7).font('Helvetica').fillColor('#4b5563').text(`Role: ${user.role}`, 12, 60);

  let yPos = 72;
  if (user.departmentId) {
    doc.text(`Dept: ${user.departmentId.name}`, 12, yPos, { width: 219, ellipsis: true });
    yPos += 12;
  }
  if (user.role === 'STUDENT' && user.branchId) {
    doc.text(`Branch: ${user.branchId.name}`, 12, yPos, { width: 219, ellipsis: true });
    yPos += 12;
    doc.text(`Semester: ${user.semester || 1}`, 12, yPos);
  }

  // Unique identifier footer
  doc.fontSize(6).font('Helvetica-Bold').fillColor('#9ca3af').text(`ID: ${user._id}`, 12, 135);
  doc.end();
};

/**
 * Streams a single multi-page PDF containing ID cards for a filtered set of users.
 */
const generateBulkIdCardsStream = async (filters, res) => {
  const query = {
    role: { $in: ['STUDENT', 'FACULTY', 'HOD'] },
    status: 'ACTIVE',
  };

  if (filters.departmentId) {
    query.departmentId = filters.departmentId;
  }
  if (filters.role) {
    query.role = filters.role;
  }

  const users = await User.find(query)
    .populate('departmentId', 'name')
    .populate('branchId', 'name')
    .sort({ name: 1 });

  if (users.length === 0) {
    throw new AppError('No matching active users found for ID generation.', 404, ERROR_CODES.NOT_FOUND);
  }

  // Set HTTP Stream Headers
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline; filename="bulk-idcards.pdf"');

  const doc = new PDFDocument({ size: [243, 153], margin: 10 });
  doc.pipe(res);

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    if (i > 0) {
      doc.addPage();
    }

    await drawLetterhead(doc);

    // ID Card Content Details
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#1c2e45').text(user.name, 12, 45, { width: 219, ellipsis: true });
    doc.fontSize(7).font('Helvetica').fillColor('#4b5563').text(`Role: ${user.role}`, 12, 60);

    let yPos = 72;
    if (user.departmentId) {
      doc.text(`Dept: ${user.departmentId.name}`, 12, yPos, { width: 219, ellipsis: true });
      yPos += 12;
    }
    if (user.role === 'STUDENT' && user.branchId) {
      doc.text(`Branch: ${user.branchId.name}`, 12, yPos, { width: 219, ellipsis: true });
      yPos += 12;
      doc.text(`Semester: ${user.semester || 1}`, 12, yPos);
    }

    doc.fontSize(6).font('Helvetica-Bold').fillColor('#9ca3af').text(`ID: ${user._id}`, 12, 135);
  }

  doc.end();
};

/**
 * Generates and streams a letter-sized formal certificate.
 */
const generateCertificateStream = async ({ studentId, type, purpose }, actorId, res) => {
  const student = await User.findById(studentId)
    .populate('departmentId', 'name')
    .populate('courseId', 'name')
    .populate('branchId', 'name');

  if (!student) {
    throw new AppError('Student not found.', 404, ERROR_CODES.NOT_FOUND);
  }

  if (student.role !== 'STUDENT') {
    throw new AppError('Certificates can only be generated for students.', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  let bodyText = '';
  let titleText = '';

  switch (type) {
    case 'BONAFIDE':
      titleText = 'BONAFIDE CERTIFICATE';
      bodyText = buildBonafideText(student, purpose);
      break;
    case 'TRANSFER':
      titleText = 'TRANSFER CERTIFICATE';
      bodyText = buildTransferText(student);
      break;
    case 'CHARACTER':
      titleText = 'CHARACTER CERTIFICATE';
      bodyText = buildCharacterText(student);
      break;
    default:
      throw new AppError('Invalid certificate type specified.', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  // Set HTTP Stream Headers
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="certificate-${student._id}.pdf"`);

  const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
  doc.pipe(res);

  // Render branding header
  await drawLetterhead(doc);

  // Certificate Document Title
  doc.fontSize(18)
    .font('Helvetica-Bold')
    .fillColor('#1c2e45')
    .text(titleText, 50, 160, { align: 'center', underline: true });

  // Body content paragraph
  doc.fontSize(11)
    .font('Helvetica')
    .fillColor('#374151')
    .text(bodyText, 50, 240, {
      align: 'justify',
      lineGap: 6,
      width: 512,
    });

  // Footer / Signatures mapping
  const dateString = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  doc.fontSize(10)
    .font('Helvetica-Bold')
    .fillColor('#4b5563')
    .text(`Date of Issue: ${dateString}`, 50, 520);

  doc.fontSize(10)
    .font('Helvetica-Bold')
    .fillColor('#4b5563')
    .text('Authorized Signatory', 400, 520, { align: 'right' });

  doc.fontSize(8)
    .font('Helvetica')
    .fillColor('#9ca3af')
    .text('CampusSphere Office Administration', 400, 535, { align: 'right' });

  doc.end();

  // Log Certificate generation to Audit trail
  await logAuditEvent({
    actorId,
    action: 'CERTIFICATE_GENERATED',
    targetId: student._id,
    targetModel: 'User',
    after: {
      type,
      purpose: purpose || 'N/A',
      studentName: student.name,
      studentEmail: student.email,
    },
  });

  logger.info(`[Certificate Generated] Type: ${type} - Student: ${student._id} - Admin: ${actorId}`);
};

module.exports = {
  generateIdCardStream,
  generateBulkIdCardsStream,
  generateCertificateStream,
};
