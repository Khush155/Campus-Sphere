const Material = require('../models/Material');
const Faculty = require('../models/Faculty');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');
const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../middlewares/asyncHandler');

/**
 * @desc    Upload / create new Course Material
 * @route   POST /api/v1/materials
 * @access  Private/Faculty
 */
const createMaterial = asyncHandler(async (req, res, next) => {
  const { title, type, subjectId, semester, group, url, description, fileSize } = req.body;

  // Verify that the user is a registered faculty member
  const faculty = await Faculty.findOne({ userId: req.user.id });
  if (!faculty) {
    return next(new AppError('Only registered Faculty members can upload materials', 403, ERROR_CODES.FORBIDDEN));
  }

  // Create the record
  const newMaterial = await Material.create({
    title,
    type,
    subjectId,
    semester: parseInt(semester, 10),
    group,
    url,
    description,
    fileSize,
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
const getMaterials = asyncHandler(async (req, res, next) => {
  const { subjectId, group } = req.query;
  const filter = {};

  if (subjectId) filter.subjectId = subjectId;
  if (group) filter.group = group;

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
