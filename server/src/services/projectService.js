const Project = require('../models/Project');
const { assertHODDeptBound } = require('../utils/privilegeGuard');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');
const ROLES = require('../constants/roles');
const { logAuditEvent } = require('../utils/auditLogger');
const paginate = require('../utils/paginate');

const createProject = async (projectData, actor) => {
  // If HOD or Faculty, enforce their departmentId on the project
  const departmentId = (actor.role === ROLES.HOD || actor.role === ROLES.FACULTY) 
    ? actor.departmentId 
    : projectData.departmentId;

  if (!departmentId) {
    throw new AppError('Department ID is required.', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  const project = await Project.create({
    ...projectData,
    departmentId
  });

  return project;
};

const getProjects = async (queryOptions, actor) => {
  const { departmentId } = queryOptions;
  const filters = {};

  if (departmentId) {
    filters.departmentId = departmentId;
  }

  // Enforce role-based boundaries
  if (actor.role === ROLES.HOD) {
    filters.departmentId = actor.departmentId;
  } else if (actor.role === ROLES.STUDENT) {
    filters.students = actor.id;
  } else if (actor.role === ROLES.FACULTY) {
    filters.guideId = actor.id;
  }

  return await paginate(Project, filters, {
    ...queryOptions,
    populate: [
      { path: 'guideId', select: 'name email designation' },
      { path: 'students', select: 'name email semester rollNumber' }
    ],
    sort: { createdAt: -1 }
  });
};

const updateProjectStatus = async (id, status, actor, req) => {
  const project = await Project.findById(id);
  if (!project) {
    throw new AppError('Project not found', 404, ERROR_CODES.NOT_FOUND);
  }

  // Enforce HOD boundaries
  assertHODDeptBound(actor, project.departmentId);

  const before = { status: project.status };
  project.status = status;
  await project.save();

  // Audit Log
  await logAuditEvent({
    actorId: actor.id,
    action: `PROJECT_STATUS_${status}`,
    targetId: project._id,
    targetModel: 'Project',
    before,
    after: { status },
    req
  });

  return project;
};

module.exports = {
  createProject,
  getProjects,
  updateProjectStatus
};
