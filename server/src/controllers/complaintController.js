const Complaint = require('../models/Complaint');
const User = require('../models/User');

// GET /api/v1/student/complaints
exports.getMyComplaints = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const complaints = await Complaint.find({ studentId }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: complaints });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/student/complaints
exports.raiseComplaint = async (req, res, next) => {
  try {
    const { title, description, category, attachmentUrl } = req.body;
    const student = await User.findById(req.user.id);

    const complaint = await Complaint.create({
      studentId: req.user.id,
      departmentId: student.department,
      title,
      description,
      category,
      attachmentUrl
    });

    res.status(201).json({ success: true, data: complaint, message: 'Complaint raised successfully' });
  } catch (error) {
    next(error);
  }
};
