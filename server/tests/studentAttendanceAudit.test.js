const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Course = require('../src/models/Course');
const Branch = require('../src/models/Branch');
const Department = require('../src/models/Department');
const Subject = require('../src/models/Subject');
const Attendance = require('../src/models/Attendance');
const ROLES = require('../src/constants/roles');

let mongoServer;
let adminToken;
let hodToken;
let testDept;
let testCourse;
let testBranch;
let testSubject;
let testFaculty;
let testStudent;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // 1. Create Department
  testDept = await Department.create({
    name: 'Computer Engineering',
    code: 'CSE',
    description: 'Computer Science Dept'
  });

  // 2. Create Course (4 years = 8 semesters max)
  testCourse = await Course.create({
    name: 'Bachelor of Technology',
    code: 'B.TECH',
    durationYears: 4
  });

  // 3. Create Branch
  testBranch = await Branch.create({
    name: 'Computer Science and Engineering',
    code: 'CSE_BRANCH',
    courseId: testCourse._id
  });

  // 4. Create Subject under Department
  testSubject = await Subject.create({
    name: 'Data Structures & Algorithms',
    code: 'CS201',
    type: 'THEORY',
    credits: 4,
    departmentId: testDept._id,
    courseId: testCourse._id,
    branchId: testBranch._id,
    semester: 3
  });

  // 5. Create Super Admin
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin.audit@campussphere.edu',
    password: 'password123',
    role: ROLES.SUPER_ADMIN
  });

  // 6. Create HOD User
  const hod = await User.create({
    name: 'Dr. Alan Turing',
    email: 'turing.hod@campussphere.edu',
    password: 'password123',
    role: ROLES.HOD,
    departmentId: testDept._id,
    shift: 'GENERAL'
  });

  // 7. Create Faculty User
  testFaculty = await User.create({
    name: 'Prof. Ada Lovelace',
    email: 'lovelace@campussphere.edu',
    password: 'password123',
    role: ROLES.FACULTY,
    departmentId: testDept._id
  });

  // 8. Create Student User
  testStudent = await User.create({
    name: 'Grace Hopper',
    email: 'hopper@campussphere.edu',
    password: 'password123',
    role: ROLES.STUDENT,
    departmentId: testDept._id,
    courseId: testCourse._id,
    branchId: testBranch._id,
    semester: 3
  });

  // Logins
  const adminRes = await request(app).post('/api/v1/auth/login').send({ email: admin.email, password: 'password123' });
  adminToken = adminRes.body.data.accessToken;

  const hodRes = await request(app).post('/api/v1/auth/login').send({ email: hod.email, password: 'password123' });
  hodToken = hodRes.body.data.accessToken;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Student Management & Attendance Concurrency Audit Tests', () => {

  describe('1. Course / Branch / Semester Bounds & Hierarchy Integrity', () => {
    it('should automatically align student courseId with branch.courseId on update', async () => {
      const res = await request(app)
        .put(`/api/v1/users/${testStudent._id}`)
        .set('Authorization', `Bearer ${hodToken}`)
        .send({
          branchId: testBranch._id.toString(),
          semester: 4,
          reason: 'Semester promotion after evaluation'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.branchId).toBe(testBranch._id.toString());
      expect(res.body.data.courseId).toBe(testCourse._id.toString());
    });

    it('should reject semester update if it exceeds course.durationYears * 2', async () => {
      // testCourse duration = 4 years -> max 8 semesters
      const res = await request(app)
        .put(`/api/v1/users/${testStudent._id}`)
        .set('Authorization', `Bearer ${hodToken}`)
        .send({
          branchId: testBranch._id.toString(),
          semester: 9, // Exceeds 8
          reason: 'Testing invalid semester bound'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/exceeds/i);
    });
  });

  describe('2. CSV Bulk Student Import API', () => {
    it('should process valid CSV rows and reject rows exceeding semester bounds or invalid email', async () => {
      const csvContent = `Name,Email,Branch,Semester,RollNumber,Group\nAlice Smith,alice.smith@campussphere.edu,CSE_BRANCH,2,ROLL101,G1\nBob Jones,invalid-email,CSE_BRANCH,3,ROLL102,G1\nCharlie Brown,charlie@campussphere.edu,CSE_BRANCH,10,ROLL103,G1`;

      const res = await request(app)
        .post('/api/v1/users/import-students')
        .set('Authorization', `Bearer ${hodToken}`)
        .attach('file', Buffer.from(csvContent), 'students.csv');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.importedCount).toBe(1); // Only Alice Smith imported
      expect(res.body.data.failedCount).toBe(2); // Bob (invalid email) & Charlie (semester 10 > 8)

      // Verify Alice Smith exists in DB with correct courseId
      const importedUser = await User.findOne({ email: 'alice.smith@campussphere.edu' });
      expect(importedUser).not.toBeNull();
      expect(importedUser.courseId.toString()).toBe(testCourse._id.toString());
    });
  });

  describe('3. Attendance Concurrency & Unique Compound Index Rejection', () => {
    it('should enforce unique compound index and reject duplicate attendance records for same student, subject, date, session', async () => {
      const attendanceDate = new Date('2026-08-01');

      // 1. Submit initial attendance
      const firstRes = await request(app)
        .post('/api/v1/attendance/bulk')
        .set('Authorization', `Bearer ${hodToken}`)
        .send({
          subjectId: testSubject._id.toString(),
          date: attendanceDate.toISOString(),
          sessionType: 'LECTURE',
          records: [{ studentId: testStudent._id.toString(), status: 'PRESENT' }]
        });

      expect(firstRes.status).toBe(200);

      // 2. Direct duplicate insert on MongoDB schema to verify index enforcement
      let err;
      try {
        await Attendance.create({
          studentId: testStudent._id,
          subjectId: testSubject._id,
          facultyId: testFaculty._id,
          date: attendanceDate,
          sessionType: 'LECTURE',
          status: 'PRESENT'
        });
      } catch (e) {
        err = e;
      }

      expect(err).toBeDefined();
      expect(err.code).toBe(11000); // Duplicate Key Error
    });
  });
});
