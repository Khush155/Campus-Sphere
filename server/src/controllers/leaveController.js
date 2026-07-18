const LeaveRequest = require('../models/LeaveRequest');
const User = require('../models/User');

// GET /api/v1/student/leave
exports.getMyLeaves = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const leaves = await LeaveRequest.find({ studentId }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: leaves });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/student/leave
exports.applyForLeave = async (req, res, next) => {
  try {
    const { startDate, endDate, reason, proofUrl } = req.body;
    const student = await User.findById(req.user.id);

    const leave = await LeaveRequest.create({
      studentId: req.user.id,
      departmentId: student.department, // Assuming department exists on User schema from Phase 1
      startDate,
      endDate,
      reason,
      proofUrl
    });

    res.status(201).json({ success: true, data: leave, message: 'Leave request submitted successfully' });
  } catch (error) {
    next(error);
  }
};
