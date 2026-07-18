const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/User');
const Subject = require('../src/models/Subject');
const Department = require('../src/models/Department');
const FacultyAssignment = require('../src/models/FacultyAssignment');
const AuditLog = require('../src/models/AuditLog');

jest.setTimeout(120000); // Allow time for MongoMemoryServer to download

let mongoServer;
let hodToken;
let facultyId;
let otherDeptFacultyId;
let subjectId;
let deptId;
let hodUserId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  await User.deleteMany({});
  await Subject.deleteMany({});
  await Department.deleteMany({});
  await FacultyAssignment.deleteMany({});
  await AuditLog.deleteMany({});

  // 1. Create a Department
  const dept = await Department.create({
    name: 'Computer Science',
    code: 'CSE',
    description: 'CSE Dept',
  });
  deptId = dept._id;

  const otherDept = await Department.create({
    name: 'Electrical Engineering',
    code: 'EE',
    description: 'EE Dept',
  });

  // 2. Create HOD User
  const hod = await User.create({
    name: 'HOD CSE',
    email: 'hod.cse@test.com',
    password: 'password123',
    role: 'HOD',
    departmentId: dept._id,
  });
  hodUserId = hod._id;
  hodToken = `Bearer ${hod.generateAccessToken()}`;

  // 3. Create Faculty User in SAME dept
  const faculty = await User.create({
    name: 'Faculty CSE',
    email: 'faculty.cse@test.com',
    password: 'password123',
    role: 'FACULTY',
    departmentId: dept._id,
  });
  facultyId = faculty._id;

  // 4. Create Faculty User in OTHER dept
  const otherFaculty = await User.create({
    name: 'Faculty EE',
    email: 'faculty.ee@test.com',
    password: 'password123',
    role: 'FACULTY',
    departmentId: otherDept._id,
  });
  otherDeptFacultyId = otherFaculty._id;

  // 5. Create a Subject
  const subject = await Subject.create({
    name: 'Data Structures',
    code: 'CS201',
    credits: 4,
    type: 'CORE',
    departmentId: dept._id,
    semester: 3,
  });
  subjectId = subject._id;
});

describe('Faculty Assignment API', () => {
  it('should successfully assign a faculty to a subject and log audit', async () => {
    const res = await request(app)
      .post('/api/v1/assignments')
      .set('Authorization', hodToken)
      .send({
        facultyId,
        subjectId,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ACTIVE');
    expect(res.body.data.facultyId).toBe(facultyId.toString());

    // Verify AuditLog
    const logs = await AuditLog.find({ action: 'FACULTY_ASSIGNED' });
    expect(logs).toHaveLength(1);
    expect(logs[0].actorId.toString()).toBe(hodUserId.toString());
  });

  it('should fail to assign faculty from a different department', async () => {
    const res = await request(app)
      .post('/api/v1/assignments')
      .set('Authorization', hodToken)
      .send({
        facultyId: otherDeptFacultyId,
        subjectId,
      });

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/own department/i);
  });

  it('should fail to assign a second faculty to a subject with an active assignment', async () => {
    // First assignment
    await request(app)
      .post('/api/v1/assignments')
      .set('Authorization', hodToken)
      .send({ facultyId, subjectId });

    // Second assignment attempt
    const res = await request(app)
      .post('/api/v1/assignments')
      .set('Authorization', hodToken)
      .send({ facultyId, subjectId });

    expect(res.statusCode).toBe(400);
    expect(res.body.errorCode).toBe('DUPLICATE_ENTRY');
  });

  it('should successfully revoke an assignment and log audit', async () => {
    // 1. Assign
    const assignRes = await request(app)
      .post('/api/v1/assignments')
      .set('Authorization', hodToken)
      .send({ facultyId, subjectId });

    const assignmentId = assignRes.body.data._id;

    // 2. Revoke
    const res = await request(app)
      .post(`/api/v1/assignments/${assignmentId}/revoke`)
      .set('Authorization', hodToken)
      .send({
        revokedReason: 'Class cancelled for this semester',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.status).toBe('REVOKED');
    expect(res.body.data.revokedReason).toBe('Class cancelled for this semester');

    // Verify AuditLog
    const logs = await AuditLog.find({ action: 'FACULTY_REVOKED' });
    expect(logs).toHaveLength(1);
    expect(logs[0].after.status).toBe('REVOKED');
  });
});
