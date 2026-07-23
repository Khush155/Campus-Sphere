const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Department = require('../src/models/Department');
const Course = require('../src/models/Course');
const Branch = require('../src/models/Branch');
const Subject = require('../src/models/Subject');
const LeaveRequest = require('../src/models/LeaveRequest');
const Exam = require('../src/models/Exam');
const FacultyAssignment = require('../src/models/FacultyAssignment');
const ROLES = require('../src/constants/roles');

let mongoReplSet;
let hodCSToken;
let deptCS;
let deptME;
let courseBTech;
let branchCSE;
let subjectCS;
let studentME;
let facultyME;
let facultyMEToken;

beforeAll(async () => {
  mongoReplSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const uri = mongoReplSet.getUri();
  await mongoose.connect(uri);

  // Departments
  deptCS = await Department.create({ name: 'Computer Science', code: 'CS' });
  deptME = await Department.create({ name: 'Mechanical Engineering', code: 'ME' });

  courseBTech = await Course.create({ name: 'B.Tech', code: 'BTECH', durationYears: 4 });
  branchCSE = await Branch.create({ name: 'CSE', code: 'CSE', courseId: courseBTech._id });

  // Subjects
  subjectCS = await Subject.create({
    name: 'Computer Networks',
    code: 'CS301',
    credits: 4,
    type: 'THEORY',
    branchId: branchCSE._id,
    departmentId: deptCS._id,
    semester: 1,
  });

  // HOD CS
  await User.create({
    name: 'HOD CS',
    email: 'hodcs@campussphere.edu',
    password: 'password123',
    role: ROLES.HOD,
    departmentId: deptCS._id,
    status: 'ACTIVE',
    shift: 'GENERAL',
  });

  const hodCSRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'hodcs@campussphere.edu', password: 'password123' });
  hodCSToken = hodCSRes.body.data.accessToken;

  // Student in ME
  studentME = await User.create({
    name: 'Student ME',
    email: 'studentme@campussphere.edu',
    password: 'password123',
    role: ROLES.STUDENT,
    departmentId: deptME._id,
    status: 'ACTIVE',
    shift: 'GENERAL',
  });

  // Faculty in ME
  facultyME = await User.create({
    name: 'Faculty ME',
    email: 'facultyme@campussphere.edu',
    password: 'password123',
    role: ROLES.FACULTY,
    departmentId: deptME._id,
    status: 'ACTIVE',
    shift: 'GENERAL',
  });

  const facRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'facultyme@campussphere.edu', password: 'password123' });
  facultyMEToken = facRes.body.data.accessToken;
}, 90000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoReplSet) await mongoReplSet.stop();
}, 90000);

describe('Privilege Boundary Integration Tests', () => {
  it('should block HOD of CS from updating leave request status of a student in ME', async () => {
    // Create leave request for student in ME
    const leave = await LeaveRequest.create({
      userId: studentME._id,
      departmentId: deptME._id,
      leaveType: 'CASUAL',
      startDate: new Date(),
      endDate: new Date(),
      reason: 'Medical checkup',
    });

    const res = await request(app)
      .patch(`/api/v1/leaves/${leave._id}/status`)
      .set('Authorization', `Bearer ${hodCSToken}`)
      .send({ status: 'APPROVED' });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toContain('manage resources within your own department');
  });

  it('should block Faculty of ME from scheduling exam for a CS subject they are not assigned to', async () => {
    const res = await request(app)
      .post('/api/v1/exams')
      .set('Authorization', `Bearer ${facultyMEToken}`)
      .send({
        name: 'Mid Term exam',
        subjectId: subjectCS._id,
        examType: 'MID_TERM',
        date: new Date(),
        maxMarks: 100,
        passingMarks: 40,
      });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toContain('not assigned to this subject');
  });
});
