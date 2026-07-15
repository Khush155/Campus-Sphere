const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../src/app');
const User = require('../src/models/User');
const Department = require('../src/models/Department');
const Course = require('../src/models/Course');
const Branch = require('../src/models/Branch');
const CollegeProfile = require('../src/models/CollegeProfile');
const ROLES = require('../src/constants/roles');

let mongoServer;
let adminToken;
let adminUser;
let studentUser;
let facultyUser;
let hodUser;
let collegeAdminUser;
let deptCS;
let courseBTech;
let branchCSE;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  // Setup institution profile (with no logoUrl initially for the fallback check)
  await CollegeProfile.create({
    name: 'Test Tech University',
    affiliation: 'Affiliated to National Board',
    address: '123 Education Lane, Science City',
  });

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

  // Create departments & branches
  deptCS = await Department.create({ name: 'Computer Science', code: 'CS' });
  courseBTech = await Course.create({ name: 'B.Tech', code: 'BTECH', durationYears: 4 });
  branchCSE = await Branch.create({ name: 'CSE', code: 'CSE', courseId: courseBTech._id });

  // Create different eligible role users
  studentUser = await User.create({
    name: 'Alice Cooper',
    email: 'alice@campussphere.edu',
    password: 'password123',
    role: ROLES.STUDENT,
    status: 'ACTIVE',
    departmentId: deptCS._id,
    courseId: courseBTech._id,
    branchId: branchCSE._id,
    semester: 3,
  });

  facultyUser = await User.create({
    name: 'Professor Snape',
    email: 'snape@campussphere.edu',
    password: 'password123',
    role: ROLES.FACULTY,
    status: 'ACTIVE',
    departmentId: deptCS._id,
  });

  hodUser = await User.create({
    name: 'HOD McGonagall',
    email: 'mcgonagall@campussphere.edu',
    password: 'password123',
    role: ROLES.HOD,
    status: 'ACTIVE',
    departmentId: deptCS._id,
    shift: 'GENERAL',
  });

  // Ineligible role user
  collegeAdminUser = await User.create({
    name: 'Admin Filch',
    email: 'filch@campussphere.edu',
    password: 'password123',
    role: ROLES.COLLEGE_ADMIN,
    status: 'ACTIVE',
  });
}, 90000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
}, 90000);

describe('ID Card & Certificate Generation Integration Tests', () => {
  describe('ID Card Generation', () => {
    it('should generate an ID card successfully for a student (role-appropriate fields)', async () => {
      const res = await request(app)
        .get(`/api/v1/id-cards/${studentUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
      // Verify body contains PDF magic header %PDF-1.3
      expect(res.body.toString().substring(0, 4)).toBe('%PDF');
    });

    it('should generate an ID card successfully for a faculty member', async () => {
      const res = await request(app)
        .get(`/api/v1/id-cards/${facultyUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.body.toString().substring(0, 4)).toBe('%PDF');
    });

    it('should generate an ID card successfully for an HOD', async () => {
      const res = await request(app)
        .get(`/api/v1/id-cards/${hodUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.body.toString().substring(0, 4)).toBe('%PDF');
    });

    it('should reject ID card generation for ineligible roles (e.g. COLLEGE_ADMIN)', async () => {
      const res = await request(app)
        .get(`/api/v1/id-cards/${collegeAdminUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('ID cards are only available');
    });

    it('should generate bulk ID cards for a department', async () => {
      const res = await request(app)
        .get('/api/v1/id-cards/bulk')
        .query({ departmentId: deptCS._id.toString(), role: ROLES.STUDENT })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.body.toString().substring(0, 4)).toBe('%PDF');
    });
  });

  describe('Certificate Generation', () => {
    it('should generate a Bonafide Certificate successfully', async () => {
      const res = await request(app)
        .post('/api/v1/certificates/generate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          studentId: studentUser._id.toString(),
          type: 'BONAFIDE',
          purpose: 'Opening a bank account',
        });

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.body.toString().substring(0, 4)).toBe('%PDF');

      // Verify Audit Log generated
      const AuditLog = require('../src/models/AuditLog');
      const log = await AuditLog.findOne({
        action: 'CERTIFICATE_GENERATED',
        targetId: studentUser._id,
      });
      expect(log).toBeTruthy();
      expect(log.after.type).toBe('BONAFIDE');
      expect(log.after.purpose).toBe('Opening a bank account');
    });

    it('should generate a Transfer Certificate successfully', async () => {
      const res = await request(app)
        .post('/api/v1/certificates/generate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          studentId: studentUser._id.toString(),
          type: 'TRANSFER',
        });

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.body.toString().substring(0, 4)).toBe('%PDF');
    });

    it('should generate a Character Certificate successfully', async () => {
      const res = await request(app)
        .post('/api/v1/certificates/generate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          studentId: studentUser._id.toString(),
          type: 'CHARACTER',
        });

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.body.toString().substring(0, 4)).toBe('%PDF');
    });

    it('should reject certificate generation for a non-student user', async () => {
      const res = await request(app)
        .post('/api/v1/certificates/generate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          studentId: facultyUser._id.toString(),
          type: 'BONAFIDE',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Certificates can only be generated');
    });
  });

  describe('Letterhead & Logo Fallback Rendering', () => {
    it('should render PDF successfully when logoUrl is empty (graceful fallback)', async () => {
      // Setup profile with logoUrl null
      await CollegeProfile.updateOne({}, { $set: { logoUrl: null } });

      const res = await request(app)
        .get(`/api/v1/id-cards/${studentUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.body.toString().substring(0, 4)).toBe('%PDF');
    });

    it('should render PDF successfully when logoUrl is present but logo is missing on disk', async () => {
      // Set non-existent logo path on disk
      await CollegeProfile.updateOne({}, { $set: { logoUrl: '/uploads/college/non-existent-logo.png' } });

      const res = await request(app)
        .get(`/api/v1/id-cards/${studentUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.body.toString().substring(0, 4)).toBe('%PDF');
    });
  });
});
