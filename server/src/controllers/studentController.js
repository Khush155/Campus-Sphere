const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const Examination = require('../models/Examination');
const ExamResult = require('../models/ExamResult');
const Notice = require('../models/Notice');
const Subject = require('../models/Subject');
const TimetableSlot = require('../models/TimetableSlot');
const User = require('../models/User');

exports.getDashboardSummary = async (req, res) => {
  try {
    const studentId = req.user.id;
    const student = await User.findById(studentId).populate('department');

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const departmentId = student.department?._id;
    const semester = student.semester;

    // 1. Total Subjects & Credits
    const subjects = await Subject.find({ department: departmentId, semester: semester });
    const totalSubjects = subjects.length;
    // For credits completed, we need all past passed subjects. As a simplified proxy, we'll calculate from all ExamResults > passing grade, or just mock it based on semester for now.
    const creditsCompleted = (semester - 1) * 20; // 20 credits per semester on average

    // 2. Attendance Stats
    const totalAttendanceRecords = await Attendance.countDocuments({ studentId });
    const presentRecords = await Attendance.countDocuments({ studentId, status: 'Present' });
    const attendancePercentage = totalAttendanceRecords > 0 ? Math.round((presentRecords / totalAttendanceRecords) * 100) : 0;

    // Monthly Trend (Mocked via aggregation but fallback if empty)
    // In a real scenario, group by month. For this endpoint, we'll send a dynamic empty state if 0 records.
    let monthlyTrend = [];
    if (totalAttendanceRecords === 0) {
      monthlyTrend = [
        { month: 'Jan', attendance: 0 }, { month: 'Feb', attendance: 0 }, { month: 'Mar', attendance: 0 }
      ];
    } else {
      // Very basic mock for monthly trend based on actual percentage
      monthlyTrend = [
        { month: 'Last', attendance: attendancePercentage - 2 },
        { month: 'Current', attendance: attendancePercentage }
      ];
    }

    // Subject-wise Attendance
    const subjectWiseAgg = await Attendance.aggregate([
      { $match: { studentId: new mongoose.Types.ObjectId(studentId) } },
      { $group: {
        _id: '$subjectId',
        total: { $sum: 1 },
        present: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } }
      }}
    ]);
    
    // Map subject IDs to names
    const subjectWise = [];
    for (let s of subjectWiseAgg) {
      const subjectDoc = subjects.find(sub => sub._id.toString() === s._id.toString());
      if (subjectDoc) {
        subjectWise.push({
          subject: subjectDoc.name,
          percentage: Math.round((s.present / s.total) * 100)
        });
      }
    }

    // 3. Pending Assignments
    const activeAssignments = await Assignment.find({
      departmentId, semester, status: 'Active'
    });
    const submissions = await AssignmentSubmission.find({ studentId }).select('assignmentId');
    const submittedAssignmentIds = submissions.map(s => s.assignmentId.toString());
    const pendingAssignments = activeAssignments.filter(a => !submittedAssignmentIds.includes(a._id.toString())).length;

    // 4. Upcoming Exams
    const upcomingExams = await Examination.countDocuments({
      departmentId, semester, date: { $gte: new Date() }, status: 'Scheduled'
    });

    // 5. SGPA (Mocked based on past results or static for now)
    // To properly calculate SGPA requires complex credit-weight logic.
    const currentSgpa = 8.5; // Placeholder until calculation engine is built

    // 6. Notices
    const recentNotices = await Notice.find({
      $or: [
        { targetRoles: 'STUDENT' },
        { targetRoles: { $size: 0 } } // General notices
      ],
      $or: [
        { targetDepartments: departmentId },
        { targetDepartments: { $size: 0 } }
      ]
    }).sort({ date: -1 }).limit(3);
    const notificationsCount = recentNotices.length;

    // 7. Today's Classes
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const todaySlots = await TimetableSlot.find({
      departmentId, semester, dayOfWeek: today
    }).populate('subjectId').populate('facultyId').sort({ startTime: 1 });

    const todayClasses = todaySlots.map(slot => ({
      id: slot._id,
      time: `${slot.startTime} - ${slot.endTime}`,
      subject: slot.subjectId ? slot.subjectId.name : 'Unknown',
      room: slot.room,
      type: slot.type
    }));

    res.status(200).json({
      success: true,
      data: {
        attendance: {
          percentage: attendancePercentage,
          monthlyTrend,
          subjectWise
        },
        currentSgpa,
        pendingAssignments,
        upcomingExams,
        totalSubjects,
        creditsCompleted,
        notificationsCount,
        recentNotices: recentNotices.map(n => ({
          id: n._id, title: n.title, date: n.date, category: n.category, priority: n.priority
        })),
        todayClasses
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
