const PDFDocument = require('pdfkit');

const generateAdmissionLetter = (student, application, password, res) => {
  const doc = new PDFDocument({ margin: 50 });

  // Pipe the PDF directly to the response
  doc.pipe(res);

  // Header
  doc
    .fontSize(24)
    .font('Helvetica-Bold')
    .text('CAMPUS SPHERE', { align: 'center' })
    .moveDown(0.5);

  doc
    .fontSize(12)
    .font('Helvetica')
    .text('Official Admission Letter & Counselling Credential', { align: 'center' })
    .moveDown(2);

  // Date and Salutation
  doc
    .fontSize(12)
    .text(`Date: ${new Date().toLocaleDateString()}`)
    .moveDown(2)
    .text(`Dear ${student.name},`)
    .moveDown()
    .text('Congratulations! We are pleased to inform you that your admission application has been approved.')
    .moveDown();

  // Academic Details Table-like format
  doc
    .font('Helvetica-Bold')
    .text('Academic Assignment:', { underline: true })
    .moveDown(0.5);

  doc.font('Helvetica')
    .text(`Student ID: ${student._id}`)
    .text(`Course: ${application.courseId?.name || 'N/A'}`)
    .text(`Branch: ${application.branchId?.name || 'N/A'}`)
    .text(`Department: ${application.departmentId?.name || 'N/A'}`)
    .text(`Semester: ${student.semester}`)
    .text(`Blood Group: ${application.bloodGroup}`)
    .moveDown(2);

  // Document Checklist
  doc
    .font('Helvetica-Bold')
    .text('Mandatory Documents for Counselling:', { underline: true })
    .moveDown(0.5);
  
  doc.font('Helvetica')
    .text('Please bring original copies + 2 sets of photocopies of the following:')
    .moveDown(0.5)
    .text('[  ] 10th Standard Marksheet & Certificate')
    .text('[  ] 12th Standard Marksheet & Certificate')
    .text('[  ] Passport Size Photographs (4 Copies)')
    .text('[  ] Aadhar Card / Government ID Proof')
    .text('[  ] Transfer Certificate (TC)')
    .text('[  ] Migration Certificate (if applicable)')
    .text('[  ] Category / Caste Certificate (if applicable)')
    .moveDown(2);

  // Counselling & Login details
  doc
    .font('Helvetica-Bold')
    .text('Counselling & Portal Access:', { underline: true })
    .moveDown(0.5);

  doc.font('Helvetica')
    .text('Please present this letter during your physical counselling session.')
    .moveDown()
    .text('You can now log in to the CampusSphere student portal using the credentials below:')
    .moveDown(0.5);

  // Credential Box
  doc
    .rect(50, doc.y, 500, 60)
    .fillAndStroke('#f3f4f6', '#d1d5db');
  
  doc
    .fillColor('#000000')
    .font('Helvetica-Bold')
    .text(`Email / Username: ${student.email}`, 60, doc.y - 50)
    .text(`Temporary Password: ${password}`, 60, doc.y + 15)
    .moveDown(4);

  // Footer
  doc.x = 50;
  doc
    .font('Helvetica')
    .text('Welcome to CampusSphere! We look forward to seeing you on campus.', { align: 'left' })
    .moveDown(3)
    .text('Authorized Signatory,', { align: 'right' })
    .text('Admissions Office', { align: 'right' });

  // Finalize PDF file
  doc.end();
};

const generateFeeReceipt = (transaction, res) => {
  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);

  // Header
  doc
    .fontSize(24)
    .font('Helvetica-Bold')
    .text('CAMPUS SPHERE', { align: 'center' })
    .moveDown(0.5);

  doc
    .fontSize(12)
    .font('Helvetica')
    .text('Official Fee Receipt', { align: 'center' })
    .moveDown(2);

  // Receipt Details
  doc.font('Helvetica-Bold').text('Transaction Details:', { underline: true }).moveDown(0.5);
  doc.font('Helvetica')
    .text(`Receipt No / Ref: ${transaction.transactionReference}`)
    .text(`Date of Payment: ${new Date(transaction.paymentDate).toLocaleString()}`)
    .text(`Payment Method: ${transaction.paymentMethod}`)
    .text(`Status: ${transaction.status}`)
    .moveDown(1.5);

  doc.font('Helvetica-Bold').text('Student Details:', { underline: true }).moveDown(0.5);
  doc.font('Helvetica')
    .text(`Name: ${transaction.studentId.name}`)
    .text(`Email: ${transaction.studentId.email}`)
    .text(`Student ID: ${transaction.studentId._id}`)
    .moveDown(2);

  // Amount Box
  doc
    .rect(50, doc.y, 500, 80)
    .fillAndStroke('#f3f4f6', '#d1d5db');
  
  doc
    .fillColor('#000000')
    .font('Helvetica-Bold')
    .text(`Fee Title: ${transaction.feeStructureId.title}`, 60, doc.y - 65)
    .text(`Fee Type: ${transaction.feeStructureId.type}`, 60, doc.y + 10)
    .fontSize(16)
    .text(`Amount Paid: $${transaction.amountPaid.toFixed(2)}`, 320, doc.y - 20)
    .moveDown(4);

  // Footer
  doc.x = 50;
  doc
    .fontSize(12)
    .font('Helvetica')
    .text('This is a computer generated receipt and does not require a physical signature.', { align: 'center' })
    .moveDown(3);

  doc.end();
};

module.exports = {
  generateAdmissionLetter,
  generateFeeReceipt,
};
