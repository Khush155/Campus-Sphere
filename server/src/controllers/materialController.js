const Material = require('../models/Material');
const Faculty = require('../models/Faculty');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');
const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../middlewares/asyncHandler');
const ROLES = require('../constants/roles');

/**
 * @desc    Upload / create new Course Material
 * @route   POST /api/v1/materials
 * @access  Private/Faculty
 */
const createMaterial = asyncHandler(async (req, res, next) => {
  const { title, type, subjectId, semester, group, url, description, fileSize, unit } = req.body;

  // Verify that the user has teaching/admin role
  const isFacultyRole = ['FACULTY', 'HOD', 'SUPER_ADMIN'].includes(req.user.role);
  const facultyRecord = await Faculty.findOne({ userId: req.user.id });
  if (!isFacultyRole && !facultyRecord) {
    return next(new AppError('Only registered Faculty members can upload materials', 403, ERROR_CODES.FORBIDDEN));
  }

  let finalUrl = url;
  let finalSize = fileSize;

  if (req.file) {
    finalUrl = `/uploads/${req.file.filename}`;
    const mb = (req.file.size / (1024 * 1024)).toFixed(1);
    finalSize = mb > 0.1 ? `${mb} MB` : `${Math.round(req.file.size / 1024)} KB`;
  }

  // Create the record
  const newMaterial = await Material.create({
    title,
    type,
    subjectId,
    semester: parseInt(semester, 10) || 1,
    group: group || 'ALL',
    url: finalUrl || 'https://campus.edu/files/resource',
    description,
    fileSize: finalSize || '2.5 MB',
    unit: unit || 'General Reference',
    uploadedBy: req.user.id,
  });

  const populated = await newMaterial.populate([
    { path: 'subjectId', select: 'name code' },
    { path: 'uploadedBy', select: 'name' }
  ]);

  return successResponse(res, 201, 'Course material uploaded successfully', populated);
});

/**
 * @desc    Get all Course Materials (filtered by subject and group/section)
 * @route   GET /api/v1/materials
 * @access  Private/Faculty/Student/Admin
 */

const getMaterials = asyncHandler(async (req, res, _next) => {
  const { subjectId } = req.query;
  const filter = {};

  if (subjectId) {
    filter.subjectId = subjectId;
  }

  if (req.user.role === ROLES.STUDENT) {
    // For students, always enforce their own semester and group.
    // Include materials targeted to their specific group OR to 'ALL'.
    if (req.user.semester) {
      filter.semester = req.user.semester;
    }
    filter.group = { $in: [req.user.group, 'ALL'] };
  } else {
    // For faculty/admin, honour optional group query param
    const { group } = req.query;
    if (group && group !== 'ALL') {
      filter.group = group;
    }
  }

  const materials = await Material.find(filter)
    .populate('subjectId', 'name code')
    .populate('uploadedBy', 'name')
    .sort({ createdAt: -1 });

  return successResponse(res, 200, 'Course materials retrieved successfully', materials);
});


/**
 * @desc    Delete a Course Material
 * @route   DELETE /api/v1/materials/:id
 * @access  Private/Faculty/Admin
 */
const deleteMaterial = asyncHandler(async (req, res, next) => {
  const material = await Material.findById(req.params.id);
  if (!material) {
    return next(new AppError('Material not found', 404, ERROR_CODES.NOT_FOUND));
  }

  // Verify authorization: Only the uploader or an Admin can delete
  if (String(material.uploadedBy) !== String(req.user.id) && req.user.role !== 'SUPER_ADMIN') {
    return next(new AppError('Unauthorized to delete this material', 403, ERROR_CODES.FORBIDDEN));
  }

  await Material.findByIdAndDelete(req.params.id);

  return successResponse(res, 200, 'Course material deleted successfully', null);
});

module.exports = {
  createMaterial,
  getMaterials,
  deleteMaterial,
};
