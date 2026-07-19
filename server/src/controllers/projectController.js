const Project = require('../models/Project');
const { createProjectSchema } = require('../validators/projectValidator');
const AppError = require('../utils/AppError');

exports.createProject = async (req, res) => {
  const validatedData = createProjectSchema.parse(req.body);
  const project = await Project.create(validatedData);
  res.status(201).json({ success: true, data: project });
};

exports.getProjects = async (req, res) => {
  const filters = {};
  if (req.query.departmentId) {filters.departmentId = req.query.departmentId;}
  const projects = await Project.find(filters).populate('guideId students');
  res.status(200).json({ success: true, data: projects });
};

exports.updateProjectStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const project = await Project.findByIdAndUpdate(id, { status }, { new: true });
  if (!project) {throw new AppError('Project not found', 404);}
  res.status(200).json({ success: true, data: project });
};
