const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const AcademicSession = require('../src/models/AcademicSession');
const AuditLog = require('../src/models/AuditLog');
const ROLES = require('../src/constants/roles');

let mongoServer;
let adminToken;
let studentToken;
let adminUser;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  adminUser = await User.create({
    name: 'Admin User',
    email: 'admin@campussphere.edu',
    password: 'password123',
    role: ROLES.SUPER_ADMIN,
  });

  await User.create({
    name: 'Student User',
    email: 'student@campussphere.edu',
    password: 'password123',
    role: ROLES.STUDENT,
  });

  // Login tokens
  const adminLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'admin@campussphere.edu', password: 'password123' });
  adminToken = adminLogin.body.data.accessToken;

  const studentLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'student@campussphere.edu', password: 'password123' });
  studentToken = studentLogin.body.data.accessToken;
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
}, 60000);

beforeEach(async () => {
  await AcademicSession.deleteMany({});
  await AuditLog.deleteMany({});
});

describe('Academic Session API Integration Tests', () => {
  it('should return null when requesting active session if none exists', async () => {
    const res = await request(app)
      .get('/api/v1/academic-sessions/active')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeNull();
  });

  it('should reject creating a session with termEndDate before termStartDate', async () => {
    const res = await request(app)
      .post('/api/v1/academic-sessions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        academicYear: '2026-27',
        semesterType: 'ODD',
        termStartDate: '2026-12-01',
        termEndDate: '2026-06-01', // Inverted Date
        status: 'ACTIVE',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errorCode).toBe('VALIDATION_ERROR');
  });

  it('should allow creating different semesters for the same academic year', async () => {
    // 1. Create ODD semester for 2027-28
    const res1 = await request(app)
      .post('/api/v1/academic-sessions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        academicYear: '2027-28',
        semesterType: 'ODD',
        termStartDate: '2027-07-01',
        termEndDate: '2027-12-01',
        status: 'ACTIVE',
      });
    expect(res1.status).toBe(201);

    // 2. Create EVEN semester for same year 2027-28
    const res2 = await request(app)
      .post('/api/v1/academic-sessions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        academicYear: '2027-28',
        semesterType: 'EVEN',
        termStartDate: '2028-01-01',
        termEndDate: '2028-06-01',
        status: 'ACTIVE',
      });
    expect(res2.status).toBe(201);
  });

  it('should enforce the single active session constraint when creating a new active session', async () => {
    // 1. Create first active session
    const res1 = await request(app)
      .post('/api/v1/academic-sessions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        academicYear: '2025-26',
        semesterType: 'EVEN',
        termStartDate: '2026-01-01',
        termEndDate: '2026-06-01',
        status: 'ACTIVE',
      });
    expect(res1.status).toBe(201);

    // 2. Create second active session
    const res2 = await request(app)
      .post('/api/v1/academic-sessions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        academicYear: '2026-27',
        semesterType: 'ODD',
        termStartDate: '2026-07-01',
        termEndDate: '2026-12-01',
        status: 'ACTIVE',
      });
    expect(res2.status).toBe(201);

    // Verify first session is now ARCHIVED
    const session1 = await AcademicSession.findById(res1.body.data._id);
    expect(session1.status).toBe('ARCHIVED');

    // Verify second session is ACTIVE
    const session2 = await AcademicSession.findById(res2.body.data._id);
    expect(session2.status).toBe('ACTIVE');

    // Verify total active sessions count is 1
    const activeCount = await AcademicSession.countDocuments({ status: 'ACTIVE' });
    expect(activeCount).toBe(1);

    // Verify AuditLog registered transition
    const logs = await AuditLog.find({ action: 'ACADEMIC_SESSION_ACTIVATED' });
    expect(logs.length).toBe(2); // Activated on first and second creation
  });

  it('should allow activating an existing archived session, archiving current active first', async () => {
    // 1. Create an archived session
    const res1 = await request(app)
      .post('/api/v1/academic-sessions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        academicYear: '2025-26',
        semesterType: 'EVEN',
        termStartDate: '2025-01-01',
        termEndDate: '2025-06-01',
        status: 'ARCHIVED',
      });
    expect(res1.status).toBe(201);

    // 2. Create an active session
    const res2 = await request(app)
      .post('/api/v1/academic-sessions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        academicYear: '2026-27',
        semesterType: 'ODD',
        termStartDate: '2026-07-01',
        termEndDate: '2026-12-01',
        status: 'ACTIVE',
      });
    expect(res2.status).toBe(201);

    // 3. Activate the archived session
    const activateRes = await request(app)
      .put(`/api/v1/academic-sessions/${res1.body.data._id}/activate`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(activateRes.status).toBe(200);
    expect(activateRes.body.data.status).toBe('ACTIVE');

    // Verify second session is now archived
    const session2 = await AcademicSession.findById(res2.body.data._id);
    expect(session2.status).toBe('ARCHIVED');

    // Verify AuditLog contains the activation action
    const log = await AuditLog.findOne({ action: 'ACADEMIC_SESSION_ACTIVATED', targetId: res1.body.data._id });
    expect(log).toBeDefined();
  });
});
