const ApprovalRequest = require('../models/ApprovalRequest');
const { successResponse } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');

// @desc    Get all approval requests (pending by default)
// @route   GET /api/v1/approvals
// @access  Private (Admin/College Admin)
exports.getApprovals = async (req, res, next) => {
  const { status = 'Pending' } = req.query;
  const filter = status !== 'All' ? { status } : {};
  
  const requests = await ApprovalRequest.find(filter)
    .populate('requestedBy', 'firstName lastName')
    .sort('-createdAt')
    .lean();

  const formattedRequests = requests.map(req => ({
    id: req._id,
    type: req.type,
    title: req.title,
    description: req.description,
    status: req.status,
    date: new Date(req.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }),
    requestedBy: req.requestedBy ? `${req.requestedBy.firstName} ${req.requestedBy.lastName}` : 'Unknown',
    color: req.color,
  }));

  return successResponse(res, 200, 'Approvals retrieved successfully', formattedRequests);
};

// @desc    Approve or Reject a request
// @route   PATCH /api/v1/approvals/:id
// @access  Private (Admin/College Admin)
exports.updateApprovalStatus = async (req, res, next) => {
  const { status } = req.body;
  if (!['Approved', 'Rejected'].includes(status)) {
    return next(new AppError('Status must be Approved or Rejected', 400));
  }

  const approval = await ApprovalRequest.findByIdAndUpdate(
    req.params.id,
    { 
      status, 
      actionedBy: req.user.id,
      actionedAt: Date.now() 
    },
    { new: true, runValidators: true }
  );

  if (!approval) {
    return next(new AppError('Approval request not found', 404));
  }

  return successResponse(res, 200, `Request ${status.toLowerCase()} successfully`, approval);
};
