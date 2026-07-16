const mongoose = require('mongoose');

const attendeeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rsvpStatus: {
    type: String,
    enum: ['PENDING', 'ACCEPTED', 'DECLINED', 'TENTATIVE'],
    default: 'PENDING',
  },
  attendedAt: { type: Date }, // Actual attendance timestamp (set when meeting starts)
}, { _id: false });

const actionItemSchema = new mongoose.Schema({
  description: { type: String, required: true, trim: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  dueDate: { type: Date },
  status: {
    type: String,
    enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE'],
    default: 'PENDING',
  },
  completedAt: { type: Date },
}, { _id: true });

const meetingSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  agenda: { type: String, required: true, trim: true },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  organizerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  // RSVP + attendance tracking per participant
  attendees: [attendeeSchema],
  meetingDate: { type: Date, required: true },
  location: { type: String, required: true, trim: true },
  // Virtual meeting support — user comment: "option to add meeting link"
  meetingLink: { type: String, trim: true }, // Zoom/Google Meet/Teams link
  meetingType: {
    type: String,
    enum: ['IN_PERSON', 'VIRTUAL', 'HYBRID'],
    default: 'IN_PERSON',
  },
  status: {
    type: String,
    enum: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'POSTPONED'],
    default: 'SCHEDULED',
  },
  minutesOfMeeting: { type: String, trim: true },
  // Structured action items with accountability
  actionItems: [actionItemSchema],
  // Postpone metadata
  postponedTo: { type: Date },
  postponedReason: { type: String, trim: true },
}, { timestamps: true });

meetingSchema.index({ departmentId: 1, meetingDate: -1 });
meetingSchema.index({ organizerId: 1, status: 1 });

module.exports = mongoose.model('Meeting', meetingSchema);
