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

    // 6. Seed Subjects (semester validation is checked dynamically)
    console.log('📘 Seeding CSE Subjects...');
    const dsSubject = await Subject.create({
      name: 'Data Structures and Algorithms',
      code: 'CS301',
      credits: 4,
      type: 'THEORY',
      branchId: branch._id,
      departmentId: dept._id,
      semester: 3, // Valid (3 <= 8 semesters)
    });

    const osSubject = await Subject.create({
      name: 'Operating Systems',
      code: 'CS401',
      credits: 4,
      type: 'THEORY',
      branchId: branch._id,
      departmentId: dept._id,
      semester: 4, // Valid (4 <= 8 semesters)
    });

    console.log(`✅ Subjects created: ${dsSubject.code}, ${osSubject.code}`);
    // 7. Seed Role-specific Test Users
    console.log('👤 Seeding role-specific test users...');
    const testUsers = [
      {
        name: 'College Administrator',
        email: 'college_admin@campussphere.edu',
        password: 'admin123',
        role: ROLES.COLLEGE_ADMIN,
      },
      {
        name: 'Head of CSE',
        email: 'hod_cse@campussphere.edu',
        password: 'admin123',
        role: ROLES.HOD,
        departmentId: dept._id,
      },
      {
        name: 'Prof. Alan Turing',
        email: 'faculty@campussphere.edu',
        password: 'admin123',
        role: ROLES.FACULTY,
        departmentId: dept._id,
      },
      {
        name: 'John Doe',
        email: 'student@campussphere.edu',
        password: 'admin123',
        role: ROLES.STUDENT,
        departmentId: dept._id,
        courseId: course._id,
        branchId: branch._id,
        enrollmentNumber: 'CS2026001',
        semester: 1,
      },
    ];

    for (const u of testUsers) {
      await User.create(u);
      console.log(`✅ Created ${u.role}: email: ${u.email}, password: admin123`);
    }

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
