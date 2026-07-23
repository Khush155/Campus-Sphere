const projectService = require('../services/projectService');
const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../middlewares/asyncHandler');

/**
 * @desc    Create a new project
 * @route   POST /api/v1/projects
 * @access  Private/SuperAdmin/HOD/Faculty
 */
const createProject = asyncHandler(async (req, res) => {
  const project = await projectService.createProject(req.body, req.user);
  return successResponse(res, 201, 'Project created successfully', project);
});

/**
 * @desc    List projects
 * @route   GET /api/v1/projects
 * @access  Private/SuperAdmin/HOD/Faculty/Student
 */
const getProjects = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const result = await projectService.getProjects(req.query, req.user);
  return successResponse(res, 200, 'Projects retrieved successfully', result.data, {
    total: result.meta.total,
    page: parseInt(page),
    limit: parseInt(limit)
  });
});

/**
 * @desc    Update project status
 * @route   PATCH /api/v1/projects/:id/status
 * @access  Private/SuperAdmin/HOD
 */
const updateProjectStatus = asyncHandler(async (req, res) => {
  const project = await projectService.updateProjectStatus(req.params.id, req.body.status, req.user, req);
  return successResponse(res, 200, 'Project status updated successfully', project);
});

module.exports = {
  createProject,
  getProjects,
  updateProjectStatus,
};
