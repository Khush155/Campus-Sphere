const mongoose = require('mongoose');

/**
 * Working days SLA calculator (skips Sundays).
 * @param {number} workingDays
 * @returns {Date}
 */
const addWorkingDays = (startDate, workingDays) => {
  const date = new Date(startDate);
  let daysAdded = 0;
  while (daysAdded < workingDays) {
    date.setDate(date.getDate() + 1);
    if (date.getDay() !== 0) { // Skip Sundays
      daysAdded++;
    }
  }
  return date;
};

const documentRequestSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  documentType: {
    type: String,
    enum: ['BONAFIDE', 'NOC', 'LOR', 'TRANSCRIPT', 'CHARACTER_CERTIFICATE', 'MIGRATION_CERTIFICATE', 'PROVISIONAL_CERTIFICATE'],
    required: true,
  },
  // Explicit purpose: what is the document being used for?
  purpose: { type: String, required: true, trim: true },
  // Additional context for specific document types
  addressedTo: { type: String, trim: true }, // e.g., for LOR: "VISA Office", for NOC: "Scholarship Board"
  urgency: {
    type: String,
    enum: ['NORMAL', 'URGENT'],
    default: 'NORMAL',
  },
  status: {
    type: String,
    enum: ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'PROCESSED', 'REJECTED', 'READY_FOR_PICKUP'],
    default: 'PENDING',
  },
  // Required when status = REJECTED — no silent rejections
  rejectionReason: { type: String, trim: true },
  processingNotes: { type: String, trim: true }, // Internal HOD notes
  // SLA: 3 working days for NORMAL, 1 working day for URGENT
  slaDeadline: { type: Date },
  slaBreached: { type: Boolean, default: false },
  issueDate: { type: Date }, // Date document was actually issued
  // PDF generation reference — when processed, system stores a document ref
  documentRef: { type: String }, // Path or URL to generated PDF
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  processedAt: { type: Date },
}, { timestamps: true });

// Auto-set SLA based on urgency
documentRequestSchema.pre('save', function (next) {
  if (this.isNew && !this.slaDeadline) {
    const workingDays = this.urgency === 'URGENT' ? 1 : 3;
    this.slaDeadline = addWorkingDays(this.createdAt || new Date(), workingDays);
  }
  next();
});

documentRequestSchema.index({ studentId: 1, status: 1 });
documentRequestSchema.index({ departmentId: 1, status: 1, slaDeadline: 1 });

module.exports = mongoose.model('DocumentRequest', documentRequestSchema);
