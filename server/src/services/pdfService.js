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
  const rollText = user.rollNumber ? ` (Roll No: ${user.rollNumber})` : ` (${user.email})`;
  const branchText = user.branchId?.name ? ` in the specialization branch of ${user.branchId.name}` : '';
  const courseText = user.courseId?.name ? ` enrolled in the ${user.courseId.name} program` : ' enrolled at this institution';
  const semesterText = user.semester ? `, currently studying in Semester ${user.semester}` : '';
  const purposeClause = purpose?.trim() ? ` This certificate is officially issued at their request for the purpose of: "${purpose.trim()}".` : ' This certificate is officially issued at their request for general academic purposes.';

  return `This is to certify that Mr./Ms. ${user.name}${rollText} is a bonafide student of this institution${courseText}${branchText}${semesterText}. To the best of our knowledge, their conduct has been exemplary during their tenure here.${purposeClause}`;
};

/**
 * Builds transfer certificate text block dynamically.
 */
const buildTransferText = (user, purpose) => {
  const rollText = user.rollNumber ? ` (Roll No: ${user.rollNumber})` : ` (${user.email})`;
  const branchText = user.branchId?.name ? ` in ${user.branchId.name}` : '';
  const courseText = user.courseId?.name ? ` the ${user.courseId.name} program` : ' their program';
  const purposeClause = purpose?.trim() ? ` Stated Reason / Details: "${purpose.trim()}".` : '';

  return `This is to certify that Mr./Ms. ${user.name}${rollText} was a student of this institution studying${courseText}${branchText}. They have cleared all institutional dues, library returns, and laboratory balances. There is no objection from this institution to their seeking admission at any other accredited university or institution.${purposeClause} We wish them success in their future academic pursuits.`;
};

/**
 * Builds character certificate text block dynamically.
 */
const buildCharacterText = (user, purpose) => {
  const rollText = user.rollNumber ? ` (Roll No: ${user.rollNumber})` : ` (${user.email})`;
  const branchText = user.branchId?.name ? ` in ${user.branchId.name}` : '';
  const courseText = user.courseId?.name ? ` the ${user.courseId.name} program` : ' their program';
  const purposeClause = purpose?.trim() ? ` Additional Remarks: "${purpose.trim()}".` : '';

  return `This is to certify that Mr./Ms. ${user.name}${rollText} is/was a student of this institution, completing${courseText}${branchText}. During their tenure at CampusSphere, they have shown great diligence, high moral character, and cooperative behavior. Their character and conduct have been found to be Good.${purposeClause}`;
};

/**
 * Builds NOC text block dynamically.
 */
const buildNocText = (user, purpose) => {
  const rollText = user.rollNumber ? ` (Roll No: ${user.rollNumber})` : ` (${user.email})`;
  const branchText = user.branchId?.name ? ` in ${user.branchId.name}` : '';
  const courseText = user.courseId?.name ? ` the ${user.courseId.name} program` : ' their program';
  const purposeText = purpose?.trim() ? `"${purpose.trim()}"` : 'External Internship / Academic Training';

  return `This is to certify that this institution has No Objection to Mr./Ms. ${user.name}${rollText}, a bonafide student pursuing${courseText}${branchText}, undertaking/applying for: ${purposeText}. The institution permits the student to participate provided it does not conflict with scheduled mandatory examinations.`;
};

/**
 * Builds Provisional Degree text block dynamically.
 */
const buildProvisionalText = (user, purpose) => {
  const rollText = user.rollNumber ? ` (Roll No: ${user.rollNumber})` : ` (${user.email})`;
  const branchText = user.branchId?.name ? ` in ${user.branchId.name}` : '';
  const courseText = user.courseId?.name ? ` ${user.courseId.name}` : ' their program';
  const purposeClause = purpose?.trim() ? ` Additional Remarks: "${purpose.trim()}".` : '';

  return `This is to certify that Mr./Ms. ${user.name}${rollText} has successfully completed all academic requirements for the award of the Degree of${courseText}${branchText}. Having fulfilled all prescribed coursework, examinations, and project evaluations, this Provisional Certificate is issued pending the conferment of the Final Degree Diploma at the upcoming Convocation.${purposeClause}`;
};

/**
 * Builds Merit Certificate text block dynamically.
 */
const buildMeritText = (user, purpose) => {
  const rollText = user.rollNumber ? ` (Roll No: ${user.rollNumber})` : ` (${user.email})`;
  const branchText = user.branchId?.name ? ` in ${user.branchId.name}` : '';
  const courseText = user.courseId?.name ? ` ${user.courseId.name}` : ' their program';
  const purposeClause = purpose?.trim() ? ` in recognition of: "${purpose.trim()}"` : ' in recognition of outstanding academic performance, leadership, and exemplary dedication to scholarly pursuits';

  return `This Certificate of Academic Excellence & Merit is proudly awarded to Mr./Ms. ${user.name}${rollText} of${courseText}${branchText} ${purposeClause}.`;
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
      bodyText = buildTransferText(student, purpose);
      break;
    case 'CHARACTER':
      titleText = 'CHARACTER CERTIFICATE';
      bodyText = buildCharacterText(student, purpose);
      break;
    case 'NOC':
      titleText = 'NO OBJECTION CERTIFICATE (NOC)';
      bodyText = buildNocText(student, purpose);
      break;
    case 'PROVISIONAL':
      titleText = 'PROVISIONAL DEGREE CERTIFICATE';
      bodyText = buildProvisionalText(student, purpose);
      break;
    case 'MERIT':
      titleText = 'CERTIFICATE OF MERIT & EXCELLENCE';
      bodyText = buildMeritText(student, purpose);
      break;
    default:
      throw new AppError('Invalid certificate type specified.', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  // Set HTTP Stream Headers
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="certificate-${student._id}.pdf"`);

  const doc = new PDFDocument({ size: 'LETTER', margin: 40 });
  doc.pipe(res);

  // 1. Draw Formal Institutional Page Frame Borders
  const width = doc.page.width;
  const height = doc.page.height;

  // Outer Gold Frame
  doc.rect(20, 20, width - 40, height - 40)
    .lineWidth(2.5)
    .strokeColor('#b8863e')
    .stroke();

  // Inner Navy Frame
  doc.rect(25, 25, width - 50, height - 50)
    .lineWidth(1)
    .strokeColor('#1c2e45')
    .stroke();

  // 2. Render branding letterhead header
  await drawLetterhead(doc);

  // 3. Serial Reference Number & Date Header Line
  const refNo = `Ref: CS/CERT/${new Date().getFullYear()}/${Math.floor(100000 + Math.random() * 900000)}`;
  const dateString = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  doc.fontSize(9)
    .font('Helvetica-Bold')
    .fillColor('#6b7280')
    .text(refNo, 50, 128);

  doc.fontSize(9)
    .font('Helvetica-Bold')
    .fillColor('#6b7280')
    .text(`Date of Issue: ${dateString}`, 380, 128, { align: 'right' });

  // 4. Certificate Document Title
  doc.fontSize(18)
    .font('Helvetica-Bold')
    .fillColor('#1c2e45')
    .text(titleText, 50, 165, { align: 'center' });

  // Title Gold Accent Underline
  doc.moveTo(180, 190)
    .lineTo(width - 180, 190)
    .strokeColor('#b8863e')
    .lineWidth(1.5)
    .stroke();

  // 5. Body Content Paragraph
  doc.fontSize(11)
    .font('Helvetica')
    .fillColor('#374151')
    .text(bodyText, 55, 230, {
      align: 'justify',
      lineGap: 7,
      width: width - 110,
    });

  // 6. Dual Signature Blocks
  const sigY = 560;

  // Left Signature: Controller of Examinations
  doc.fontSize(10)
    .font('Helvetica-Bold')
    .fillColor('#1c2e45')
    .text('Controller of Examinations', 55, sigY);

  doc.fontSize(8)
    .font('Helvetica')
    .fillColor('#6b7280')
    .text('Academic Evaluation Division', 55, sigY + 15);

  // Right Signature: Registrar / Principal
  doc.fontSize(10)
    .font('Helvetica-Bold')
    .fillColor('#1c2e45')
    .text('Registrar & Institutional Seal', 380, sigY, { align: 'right' });

  doc.fontSize(8)
    .font('Helvetica')
    .fillColor('#6b7280')
    .text('CampusSphere Office Administration', 380, sigY + 15, { align: 'right' });

  // Bottom Security Verification Line
  doc.fontSize(7)
    .font('Helvetica')
    .fillColor('#9ca3af')
    .text('This is an official computer-generated document issued by CampusSphere Academic ERP System.', 50, height - 40, { align: 'center' });

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
