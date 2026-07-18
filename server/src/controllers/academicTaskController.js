const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const User = require('../models/User');

// GET /api/v1/student/tasks/assignments
exports.getMyAssignments = async (req, res, next) => {
  try {
    const student = await User.findById(req.user.id);
    
    // Fetch all active assignments for the student's department and semester
    const assignments = await Assignment.find({
      departmentId: student.department,
      semester: student.semester
    }).populate('subjectId', 'name code').populate('facultyId', 'name');

    // Fetch all submissions by this student
    const submissions = await AssignmentSubmission.find({ studentId: req.user.id });

    // Map submissions to assignments
    const data = assignments.map(a => {
      const submission = submissions.find(s => s.assignmentId.toString() === a._id.toString());
      return {
        _id: a._id,
        title: a.title,
        description: a.description,
        subject: a.subjectId?.name,
        faculty: a.facultyId?.name,
        deadline: a.deadline,
        maxMarks: a.maxMarks,
        status: submission ? submission.status : (new Date() > a.deadline ? 'Late' : 'Pending'),
        submission: submission || null
      };
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/student/tasks/assignments/:id/submit
exports.submitAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { feedback } = req.body; // Usually text response, or file url logic later

    // Check if assignment exists
    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    // Check if already submitted
    let submission = await AssignmentSubmission.findOne({ assignmentId: id, studentId: req.user.id });
    
    if (submission) {
      // Update existing
      submission.feedback = feedback || submission.feedback;
      submission.submittedAt = Date.now();
      submission.status = new Date() > assignment.deadline ? 'Late' : 'Submitted';
      await submission.save();
    } else {
      // Create new
      submission = await AssignmentSubmission.create({
        assignmentId: id,
        studentId: req.user.id,
        feedback,
        status: new Date() > assignment.deadline ? 'Late' : 'Submitted'
      });
    }

    res.status(200).json({ success: true, data: submission, message: 'Assignment submitted successfully' });
  } catch (error) {
    next(error);
  }
};
