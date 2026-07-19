/* eslint-disable no-console */
const dns = require('dns');
// Direct programmatic override to bypass restrictive local campus DNS servers blocking SRV lookups
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment configurations
dotenv.config({ path: path.join(__dirname, '../.env') });

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
const TimetableSlot = require('./models/TimetableSlot');
const Material = require('./models/Material');
const Notification = require('./models/Notification');
const Assignment = require('./models/Assignment');
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
    await TimetableSlot.deleteMany({});
    await Material.deleteMany({});
    await Notification.deleteMany({});
    await Assignment.deleteMany({});
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

    // 3. Seed Departments
    console.log('🏢 Seeding Departments...');
    const cseDept = await Department.create({
      name: 'Computer Science and Engineering Department',
      code: 'CSE-DEPT',
      description: 'Department responsible for computer architecture, software development, and systems logic',
    });
    const eceDept = await Department.create({
      name: 'Electronics and Communication Engineering Department',
      code: 'ECE-DEPT',
      description: 'Department responsible for electronics and communication systems',
    });
    console.log(`✅ Departments created: ${cseDept.code}, ${eceDept.code}`);

    // 4. Seed Course
    console.log('🎓 Seeding B.Tech Course...');
    const course = await Course.create({
      name: 'Bachelor of Technology',
      code: 'B.TECH',
      durationYears: 4,
    });
    console.log(`✅ Course created: ${course.code} (Duration: ${course.durationYears} Years)`);

    // 5. Seed Branches
    console.log('🌿 Seeding Branches under B.Tech...');
    const cseBranch = await Branch.create({
      name: 'Computer Science & Engineering',
      code: 'CSE',
      courseId: course._id,
    });
    const eceBranch = await Branch.create({
      name: 'Electronics & Communication Engineering',
      code: 'ECE',
      courseId: course._id,
    });
    console.log(`✅ Branches created: ${cseBranch.code}, ${eceBranch.code}`);

    // 6. Seed Subjects
    console.log('📘 Seeding Subjects...');
    const dsSubject = await Subject.create({
      name: 'Data Structures and Algorithms',
      code: 'CS301',
      credits: 4,
      type: 'THEORY',
      branchId: cseBranch._id,
      departmentId: cseDept._id,
      semester: 3,
    });

    const osSubject = await Subject.create({
      name: 'Operating Systems',
      code: 'CS401',
      credits: 4,
      type: 'THEORY',
      branchId: cseBranch._id,
      departmentId: cseDept._id,
      semester: 3,
    });

    const webDevSubject = await Subject.create({
      name: 'Full Stack Web Development',
      code: 'CS302',
      credits: 3,
      type: 'THEORY',
      branchId: cseBranch._id,
      departmentId: cseDept._id,
      semester: 3,
    });

    const dbmsSubject = await Subject.create({
      name: 'Database Management Systems',
      code: 'CS303',
      credits: 4,
      type: 'THEORY',
      branchId: cseBranch._id,
      departmentId: cseDept._id,
      semester: 3,
    });

    const dsLabSubject = await Subject.create({
      name: 'Data Structures & Algorithms Lab',
      code: 'CS301L',
      credits: 2,
      type: 'PRACTICAL',
      branchId: cseBranch._id,
      departmentId: cseDept._id,
      semester: 3,
    });

    const projectGuidanceSubject = await Subject.create({
      name: 'Project Guidance',
      code: 'CS499',
      credits: 3,
      type: 'THEORY',
      branchId: cseBranch._id,
      departmentId: cseDept._id,
      semester: 3,
    });

    await Subject.create({
      name: 'Digital Signal Processing',
      code: 'EC204',
      credits: 4,
      type: 'THEORY',
      branchId: eceBranch._id,
      departmentId: eceDept._id,
      semester: 4,
    });
    console.log(`✅ Subjects created: ${dsSubject.code}, ${osSubject.code}, ${webDevSubject.code}, ${dbmsSubject.code}, ${dsLabSubject.code}, ${projectGuidanceSubject.code}`);

    // 7. Seed Faculty & Student Users
    console.log('🌱 Creating user accounts...');
    const facultyUser1 = await User.create({
      name: 'Dr. Alan Turing',
      email: 'alan.turing@campussphere.com',
      password: 'password123',
      role: ROLES.FACULTY,
      departmentId: cseDept._id,
    });

    const facultyUser2 = await User.create({
      name: 'Dr. Grace Hopper',
      email: 'grace.hopper@campussphere.com',
      password: 'password123',
      role: ROLES.FACULTY,
      departmentId: cseDept._id,
    });

    // 20 Student Users (10 CSE-A, 10 CSE-B)
    const studentData = [
      // CSE-A
      { name: 'Alice Smith', email: 'alice.student@campussphere.com', rollNumber: 'CS202601', group: 'CSE-A' },
      { name: 'Bob Jones', email: 'bob.student@campussphere.com', rollNumber: 'CS202602', group: 'CSE-A' },
      { name: 'Evelyn Miller', email: 'evelyn.student@campussphere.com', rollNumber: 'CS202603', group: 'CSE-A' },
      { name: 'Frank Davis', email: 'frank.student@campussphere.com', rollNumber: 'CS202604', group: 'CSE-A' },
      { name: 'Grace Taylor', email: 'grace.student@campussphere.com', rollNumber: 'CS202605', group: 'CSE-A' },
      { name: 'Henry Wilson', email: 'henry.student@campussphere.com', rollNumber: 'CS202606', group: 'CSE-A' },
      { name: 'Ivy Thomas', email: 'ivy.student@campussphere.com', rollNumber: 'CS202607', group: 'CSE-A' },
      { name: 'Jack Anderson', email: 'jack.student@campussphere.com', rollNumber: 'CS202608', group: 'CSE-A' },
      { name: 'Karen White', email: 'karen.student@campussphere.com', rollNumber: 'CS202609', group: 'CSE-A' },
      { name: 'Leo Martin', email: 'leo.student@campussphere.com', rollNumber: 'CS202610', group: 'CSE-A' },
      // CSE-B
      { name: 'Charlie Brown', email: 'charlie.student@campussphere.com', rollNumber: 'CS202611', group: 'CSE-B' },
      { name: 'Diana Prince', email: 'diana.student@campussphere.com', rollNumber: 'CS202612', group: 'CSE-B' },
      { name: 'Michael Scott', email: 'michael.student@campussphere.com', rollNumber: 'CS202613', group: 'CSE-B' },
      { name: 'Dwight Schrute', email: 'dwight.student@campussphere.com', rollNumber: 'CS202614', group: 'CSE-B' },
      { name: 'Jim Halpert', email: 'jim.student@campussphere.com', rollNumber: 'CS202615', group: 'CSE-B' },
      { name: 'Pam Beesly', email: 'pam.student@campussphere.com', rollNumber: 'CS202616', group: 'CSE-B' },
      { name: 'Ryan Howard', email: 'ryan.student@campussphere.com', rollNumber: 'CS202617', group: 'CSE-B' },
      { name: 'Kelly Kapoor', email: 'kelly.student@campussphere.com', rollNumber: 'CS202618', group: 'CSE-B' },
      { name: 'Toby Flenderson', email: 'toby.student@campussphere.com', rollNumber: 'CS202619', group: 'CSE-B' },
      { name: 'Angela Martin', email: 'angela.student@campussphere.com', rollNumber: 'CS202620', group: 'CSE-B' },
    ];

    const studentUsers = [];
    for (const item of studentData) {
      const u = await User.create({
        name: item.name,
        email: item.email,
        password: 'password123',
        role: ROLES.STUDENT,
        semester: 3,
        branchId: cseBranch._id,
        departmentId: cseDept._id,
        group: item.group,
        rollNumber: item.rollNumber,
        courseId: course._id,
      });
      studentUsers.push(u);
    }
    console.log(`✅ ${studentUsers.length} student accounts seeded. (Default passwords: password123)`);

    // 8. Create Faculty Profiles and Link Subjects
    console.log('🌱 Linking Faculty profiles with comprehensive metadata...');
    await Faculty.create({
      userId: facultyUser1._id,
      departmentId: cseDept._id,
      designation: 'Professor',
      phoneNumber: '123-456-7890',
      officeHours: 'Mon, Wed 10:00 AM - 12:00 PM',
      officeRoom: 'Room 304, Academic Block-A',
      qualification: 'Ph.D. in Mathematics (Princeton)',
      specialization: 'Cryptography & Theory of Computation',
      employeeId: 'EMP101',
      joiningDate: new Date('2015-08-01'),
      subjects: [dsSubject._id, osSubject._id, dsLabSubject._id, projectGuidanceSubject._id],
    });

    await Faculty.create({
      userId: facultyUser2._id,
      departmentId: cseDept._id,
      designation: 'Associate Professor',
      phoneNumber: '987-654-3210',
      officeHours: 'Tue, Thu 2:00 PM - 4:00 PM',
      officeRoom: 'Room 402, Science Block',
      qualification: 'Ph.D. in Computer Science (Yale)',
      specialization: 'Compiler Design & Programming Languages',
      employeeId: 'EMP102',
      joiningDate: new Date('2018-01-15'),
      subjects: [webDevSubject._id, dbmsSubject._id],
    });
    console.log('✅ Faculty profiles created and subjects assigned.');

    // 9. Seed Attendance records for all 20 students (facultyId references User now)
    console.log('🌱 Seeding mock attendance records for students...');
    const date1 = new Date();
    date1.setUTCHours(0, 0, 0, 0);
    date1.setUTCDate(date1.getUTCDate() - 2);

    const date2 = new Date();
    date2.setUTCHours(0, 0, 0, 0);
    date2.setUTCDate(date2.getUTCDate() - 1);

    const attendanceList = [];
    studentUsers.forEach((stu, idx) => {
      // Seed DSA Attendance (2 days ago and yesterday)
      attendanceList.push({
        studentId: stu._id,
        subjectId: dsSubject._id,
        facultyId: facultyUser1._id,
        date: date1,
        status: idx % 7 === 0 ? 'ABSENT' : 'PRESENT',
      });
      attendanceList.push({
        studentId: stu._id,
        subjectId: dsSubject._id,
        facultyId: facultyUser1._id,
        date: date2,
        status: idx % 8 === 0 ? 'ABSENT' : 'PRESENT',
      });

      // Seed Web Dev Attendance (yesterday)
      attendanceList.push({
        studentId: stu._id,
        subjectId: webDevSubject._id,
        facultyId: facultyUser2._id,
        date: date2,
        status: idx % 9 === 0 ? 'ABSENT' : 'PRESENT',
      });
    });

    await Attendance.create(attendanceList);
    console.log('✅ Mock attendance records seeded.');

    // 10. Seed Exams and Results
    console.log('🌱 Seeding exams and results...');
    const dsaMidterm = await Exam.create({
      name: 'DSA Midterm Assessment',
      subjectId: dsSubject._id,
      examType: 'MID_TERM',
      date: new Date(),
      maxMarks: 50,
      passingMarks: 20,
    });

    const dsaEndterm = await Exam.create({
      name: 'DSA Final Theory Exam',
      subjectId: dsSubject._id,
      examType: 'END_TERM',
      date: new Date(),
      maxMarks: 100,
      passingMarks: 40,
    });

    // Create results for Midterm (Published)
    const midtermResults = studentUsers.map((stu, idx) => {
      const marks = 30 + ((idx * 1.5) % 20);
      return {
        studentId: stu._id,
        examId: dsaMidterm._id,
        marksObtained: marks,
        isPublished: true,
        absent: false,
        remarks: 'Good progress.',
      };
    });
    midtermResults[5].marksObtained = 0;
    midtermResults[5].absent = true;
    midtermResults[5].remarks = 'Absent due to medical emergency.';

    await ExamResult.create(midtermResults);

    // Create result for Endterm (Draft/In-Progress, not published yet)
    const endtermResults = studentUsers.slice(0, 10).map((stu, idx) => {
      const marks = 60 + ((idx * 3) % 40);
      return {
        studentId: stu._id,
        examId: dsaEndterm._id,
        marksObtained: marks,
        isPublished: false,
        absent: false,
        remarks: 'Consistent.',
      };
    });
    await ExamResult.create(endtermResults);
    console.log('✅ Exams and grading results seeded.');

    // 11. Seed Weekly Timetable Slots
    console.log('🌱 Seeding weekly schedule timetable slots...');
    await TimetableSlot.create([
      // Monday: 09:00-10:00 DSA
      {
        departmentId: cseDept._id,
        courseId: course._id,
        branchId: cseBranch._id,
        semester: 3,
        group: 'CSE-A',
        subjectId: dsSubject._id,
        facultyId: facultyUser1._id,
        dayOfWeek: 'MONDAY',
        startTime: '09:00',
        endTime: '10:00',
        room: 'LH-101',
        createdBy: adminUser._id,
      },
      // Monday: 11:00-12:00 OS
      {
        departmentId: cseDept._id,
        courseId: course._id,
        branchId: cseBranch._id,
        semester: 3,
        group: 'CSE-A',
        subjectId: osSubject._id,
        facultyId: facultyUser1._id,
        dayOfWeek: 'MONDAY',
        startTime: '11:00',
        endTime: '12:00',
        room: 'LH-102',
        createdBy: adminUser._id,
      },
      // Tuesday: 10:00-11:00 DBMS
      {
        departmentId: cseDept._id,
        courseId: course._id,
        branchId: cseBranch._id,
        semester: 3,
        group: 'CSE-A',
        subjectId: dbmsSubject._id,
        facultyId: facultyUser2._id,
        dayOfWeek: 'TUESDAY',
        startTime: '10:00',
        endTime: '11:00',
        room: 'LH-103',
        createdBy: adminUser._id,
      },
      // Wednesday: 09:00-10:00 DSA Lab
      {
        departmentId: cseDept._id,
        courseId: course._id,
        branchId: cseBranch._id,
        semester: 3,
        group: 'CSE-A',
        subjectId: dsLabSubject._id,
        facultyId: facultyUser1._id,
        dayOfWeek: 'WEDNESDAY',
        startTime: '09:00',
        endTime: '10:00',
        room: 'Lab-1',
        createdBy: adminUser._id,
      },
      // Thursday: 11:00-12:00 OS
      {
        departmentId: cseDept._id,
        courseId: course._id,
        branchId: cseBranch._id,
        semester: 3,
        group: 'CSE-A',
        subjectId: osSubject._id,
        facultyId: facultyUser1._id,
        dayOfWeek: 'THURSDAY',
        startTime: '11:00',
        endTime: '12:00',
        room: 'LH-102',
        createdBy: adminUser._id,
      },
      // Friday: 14:00-15:00 Project Guidance
      {
        departmentId: cseDept._id,
        courseId: course._id,
        branchId: cseBranch._id,
        semester: 3,
        group: 'CSE-A',
        subjectId: projectGuidanceSubject._id,
        facultyId: facultyUser1._id,
        dayOfWeek: 'FRIDAY',
        startTime: '14:00',
        endTime: '15:00',
        room: 'Project Room',
        createdBy: adminUser._id,
      },
    ]);
    console.log('✅ Weekly schedule timetable slots seeded.');

    // 12. Seed Course Materials
    console.log('🌱 Seeding Course Materials...');
    await Material.create([
      {
        title: 'Lecture 1: Introduction to Trees',
        type: 'PDF',
        subjectId: dsSubject._id,
        semester: 3,
        group: 'CSE-A',
        url: 'https://example.com/trees.pdf',
        description: 'Covers Binary Search Tree basics, traversal, and insertion operations.',
        fileSize: '2.4 MB',
        uploadedBy: facultyUser1._id,
      },
      {
        title: 'Lecture 2: BST Deletion Algorithm',
        type: 'PPT',
        subjectId: dsSubject._id,
        semester: 3,
        group: 'CSE-A',
        url: 'https://example.com/bst-deletion.pptx',
        description: 'Visual slides explaining single-child, no-child, and two-children node deletion.',
        fileSize: '4.8 MB',
        uploadedBy: facultyUser1._id,
      },
      {
        title: 'React Fundamentals Tutorial',
        type: 'YOUTUBE',
        subjectId: webDevSubject._id,
        semester: 3,
        group: 'CSE-A',
        url: 'https://youtube.com/watch?v=react-tutorial',
        description: 'Comprehensive crash course on component lifecycle, state hooks, and virtual DOM mapping.',
        fileSize: 'N/A',
        uploadedBy: facultyUser2._id,
      },
      {
        title: 'OS Process Management Guide',
        type: 'PDF',
        subjectId: osSubject._id,
        semester: 3,
        group: 'CSE-A',
        url: 'https://example.com/os-process.pdf',
        description: 'Covers Process States, PCBs, context switching, and scheduling states.',
        fileSize: '1.8 MB',
        uploadedBy: facultyUser1._id,
      },
      {
        title: 'DBMS Normalization & Normal Forms',
        type: 'PPT',
        subjectId: dbmsSubject._id,
        semester: 3,
        group: 'CSE-A',
        url: 'https://example.com/dbms-normal.pptx',
        description: 'Covers 1NF, 2NF, 3NF, and BCNF mapping rules with database normalization examples.',
        fileSize: '3.5 MB',
        uploadedBy: facultyUser2._id,
      },
    ]);
    console.log('✅ Course materials seeded.');

    // 13. Seed System Notifications
    console.log('🌱 Seeding Notifications...');
    await Notification.create([
      {
        recipientId: facultyUser1._id,
        title: 'Midterm Grading Deadline Approaching',
        message: 'Please ensure all CSE-A DSA Midterm grades are uploaded by tomorrow EOD.',
        category: 'ACADEMIC',
        isRead: false,
        senderId: adminUser._id,
      },
      {
        recipientId: facultyUser1._id,
        title: 'Faculty Meeting Scheduled',
        message: 'A monthly department coordination review meeting is scheduled for tomorrow at 3:00 PM in Seminar Hall.',
        category: 'ADMINISTRATIVE',
        isRead: false,
        senderId: adminUser._id,
      },
      {
        recipientId: facultyUser1._id,
        title: 'System Profile Verified',
        message: 'Your assistant professor designation records have been successfully mapped to the computer science department.',
        category: 'GENERAL',
        isRead: true,
        senderId: adminUser._id,
      },
      {
        recipientId: facultyUser2._id,
        title: 'Practical Exam Scheduling',
        message: 'Web Dev practical exams schedule has been approved for next Wednesday in Lab-3.',
        category: 'ACADEMIC',
        isRead: false,
        senderId: adminUser._id,
      },
      {
        recipientId: facultyUser2._id,
        title: 'Department Seminar Invitation',
        message: 'You are invited to present compiler design topics in the upcoming academic seminar.',
        category: 'ADMINISTRATIVE',
        isRead: true,
        senderId: adminUser._id,
      },
    ]);
    console.log('✅ Notifications seeded.');

    // 14. Seed Homework Assignments
    console.log('🌱 Seeding Homework Assignments...');
    await Assignment.create([
      {
        title: 'Binary Search Tree Implementation',
        description: 'Implement a Binary Search Tree (BST) class in JavaScript supporting insert, delete, search, and traversals.',
        subjectId: dsSubject._id,
        semester: 3,
        group: 'CSE-A',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        maxMarks: 100,
        uploadedBy: facultyUser1._id,
      },
      {
        title: 'Red-Black Trees Concept Sheet',
        description: 'Write solutions explaining node color rotations and balancing algorithms under insertion cases.',
        subjectId: dsSubject._id,
        semester: 3,
        group: 'CSE-A',
        dueDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000), // 9 days from now
        maxMarks: 50,
        uploadedBy: facultyUser1._id,
      },
      {
        title: 'React Single Page App Portfolio',
        description: 'Build a profile portfolio using React function components, state, hooks, and responsive custom CSS layout.',
        subjectId: webDevSubject._id,
        semester: 3,
        group: 'CSE-A',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        maxMarks: 100,
        uploadedBy: facultyUser2._id,
      },
      {
        title: 'SQL Complex Queries Worksheet',
        description: 'Write complex SQL select statements involving inner joins, subqueries, group by, and aggregates.',
        subjectId: dbmsSubject._id,
        semester: 3,
        group: 'CSE-A',
        dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
        maxMarks: 50,
        uploadedBy: facultyUser2._id,
      },
    ]);
    console.log('✅ Homework assignments seeded.');

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
