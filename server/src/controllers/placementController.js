const PlacementDrive = require('../models/PlacementDrive');
const PlacementApplication = require('../models/PlacementApplication');
const User = require('../models/User');

// GET /api/v1/student/placements
exports.getPlacements = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    
    // Fetch all active/upcoming drives
    const drives = await PlacementDrive.find({
      status: { $in: ['Upcoming', 'Open', 'In Progress'] }
    }).sort({ driveDate: 1 });

    // Fetch my applications
    const applications = await PlacementApplication.find({ studentId })
      .populate('driveId', 'companyName role package status');

    res.status(200).json({
      success: true,
      data: {
        drives,
        applications
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/student/placements/apply/:id
exports.applyForDrive = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const drive = await PlacementDrive.findById(id);
    if (!drive) {
      return res.status(404).json({ success: false, message: 'Drive not found' });
    }

    if (drive.status !== 'Open') {
      return res.status(400).json({ success: false, message: 'Drive is not currently open for applications' });
    }

    const application = await PlacementApplication.create({
      driveId: id,
      studentId: req.user.id,
      status: 'Applied'
    });

    res.status(201).json({ success: true, data: application, message: 'Successfully applied to drive' });
  } catch (error) {
    // Check for duplicate key error (already applied)
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'You have already applied for this drive' });
    }
    next(error);
  }
};
