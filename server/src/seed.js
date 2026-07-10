/* eslint-disable no-console */
const dns = require('dns');
// Direct programmatic override to bypass restrictive local campus DNS servers blocking SRV lookups
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment configurations
dotenv.config({ path: path.join(__dirname, '../.env') });

const env = require('./config/env');
const User = require('./models/User');
const Department = require('./models/Department');
const Course = require('./models/Course');
const Branch = require('./models/Branch');
const Subject = require('./models/Subject');
const Faculty = require('./models/Faculty');
const Attendance = require('./models/Attendance');
const Exam = require('./models/Exam');
const ExamResult = require('./models/ExamResult');
const AuditLog = require('./models/AuditLog');
const ROLES = require('./constants/roles');

const seedDatabase = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error('❌ MONGODB_URI is not defined in the environment variables.');
    process.exit(1);
  }

  try {
    console.log('🔌 Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected successfully!');

    // 1. Purge existing entries to prevent duplication key errors
    console.log('🧹 Purging old collections...');
    await User.deleteMany({});
    await Department.deleteMany({});
    await Course.deleteMany({});
    await Branch.deleteMany({});
    await Subject.deleteMany({});
    await Faculty.deleteMany({});
    await Attendance.deleteMany({});
    await Exam.deleteMany({});
    await ExamResult.deleteMany({});
    await AuditLog.deleteMany({});
    console.log('✅ Collections purged.');

    // 2. Seed default Super Admin
    console.log('👤 Seeding default Super Admin...');
    const adminUser = await User.create({
      name: 'System Administrator',
      email: 'admin@campussphere.edu',
      password: 'admin123',
      role: ROLES.SUPER_ADMIN,
    });
    console.log(`✅ Super Admin created: email: ${adminUser.email}, password: admin123`);

    // 3. Seed Department
    console.log('🏢 Seeding CSE Department...');
    const dept = await Department.create({
      name: 'Computer Science and Engineering Department',
      code: 'CSE-DEPT',
      description: 'Department responsible for computer architecture, software development, and systems logic',
    });
    console.log(`✅ Department created: ${dept.code}`);

    // 4. Seed Course
    console.log('🎓 Seeding B.Tech Course...');
    const course = await Course.create({
      name: 'Bachelor of Technology',
      code: 'B.TECH',
      durationYears: 4,
    });
    console.log(`✅ Course created: ${course.code} (Duration: ${course.durationYears} Years)`);

    // 5. Seed Branch
    console.log('🌿 Seeding CSE Branch under B.Tech...');
    const branch = await Branch.create({
      name: 'Computer Science & Engineering',
      code: 'CSE',
      courseId: course._id,
    });
    console.log(`✅ Branch created: ${branch.code} under Course ID: ${course._id}`);

    // 6. Seed Subjects
    console.log('📘 Seeding CSE Subjects...');
    const dataStructures = await Subject.create({
      name: 'Data Structures and Algorithms',
      code: 'CS301',
      credits: 4,
      type: 'THEORY',
      branchId: branch._id,
      departmentId: dept._id,
      semester: 3,
    });

    const webDev = await Subject.create({
      name: 'Full Stack Web Development',
      code: 'CS302',
      credits: 3,
      type: 'THEORY',
      branchId: branch._id,
      departmentId: dept._id,
      semester: 3,
    });

    console.log(`✅ Subjects created: ${dataStructures.code}, ${webDev.code}`);

    // 7. Seed Faculty & Student Users
    console.log('🌱 Creating user accounts...');
    const facultyUser1 = await User.create({
      name: 'Dr. Alan Turing',
      email: 'alan.turing@campussphere.com',
      password: 'password123',
      role: ROLES.FACULTY,
      departmentId: dept._id,
    });

    const facultyUser2 = await User.create({
      name: 'Dr. Grace Hopper',
      email: 'grace.hopper@campussphere.com',
      password: 'password123',
      role: ROLES.FACULTY,
      departmentId: dept._id,
    });

    const studentUser1 = await User.create({
      name: 'Alice Smith',
      email: 'alice.student@campussphere.com',
      password: 'password123',
      role: ROLES.STUDENT,
      departmentId: dept._id,
      courseId: course._id,
      branchId: branch._id,
      semester: 3,
      group: 'A1',
    });

    const studentUser2 = await User.create({
      name: 'Bob Jones',
      email: 'bob.student@campussphere.com',
      password: 'password123',
      role: ROLES.STUDENT,
      departmentId: dept._id,
      courseId: course._id,
      branchId: branch._id,
      semester: 3,
      group: 'A1',
    });
    console.log('✅ User accounts seeded. (Default passwords: password123)');

    // 8. Create Faculty Profiles
    console.log('🌱 Linking Faculty profiles...');
    const facultyProfile1 = await Faculty.create({
      userId: facultyUser1._id,
      departmentId: dept._id,
      designation: 'Professor',
      phoneNumber: '123-456-7890',
      officeHours: 'Mon, Wed 10:00 AM - 12:00 PM',
      subjects: [dataStructures._id, webDev._id],
    });

    const facultyProfile2 = await Faculty.create({
      userId: facultyUser2._id,
      departmentId: dept._id,
      designation: 'Associate Professor',
      phoneNumber: '987-654-3210',
      officeHours: 'Tue, Thu 2:00 PM - 4:00 PM',
      subjects: [dataStructures._id],
    });
    console.log('✅ Faculty profiles created and subjects assigned.');

    // 9. Seed Attendance records (facultyId references User now)
    console.log('🌱 Seeding mock attendance records...');
    const date1 = new Date();
    date1.setUTCHours(0, 0, 0, 0);
    date1.setUTCDate(date1.getUTCDate() - 2);

    const date2 = new Date();
    date2.setUTCHours(0, 0, 0, 0);
    date2.setUTCDate(date2.getUTCDate() - 1);

    await Attendance.create([
      { studentId: studentUser1._id, subjectId: dataStructures._id, facultyId: facultyUser1._id, date: date1, status: 'PRESENT' },
      { studentId: studentUser2._id, subjectId: dataStructures._id, facultyId: facultyUser1._id, date: date1, status: 'PRESENT' },
      { studentId: studentUser1._id, subjectId: dataStructures._id, facultyId: facultyUser1._id, date: date2, status: 'PRESENT' },
      { studentId: studentUser2._id, subjectId: dataStructures._id, facultyId: facultyUser1._id, date: date2, status: 'ABSENT' },
      { studentId: studentUser1._id, subjectId: webDev._id, facultyId: facultyUser1._id, date: date2, status: 'LATE' },
      { studentId: studentUser2._id, subjectId: webDev._id, facultyId: facultyUser1._id, date: date2, status: 'PRESENT' },
    ]);
    console.log('✅ Mock attendance records seeded.');

    // 10. Seed Exams and Results
    console.log('🌱 Seeding exams and results...');
    const dsaMidterm = await Exam.create({
      name: 'DSA Midterm Assessment',
      subjectId: dataStructures._id,
      examType: 'MID_TERM',
      date: new Date(),
      maxMarks: 50,
      passingMarks: 20,
    });

    const dsaEndterm = await Exam.create({
      name: 'DSA Final Theory Exam',
      subjectId: dataStructures._id,
      examType: 'END_TERM',
      date: new Date(),
      maxMarks: 100,
      passingMarks: 40,
    });

    await ExamResult.create([
      { studentId: studentUser1._id, examId: dsaMidterm._id, marksObtained: 45, isPublished: true },
      { studentId: studentUser2._id, examId: dsaMidterm._id, marksObtained: 35, isPublished: true },
      { studentId: studentUser1._id, examId: dsaEndterm._id, marksObtained: 85, isPublished: false },
    ]);

    console.log('✅ Exams and grading results seeded.');
    console.log('🎉 Database seeding complete!');
  } catch (error) {
    console.error('❌ Seeding failed with error:', error);
  } finally {
    console.log('🔌 Disconnecting from MongoDB...');
    await mongoose.disconnect();
    console.log('👋 Disconnected. Execution complete.');
    process.exit(0);
  }
};

seedDatabase();
