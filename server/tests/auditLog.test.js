const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const AuditLog = require('../src/models/AuditLog');
const ROLES = require('../src/constants/roles');

let mongoServer;
let adminToken;
let studentToken;
let adminUser;
let studentUser;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  adminUser = await User.create({
    name: 'Audit Administrator',
    email: 'audit-admin@campussphere.edu',
    password: 'password123',
    role: ROLES.SUPER_ADMIN,
  });

  studentUser = await User.create({
    name: 'Normal Student',
    email: 'normal-student@campussphere.edu',
    password: 'password123',
    role: ROLES.STUDENT,
  });

  // Login tokens
  const adminLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'audit-admin@campussphere.edu', password: 'password123' });
  adminToken = adminLogin.body.data.accessToken;

  const studentLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'normal-student@campussphere.edu', password: 'password123' });
  studentToken = studentLogin.body.data.accessToken;

  // Insert seed audit log entries
  await AuditLog.create([
    {
      actorId: adminUser._id,
      action: 'COLLEGE_PROFILE_UPDATED',
      targetId: new mongoose.Types.ObjectId(),
      targetModel: 'CollegeProfile',
      before: { name: 'Old College' },
      after: { name: 'New College' },
      timestamp: new Date('2026-07-10T10:00:00Z'),
    },
    {
      actorId: adminUser._id,
      action: 'HOD_ASSIGNED',
      targetId: studentUser._id,
      targetModel: 'User',
      before: null,
      after: { role: 'HOD', shift: 'GENERAL' },
      timestamp: new Date('2026-07-11T12:00:00Z'),
    },
    {
      actorId: studentUser._id,
      action: 'NOTICE_PUBLISHED',
      targetId: new mongoose.Types.ObjectId(),
      targetModel: 'Notice',
      before: null,
      after: { title: 'Exam Notice' },
      timestamp: new Date('2026-07-11T14:30:00Z'),
    },
  ]);
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
}, 60000);

describe('Audit Log API Integration Tests', () => {
  it('should allow SUPER_ADMIN to get paginated audit logs', async () => {
    const res = await request(app)
      .get('/api/v1/audit-logs')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.logs).toHaveLength(3);
    expect(res.body.data.total).toBe(3);
    
    // Check that actorId is populated with name and email
    expect(res.body.data.logs[0].actorId.name).toBeDefined();
    expect(res.body.data.logs[0].actorId.email).toBeDefined();
  });

  it('should reject normal users from viewing audit logs with 403', async () => {
    const res = await request(app)
      .get('/api/v1/audit-logs')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('should filter audit logs by action type correctly', async () => {
    const res = await request(app)
      .get('/api/v1/audit-logs?action=HOD_ASSIGNED')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.logs).toHaveLength(1);
    expect(res.body.data.logs[0].action).toBe('HOD_ASSIGNED');
  });

  it('should filter audit logs by targetModel correctly', async () => {
    const res = await request(app)
      .get('/api/v1/audit-logs?targetModel=Notice')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.logs).toHaveLength(1);
    expect(res.body.data.logs[0].targetModel).toBe('Notice');
  });

  it('should filter audit logs by date range bounds correctly', async () => {
    const res = await request(app)
      .get('/api/v1/audit-logs?dateFrom=2026-07-11&dateTo=2026-07-11')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.logs).toHaveLength(2); // July 11 entries only
  });

  it('should search logs by action name regex correctly', async () => {
    const res = await request(app)
      .get('/api/v1/audit-logs?search=profile')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.logs).toHaveLength(1);
    expect(res.body.data.logs[0].action).toBe('COLLEGE_PROFILE_UPDATED');
  });

  it('should search logs by actor name regex correctly', async () => {
    const res = await request(app)
      .get('/api/v1/audit-logs?search=student')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.logs).toHaveLength(1);
    expect(res.body.data.logs[0].actorId.name).toBe('Normal Student');
  });

  it('should fetch distinct audit actions list successfully', async () => {
    const res = await request(app)
      .get('/api/v1/audit-logs/actions')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toContain('HOD_ASSIGNED');
    expect(res.body.data).toContain('COLLEGE_PROFILE_UPDATED');
    expect(res.body.data).toContain('NOTICE_PUBLISHED');
  });
});
