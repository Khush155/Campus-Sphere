/* eslint-disable no-console */
const dns = require('dns');
// Direct programmatic override to bypass restrictive local DNS servers
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env
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
const FacultyAssignment = require('./models/FacultyAssignment');
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

    // 1. Purge old collections
    console.log('🧹 Purging all old collections...');
    await Promise.all([
      User.deleteMany({}),
      Department.deleteMany({}),
      Course.deleteMany({}),
      Branch.deleteMany({}),
      Subject.deleteMany({}),
      Faculty.deleteMany({}),
      Attendance.deleteMany({}),
      Exam.deleteMany({}),
      ExamResult.deleteMany({}),
      AuditLog.deleteMany({}),
      TimetableSlot.deleteMany({}),
      Material.deleteMany({}),
      Notification.deleteMany({}),
      Assignment.deleteMany({}),
      FacultyAssignment.deleteMany({}),
    ]);
    console.log('✅ All collections purged.');

    // 2. Super Admin
    console.log('👤 Seeding Super Admin...');
    const adminUser = await User.create({
      name: 'System Administrator',
      email: 'admin@campussphere.edu',
      password: 'admin123',
      role: ROLES.SUPER_ADMIN,
    });

    // 3. Departments
    console.log('🏢 Seeding 3 Departments...');
    const cseDept = await Department.create({ name: 'Computer Science & Engineering', code: 'CSE-DEPT', description: 'Computing, software systems, and network security.' });
    const eceDept = await Department.create({ name: 'Electronics & Communication', code: 'ECE-DEPT', description: 'Telecommunication, microprocessors, and signals.' });
    const meDept = await Department.create({ name: 'Mechanical Engineering', code: 'ME-DEPT', description: 'Thermal systems, mechanics, and design tools.' });

    // 4. HODs
    console.log('👤 Seeding 3 HOD accounts...');
    await User.create({ name: 'Dr. John von Neumann', email: 'hod.cs@campussphere.edu', password: 'password123', role: ROLES.HOD, departmentId: cseDept._id, shift: 'GENERAL' });
    await User.create({ name: 'Dr. Nikola Tesla', email: 'hod.ece@campussphere.edu', password: 'password123', role: ROLES.HOD, departmentId: eceDept._id, shift: 'GENERAL' });
    await User.create({ name: 'Dr. James Watt', email: 'hod.me@campussphere.edu', password: 'password123', role: ROLES.HOD, departmentId: meDept._id, shift: 'GENERAL' });

    // 5. Courses
    console.log('🎓 Seeding 4 Courses...');
    const courses = [
      await Course.create({ name: 'Bachelor of Technology', code: 'B.TECH', durationYears: 4 }),
      await Course.create({ name: 'Master of Technology', code: 'M.TECH', durationYears: 2 }),
      await Course.create({ name: 'Master of Business Administration', code: 'MBA', durationYears: 2 }),
      await Course.create({ name: 'Bachelor of Science', code: 'B.SC', durationYears: 3 })
    ];

    // 6. Branches
    console.log('🌿 Seeding Branches...');
    const branches = [
      // BTech (Semesters 1-8)
      await Branch.create({ name: 'Computer Science', code: 'CSE', courseId: courses[0]._id }),
      await Branch.create({ name: 'Electronics & Comm', code: 'ECE', courseId: courses[0]._id }),
      await Branch.create({ name: 'Mechanical Engineering', code: 'MECH', courseId: courses[0]._id }),
      // MTech (Semesters 1-4)
      await Branch.create({ name: 'Advanced Computing', code: 'MTECH-CS', courseId: courses[1]._id }),
      await Branch.create({ name: 'VLSI Design', code: 'VLSI', courseId: courses[1]._id }),
      // MBA (Semesters 1-4)
      await Branch.create({ name: 'Human Resource', code: 'MBA-HR', courseId: courses[2]._id }),
      await Branch.create({ name: 'Finance Management', code: 'FIN', courseId: courses[2]._id }),
      // BSc (Semesters 1-6)
      await Branch.create({ name: 'Physics Science', code: 'PHYS', courseId: courses[3]._id }),
      await Branch.create({ name: 'Mathematical Science', code: 'MATHS', courseId: courses[3]._id })
    ];

    // 7. Faculty members (10 total)
    console.log('👥 Seeding 10 Faculty members...');
    const facultiesData = [
      { name: 'Dr. Alan Turing', email: 'alan.turing@campussphere.com', dept: cseDept, desig: 'Professor', qual: 'Ph.D. in Mathematics' },
      { name: 'Dr. Grace Hopper', email: 'grace.hopper@campussphere.com', dept: cseDept, desig: 'Associate Professor', qual: 'Ph.D. in Computer Science' },
      { name: 'Dr. Donald Knuth', email: 'donald.knuth@campussphere.com', dept: cseDept, desig: 'Professor', qual: 'Ph.D. in Math' },
      { name: 'Dr. Ada Lovelace', email: 'ada.lovelace@campussphere.com', dept: cseDept, desig: 'Assistant Professor', qual: 'M.Tech in CS' },
      { name: 'Dr. Claude Shannon', email: 'claude.shannon@campussphere.com', dept: eceDept, desig: 'Professor', qual: 'Ph.D. in ECE' },
      { name: 'Dr. Richard Feynman', email: 'richard.feynman@campussphere.com', dept: eceDept, desig: 'Associate Professor', qual: 'Ph.D. in Electronics' },
      { name: 'Dr. Gordon Moore', email: 'gordon.moore@campussphere.com', dept: eceDept, desig: 'Assistant Professor', qual: 'Ph.D. in Physics' },
      { name: 'Dr. Henry Ford', email: 'henry.ford@campussphere.com', dept: meDept, desig: 'Professor', qual: 'Ph.D. in Mechanical' },
      { name: 'Dr. Rudolf Diesel', email: 'rudolf.diesel@campussphere.com', dept: meDept, desig: 'Associate Professor', qual: 'Ph.D. in Thermal Engineering' },
      { name: 'Dr. Marie Curie', email: 'marie.curie@campussphere.com', dept: meDept, desig: 'Assistant Professor', qual: 'Ph.D. in Thermodynamics' }
    ];

    const facultyUsers = [];
    const facultyProfiles = [];
    for (const f of facultiesData) {
      const u = await User.create({
        name: f.name,
        email: f.email,
        password: 'password123',
        role: ROLES.FACULTY,
        departmentId: f.dept._id,
        shift: 'GENERAL'
      });
      facultyUsers.push(u);

      const profile = await Faculty.create({
        userId: u._id,
        departmentId: f.dept._id,
        designation: f.desig,
        phoneNumber: '555-0199',
        officeHours: 'Mon-Fri 2:00 PM - 4:00 PM',
        officeRoom: 'Block B, Lab 2',
        qualification: f.qual,
        specialization: 'System Engineering',
        employeeId: `EMP-${f.name.split(' ').pop().toUpperCase()}`,
        joiningDate: new Date()
      });
      facultyProfiles.push(profile);
    }
    console.log('✅ 10 Faculty users and profiles seeded.');

    // 8. Seeding Subjects for each course and branch
    console.log('📘 Seeding Subjects for all cohorts...');
    const subjects = [];

    // Helper to generate subject
    const addSubject = async (name, code, credits, type, branch, dept, semester) => {
      const sub = await Subject.create({ name, code, credits, type, branchId: branch._id, departmentId: dept._id, semester });
      subjects.push(sub);
      return sub;
    };

    // BTech CSE Subjects
    await addSubject('Data Structures', 'CS101', 4, 'THEORY', branches[0], cseDept, 1);
    await addSubject('Computer Networks', 'CS201', 3, 'THEORY', branches[0], cseDept, 2);
    await addSubject('Operating Systems', 'CS301', 4, 'THEORY', branches[0], cseDept, 3);
    await addSubject('Database Systems', 'CS401', 3, 'THEORY', branches[0], cseDept, 4);
    await addSubject('Software Engineering', 'CS501', 4, 'THEORY', branches[0], cseDept, 5);
    await addSubject('Compiler Design', 'CS601', 4, 'THEORY', branches[0], cseDept, 6);
    await addSubject('Cloud Computing', 'CS701', 3, 'THEORY', branches[0], cseDept, 7);
    await addSubject('Final Year Project', 'CS801', 6, 'PRACTICAL', branches[0], cseDept, 8);

    // BTech ECE Subjects
    await addSubject('Basic Electronics', 'EC101', 3, 'THEORY', branches[1], eceDept, 1);
    await addSubject('Digital Circuits', 'EC201', 4, 'THEORY', branches[1], eceDept, 2);
    await addSubject('Microprocessors', 'EC301', 4, 'THEORY', branches[1], eceDept, 3);
    await addSubject('Signals & Systems', 'EC401', 3, 'THEORY', branches[1], eceDept, 4);

    // BTech MECH Subjects
    await addSubject('Engineering Mechanics', 'ME101', 4, 'THEORY', branches[2], meDept, 1);
    await addSubject('Thermodynamics', 'ME201', 3, 'THEORY', branches[2], meDept, 2);
    await addSubject('Fluid Mechanics', 'ME301', 4, 'THEORY', branches[2], meDept, 3);

    // MTech CS Subjects
    await addSubject('Advanced Algorithms', 'MCS101', 4, 'THEORY', branches[3], cseDept, 1);
    await addSubject('Machine Learning', 'MCS201', 3, 'THEORY', branches[3], cseDept, 2);

    // MBA HR Subjects
    await addSubject('Organizational Behavior', 'MHR101', 3, 'THEORY', branches[5], cseDept, 1);

    // BSc Physics Subjects
    await addSubject('Quantum Physics', 'PH101', 4, 'THEORY', branches[7], eceDept, 1);

    console.log(`✅ Seeded ${subjects.length} subjects.`);

    // 9. Seeding Student Users
    // Constraint: 15 students per semester for each branch.
    // Course durations: B.Tech (8 sems), M.Tech (4 sems), MBA (4 sems), B.Sc (6 sems)
    console.log('🌱 Seeding 15 Students per semester per branch (programmatically)...');
    
    const firstNames = ['John', 'Jane', 'Robert', 'Mary', 'David', 'James', 'Emily', 'Sarah', 'Michael', 'William', 'Jessica', 'Daniel', 'Karen', 'Thomas', 'Linda'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson'];

    const studentBatch = [];
    let rollCounter = 1000;

    for (const branch of branches) {
      // Find parent Course to determine semester limits
      const courseObj = courses.find(c => c._id.toString() === branch.courseId.toString());
      const maxSemesters = courseObj.durationYears * 2;
      
      // Determine department mapping
      let dept = cseDept;
      if (branch.code.includes('ECE') || branch.code === 'VLSI' || branch.code === 'PHYS') {
        dept = eceDept;
      } else if (branch.code === 'MECH') {
        dept = meDept;
      }

      for (let sem = 1; sem <= maxSemesters; sem++) {
        for (let sNum = 1; sNum <= 15; sNum++) {
          const fn = firstNames[(sem * sNum) % firstNames.length];
          const ln = lastNames[(sem * sNum + 7) % lastNames.length];
          const name = `${fn} ${ln}`;
          const email = `${fn.toLowerCase()}.${ln.toLowerCase()}.${branch.code.toLowerCase()}.${sem}.${sNum}@campussphere.edu`;
          rollCounter++;

          studentBatch.push({
            name,
            email,
            password: 'password123',
            role: ROLES.STUDENT,
            departmentId: dept._id,
            courseId: courseObj._id,
            branchId: branch._id,
            semester: sem,
            group: sNum <= 8 ? 'A' : 'B',
            rollNumber: `${branch.code}${sem}${rollCounter}`,
            shift: 'GENERAL',
            status: 'ACTIVE'
          });
        }
      }
    }

    console.log(`📦 Prepared bulk batch of ${studentBatch.length} student records.`);
    const seededStudents = await User.insertMany(studentBatch);
    console.log(`✅ Successfully seeded ${seededStudents.length} students via bulk insert!`);

    // 10. Seed Workload FacultyAssignments
    console.log('🌱 Mapping Faculty assignments...');
    const facultyAssignments = [];

    // CSE Faculty Turing
    facultyAssignments.push({ facultyId: facultyUsers[0]._id, subjectId: subjects[0]._id, group: 'A', assignedBy: adminUser._id });
    facultyAssignments.push({ facultyId: facultyUsers[0]._id, subjectId: subjects[1]._id, group: 'A', assignedBy: adminUser._id });
    // CSE Faculty Grace Hopper
    facultyAssignments.push({ facultyId: facultyUsers[1]._id, subjectId: subjects[2]._id, group: 'A', assignedBy: adminUser._id });
    facultyAssignments.push({ facultyId: facultyUsers[1]._id, subjectId: subjects[3]._id, group: 'A', assignedBy: adminUser._id });
    // CSE Faculty Knuth
    facultyAssignments.push({ facultyId: facultyUsers[2]._id, subjectId: subjects[4]._id, group: 'A', assignedBy: adminUser._id });
    facultyAssignments.push({ facultyId: facultyUsers[2]._id, subjectId: subjects[5]._id, group: 'A', assignedBy: adminUser._id });
    // ECE Faculty Shannon
    facultyAssignments.push({ facultyId: facultyUsers[4]._id, subjectId: subjects[8]._id, group: 'A', assignedBy: adminUser._id });
    facultyAssignments.push({ facultyId: facultyUsers[4]._id, subjectId: subjects[9]._id, group: 'A', assignedBy: adminUser._id });
    // MECH Faculty Ford
    facultyAssignments.push({ facultyId: facultyUsers[7]._id, subjectId: subjects[12]._id, group: 'A', assignedBy: adminUser._id });
    facultyAssignments.push({ facultyId: facultyUsers[7]._id, subjectId: subjects[13]._id, group: 'A', assignedBy: adminUser._id });

    await FacultyAssignment.insertMany(facultyAssignments);
    console.log('✅ Faculty workload assignments mapped successfully.');

    // 11. Timetables Slots Seeding
    console.log('🌱 Seeding Weekly Timetable slots...');
    const timetableSlots = [];
    const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

    // Let's seed timetable slots for active subjects
    facultyAssignments.forEach((fa, idx) => {
      const day = days[idx % days.length];
      timetableSlots.push({
        departmentId: fa.facultyId.departmentId || cseDept._id,
        courseId: courses[0]._id,
        branchId: branches[0]._id,
        semester: 3,
        group: 'A',
        subjectId: fa.subjectId,
        facultyId: fa.facultyId,
        dayOfWeek: day,
        startTime: '10:00',
        endTime: '11:30',
        room: `LH-${101 + idx}`,
        createdBy: adminUser._id,
      });
    });

    await TimetableSlot.insertMany(timetableSlots);
    console.log('✅ Timetable slots seeded.');

    // 12. Seed mock attendance records for the active semester students across subjects & dates
    console.log('🌱 Seeding mock attendance records...');
    const attendanceRecords = [];

    const datesToSeed = [0, 1, 2, 3, 4].map(daysAgo => {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - daysAgo);
      d.setUTCHours(0, 0, 0, 0);
      return d;
    });

    const cseSubjects = subjects.filter(sub => sub.departmentId.toString() === cseDept._id.toString());
    const cseStudentsList = seededStudents.filter(s => s.departmentId.toString() === cseDept._id.toString());

    cseSubjects.forEach((sub, subIdx) => {
      const assignedFaculty = facultyUsers[subIdx % facultyUsers.length]._id;
      datesToSeed.forEach((attDate, dIdx) => {
        cseStudentsList.forEach((stu, stIdx) => {
          const statusChoice = (stIdx + subIdx + dIdx) % 11 === 0 ? 'ABSENT' 
            : (stIdx + subIdx + dIdx) % 13 === 0 ? 'MEDICAL_LEAVE' 
            : (stIdx + subIdx + dIdx) % 17 === 0 ? 'EXCUSED' 
            : 'PRESENT';

          attendanceRecords.push({
            studentId: stu._id,
            subjectId: sub._id,
            facultyId: assignedFaculty,
            date: attDate,
            sessionType: subIdx % 2 === 0 ? 'LECTURE' : 'LAB',
            status: statusChoice,
            isMedicalApproved: statusChoice === 'MEDICAL_LEAVE' && (stIdx % 2 === 0)
          });
        });
      });
    });

    await Attendance.insertMany(attendanceRecords);
    console.log(`✅ Seeded ${attendanceRecords.length} mock attendance records across all department subjects.`);

    console.log('🎉 Extensively seeded comprehensive legimate database setup!');
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
