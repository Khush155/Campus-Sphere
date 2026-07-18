const User = require('../models/User');

// GET /api/v1/student/profile
exports.getProfile = async (req, res, next) => {
  try {
    const student = await User.findById(req.user.id).populate('departmentId').populate('courseId').populate('branchId');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }
    res.status(200).json({ success: true, data: student });
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/student/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { socialLinks } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { socialLinks } },
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, data: updatedUser, message: 'Profile updated successfully' });
  } catch (error) {
    next(error);
  }
};
