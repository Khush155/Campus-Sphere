const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Department = require('../src/models/Department');
const PromotionBatch = require('../src/models/PromotionBatch');
const AuditLog = require('../src/models/AuditLog');
const ROLES = require('../src/constants/roles');

let mongoServer;
let adminToken;
let adminUser;
let deptCS;
let deptME;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  // Create admin
  adminUser = await User.create({
    name: 'Registrar Admin',
    email: 'admin@campussphere.edu',
    password: 'password123',
    role: ROLES.SUPER_ADMIN,
  });

  const loginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'admin@campussphere.edu', password: 'password123' });
  adminToken = loginRes.body.data.accessToken;

  // Create departments
  deptCS = await Department.create({ name: 'Computer Science', code: 'CS' });
  deptME = await Department.create({ name: 'Mechanical Engineering', code: 'ME' });

  // Seed students in different depts
  await User.create([
    {
      name: 'Alice CS',
      email: 'alice@campussphere.edu',
      password: 'password123',
      role: ROLES.STUDENT,
      status: 'ACTIVE',
      departmentId: deptCS._id,
    },
    {
      name: 'Bob ME',
      email: 'bob@campussphere.edu',
      password: 'password123',
      role: ROLES.STUDENT,
      status: 'ACTIVE',
      departmentId: deptME._id,
    },
  ]);

  // Seed promotion batch
  await PromotionBatch.create({
    executedBy: adminUser._id,
    scope: { departmentId: deptCS._id.toString() },
    promotedCount: 1,
    graduatedCount: 0,
    affectedStudentIds: [],
    status: 'COMPLETED',
  });

  // Seed audit log
  await AuditLog.create({
    actorId: adminUser._id,
    action: 'TEST_ACTION',
    timestamp: new Date(),
  });
}, 90000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
}, 90000);

describe('Reports Export API Integration Tests', () => {
  describe('GET /api/v1/reports/types', () => {
    it('should return list of registered report types', async () => {
      const res = await request(app)
        .get('/api/v1/reports/types')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(4); // 4 core types
      expect(res.body.data[0]).toHaveProperty('key');
      expect(res.body.data[0]).toHaveProperty('label');
      expect(res.body.data[0]).toHaveProperty('description');
      expect(res.body.data[0]).toHaveProperty('filtersSchema');
    });
  });

  describe('POST /api/v1/reports/generate', () => {
    it('should reject invalid report types with 400', async () => {
      const res = await request(app)
        .post('/api/v1/reports/generate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ type: 'INVALID_TYPE', format: 'CSV' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid report type specified');
    });

    it('should reject invalid format with 400', async () => {
      const res = await request(app)
        .post('/api/v1/reports/generate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ type: 'USER_ROSTER_SUMMARY', format: 'TXT' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    // ─── USER_ROSTER_SUMMARY ───
    describe('USER_ROSTER_SUMMARY', () => {
      it('should generate CSV correctly with proper headers', async () => {
        const res = await request(app)
          .post('/api/v1/reports/generate')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ type: 'USER_ROSTER_SUMMARY', format: 'CSV' });

        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toContain('text/csv');
        const csvLines = res.text.split('\n');
        expect(csvLines[0]).toBe('Role,Active Count');
        // Total active students: 2 (Alice and Bob)
        expect(csvLines.some((l) => l.startsWith('STUDENT') && l.endsWith('2'))).toBe(true);
      });

      it('should correctly apply department filter and narrow results', async () => {
        const res = await request(app)
          .post('/api/v1/reports/generate')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            type: 'USER_ROSTER_SUMMARY',
            format: 'CSV',
            filters: { departmentId: deptCS._id.toString() },
          });

        expect(res.status).toBe(200);
        const csvLines = res.text.split('\n');
        // Scoped to CS department, student count is 1 (only Alice CS)
        expect(csvLines.some((l) => l.startsWith('STUDENT') && l.endsWith('1'))).toBe(true);
      });

      it('should generate PDF correctly', async () => {
        const res = await request(app)
          .post('/api/v1/reports/generate')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ type: 'USER_ROSTER_SUMMARY', format: 'PDF' });

        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toBe('application/pdf');
        expect(res.body.toString().substring(0, 4)).toBe('%PDF');
      });
    });

    // ─── DEPARTMENT_PERFORMANCE ───
    describe('DEPARTMENT_PERFORMANCE', () => {
      it('should generate CSV correctly with proper headers', async () => {
        const res = await request(app)
          .post('/api/v1/reports/generate')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ type: 'DEPARTMENT_PERFORMANCE', format: 'CSV' });

        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toContain('text/csv');
        const csvLines = res.text.split('\n');
        expect(csvLines[0]).toBe('Department Name,Active Students,Active Faculty,HOD Coverage,Subjects');
        // Verify CS department details
        expect(csvLines.some((l) => l.includes('Computer Science') && l.includes(',1,'))).toBe(true);
      });

      it('should generate PDF correctly', async () => {
        const res = await request(app)
          .post('/api/v1/reports/generate')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ type: 'DEPARTMENT_PERFORMANCE', format: 'PDF' });

        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toBe('application/pdf');
      });
    });

    // ─── PROMOTION_HISTORY ───
    describe('PROMOTION_HISTORY', () => {
      it('should generate CSV correctly with proper headers', async () => {
        const res = await request(app)
          .post('/api/v1/reports/generate')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ type: 'PROMOTION_HISTORY', format: 'CSV' });

        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toContain('text/csv');
        const csvLines = res.text.split('\n');
        expect(csvLines[0]).toBe('Execution Date,Promoted Count,Graduated Count,Scope Filters,Status');
        expect(csvLines[1]).toContain('COMPLETED');
      });

      it('should generate PDF correctly', async () => {
        const res = await request(app)
          .post('/api/v1/reports/generate')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ type: 'PROMOTION_HISTORY', format: 'PDF' });

        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toBe('application/pdf');
      });
    });

    // ─── AUDIT_LOG_EXPORT ───
    describe('AUDIT_LOG_EXPORT', () => {
      it('should generate CSV correctly with proper headers', async () => {
        const res = await request(app)
          .post('/api/v1/reports/generate')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ type: 'AUDIT_LOG_EXPORT', format: 'CSV' });

        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toContain('text/csv');
        const csvLines = res.text.split('\n');
        expect(csvLines[0]).toBe('Timestamp,Actor Name,Actor Role,Action,Target Model,Target ID');
        expect(csvLines.some((l) => l.includes('TEST_ACTION'))).toBe(true);
      });

      it('should generate PDF correctly', async () => {
        const res = await request(app)
          .post('/api/v1/reports/generate')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ type: 'AUDIT_LOG_EXPORT', format: 'PDF' });

        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toBe('application/pdf');
      });
    });
  });
});
