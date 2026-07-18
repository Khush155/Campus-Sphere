const Project = require('../models/Project');
const Achievement = require('../models/Achievement');
const ClubMembership = require('../models/ClubMembership');
const Club = require('../models/Club');
const User = require('../models/User');

// GET /api/v1/student/portfolio
exports.getPortfolio = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    // 1. Get Projects
    const projects = await Project.find({ studentId }).sort({ createdAt: -1 });

    // 2. Get Achievements
    const achievements = await Achievement.find({ studentId }).sort({ dateEarned: -1 });

    // 3. Get Club Memberships
    const memberships = await ClubMembership.find({ studentId, status: 'Active' })
      .populate('clubId', 'name category logoUrl');

    res.status(200).json({
      success: true,
      data: {
        projects,
        achievements,
        clubs: memberships.map(m => ({
          id: m.clubId._id,
          name: m.clubId.name,
          category: m.clubId.category,
          role: m.role,
          joinedAt: m.joinedAt
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/student/portfolio/achievements
exports.addAchievement = async (req, res, next) => {
  try {
    const { title, category, description, dateEarned, proofUrl } = req.body;

    const achievement = await Achievement.create({
      studentId: req.user.id,
      title,
      category,
      description,
      dateEarned,
      proofUrl
    });

    res.status(201).json({ success: true, data: achievement, message: 'Achievement added successfully' });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/student/portfolio/projects
exports.addProject = async (req, res, next) => {
  try {
    const { title, description, type, githubLink, demoLink } = req.body;
    const student = await User.findById(req.user.id);

    const project = await Project.create({
      studentId: req.user.id,
      departmentId: student.department,
      semester: student.semester,
      title,
      description,
      type,
      githubLink,
      demoLink
    });

    res.status(201).json({ success: true, data: project, message: 'Project added successfully' });
  } catch (error) {
    next(error);
  }
};
