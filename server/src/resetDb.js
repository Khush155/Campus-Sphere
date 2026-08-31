/* eslint-disable no-console */
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('./models/User');
const CollegeProfile = require('./models/CollegeProfile');
const AcademicSession = require('./models/AcademicSession');
const Assignment = require('./models/Assignment');
const Attendance = require('./models/Attendance');
const AuditLog = require('./models/AuditLog');
const Branch = require('./models/Branch');
const Complaint = require('./models/Complaint');
const Course = require('./models/Course');
const CrossDeptRequest = require('./models/CrossDeptRequest');
const Department = require('./models/Department');
const DocumentRequest = require('./models/DocumentRequest');
const Exam = require('./models/Exam');
const ExamResult = require('./models/ExamResult');
const Examination = require('./models/Examination');
const Faculty = require('./models/Faculty');
const FacultyAssignment = require('./models/FacultyAssignment');
const Feedback = require('./models/Feedback');
const LeaveRequest = require('./models/LeaveRequest');
const Material = require('./models/Material');
const Meeting = require('./models/Meeting');
const Notice = require('./models/Notice');
const Notification = require('./models/Notification');
const PlacementApplication = require('./models/PlacementApplication');
const PlacementDrive = require('./models/PlacementDrive');
const PromotionBatch = require('./models/PromotionBatch');
const Result = require('./models/Result');
const Subject = require('./models/Subject');
const TimetableSlot = require('./models/TimetableSlot');
const ROLES = require('./constants/roles');

const resetDatabase = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error('❌ MONGODB_URI is not defined in the environment variables.');
    process.exit(1);
  }

  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected successfully!');

    console.log('🧹 Purging all collections...');

    await Promise.all([
      User.deleteMany({}),
      CollegeProfile.deleteMany({}),
      AcademicSession.deleteMany({}),
      Assignment.deleteMany({}),
      Attendance.deleteMany({}),
      AuditLog.deleteMany({}),
      Branch.deleteMany({}),
      Complaint.deleteMany({}),
      Course.deleteMany({}),
      CrossDeptRequest.deleteMany({}),
      Department.deleteMany({}),
      DocumentRequest.deleteMany({}),
      Exam.deleteMany({}),
      ExamResult.deleteMany({}),
      Examination.deleteMany({}),
      Faculty.deleteMany({}),
      FacultyAssignment.deleteMany({}),
      Feedback.deleteMany({}),
      LeaveRequest.deleteMany({}),
      Material.deleteMany({}),
      Meeting.deleteMany({}),
      Notice.deleteMany({}),
      Notification.deleteMany({}),
      PlacementApplication.deleteMany({}),
      PlacementDrive.deleteMany({}),
      PromotionBatch.deleteMany({}),
      Result.deleteMany({}),
      Subject.deleteMany({}),
      TimetableSlot.deleteMany({}),
    ]);
    console.log('✅ All collections purged.');

    console.log('👑 Creating singleton Super Admin account...');
    const superAdmin = await User.create({
      name: 'System Administrator',
      email: 'admin@campussphere.edu',
      password: 'admin123',
      role: ROLES.SUPER_ADMIN,
      status: 'ACTIVE',
    });

    console.log('🏫 Initializing clean College Profile...');
    await CollegeProfile.create({
      name: 'CampusSphere Academy',
      affiliation: 'Affiliated to State University',
      address: '100 University Campus Road',
      contactEmail: 'contact@campussphere.edu',
      contactPhone: '+91 98765 43210',
    });

    console.log('\n==================================================');
    console.log('🎉 DATABASE CLEAN RESET SUCCESSFUL!');
    console.log('==================================================');
    console.log('Super Admin Credentials:');
    console.log(`  Email:    admin@campussphere.edu`);
    console.log(`  Password: admin123`);
    console.log(`  Role:     SUPER_ADMIN`);
    console.log(`  User ID:  ${superAdmin._id}`);
    console.log('==================================================\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting database:', error.message);
    process.exit(1);
  }
};

resetDatabase();
