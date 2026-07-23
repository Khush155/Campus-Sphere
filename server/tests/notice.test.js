const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Department = require('../src/models/Department');
const Notice = require('../src/models/Notice');
const AuditLog = require('../src/models/AuditLog');
const ROLES = require('../src/constants/roles');

let mongoServer;
let adminToken;
let facultyToken;
let studentToken;
let adminUser;
let facultyUser;
let studentUser;
let testDept;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // Setup test environment models
  testDept = await Department.create({
    name: 'Computer Science',
    code: 'CSE',
  });

  adminUser = await User.create({
    name: 'Admin User',
    email: 'admin@campussphere.edu',
    password: 'password123',
    role: ROLES.SUPER_ADMIN,
  });

  facultyUser = await User.create({
    name: 'Faculty User',
    email: 'faculty@campussphere.edu',
    password: 'password123',
    role: ROLES.FACULTY,
    departmentId: testDept._id,
  });

  studentUser = await User.create({
    name: 'Student User',
    email: 'student@campussphere.edu',
    password: 'password123',
    role: ROLES.STUDENT,
    departmentId: testDept._id,
    semester: 3,
  });

  // Login tokens
  const adminLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'admin@campussphere.edu', password: 'password123' });
  adminToken = adminLogin.body.data.accessToken;

  const facultyLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'faculty@campussphere.edu', password: 'password123' });
  facultyToken = facultyLogin.body.data.accessToken;

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
  await Notice.deleteMany({});
  await AuditLog.deleteMany({});
});

describe('Notice Board API Integration Tests', () => {
  it('should enable Admins to create and publish a notice, setting publishedAt', async () => {
    const res = await request(app)
      .post('/api/v1/notices')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Exam Schedule',
        content: 'Midterm exams start next Monday.',
        priority: 'IMPORTANT',
        status: 'PUBLISHED',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Exam Schedule');
    expect(res.body.data.publishedAt).toBeDefined();
  });

  it('should support Notice drafts and transition to published setting publishedAt', async () => {
    const draftRes = await request(app)
      .post('/api/v1/notices')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Draft Notice',
        content: 'Draft content.',
        status: 'DRAFT',
      });

    expect(draftRes.status).toBe(201);
    expect(draftRes.body.data.status).toBe('DRAFT');
    expect(draftRes.body.data.publishedAt).toBeNull();

    const publishRes = await request(app)
      .put(`/api/v1/notices/${draftRes.body.data._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'PUBLISHED',
      });

    expect(publishRes.status).toBe(200);
    expect(publishRes.body.data.status).toBe('PUBLISHED');
    expect(publishRes.body.data.publishedAt).toBeDefined();

    // Verify AuditLog
    const log = await AuditLog.findOne({ action: 'NOTICE_UPDATED', targetId: draftRes.body.data._id });
    expect(log).toBeDefined();
  });

  it('should enable soft archiving notices on delete requests', async () => {
    const res = await request(app)
      .post('/api/v1/notices')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Archivable Notice',
        content: 'Temporary content.',
        status: 'PUBLISHED',
      });

    const archiveRes = await request(app)
      .delete(`/api/v1/notices/${res.body.data._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(archiveRes.status).toBe(200);

    const checkDb = await Notice.findById(res.body.data._id);
    expect(checkDb.status).toBe('ARCHIVED');

    const log = await AuditLog.findOne({ action: 'NOTICE_ARCHIVED', targetId: res.body.data._id });
    expect(log).toBeDefined();
  });

  it('should perform granular audience visibility matching for user feeds', async () => {
    // 1. Notice targeted to no one specifically (visible to everyone)
    await Notice.create({
      title: 'Global Holiday Notice',
      content: 'University closed tomorrow.',
      status: 'PUBLISHED',
      publishedBy: adminUser._id,
      publishedAt: new Date(),
    });

    // 2. Notice targeted to HOD and Faculty only
    await Notice.create({
      title: 'Staff Meeting',
      content: 'Agenda: Curriculum review.',
      status: 'PUBLISHED',
      targetRoles: [ROLES.FACULTY, ROLES.HOD],
      publishedBy: adminUser._id,
      publishedAt: new Date(),
    });

    // 3. Notice targeted to Students in CSE
    await Notice.create({
      title: 'CSE Lab Maintenance',
      content: 'Labs closed on Saturday.',
      status: 'PUBLISHED',
      targetRoles: [ROLES.STUDENT],
      targetDepartments: [testDept._id],
      publishedBy: adminUser._id,
      publishedAt: new Date(),
    });

    // 4. Notice targeted to Semester 3 Students in CSE
    await Notice.create({
      title: 'CSE Semester 3 Project Submission',
      content: 'Submit by Friday.',
      status: 'PUBLISHED',
      targetRoles: [ROLES.STUDENT],
      targetDepartments: [testDept._id],
      targetSemesters: [3],
      publishedBy: adminUser._id,
      publishedAt: new Date(),
    });

    // 5. Notice targeted to Semester 4 Students in CSE
    await Notice.create({
      title: 'CSE Semester 4 Internship Notice',
      content: 'Internship forms open.',
      status: 'PUBLISHED',
      targetRoles: [ROLES.STUDENT],
      targetDepartments: [testDept._id],
      targetSemesters: [4],
      publishedBy: adminUser._id,
      publishedAt: new Date(),
    });

    // Verify Faculty Feed (should see Global Notice #1, Staff Meeting #2, and NO student notices)
    const facultyFeed = await request(app)
      .get('/api/v1/notices/feed')
      .set('Authorization', `Bearer ${facultyToken}`);

    expect(facultyFeed.status).toBe(200);
    expect(facultyFeed.body.data.length).toBe(2);
    const facultyTitles = facultyFeed.body.data.map(n => n.title);
    expect(facultyTitles).toContain('Global Holiday Notice');
    expect(facultyTitles).toContain('Staff Meeting');

    // Verify Student Feed (Student role, CSE dept, Sem 3)
    // Should see Global #1, CSE Lab #3, CSE Sem 3 Project #4. NOT Staff Meeting #2 or CSE Sem 4 #5.
    const studentFeed = await request(app)
      .get('/api/v1/notices/feed')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(studentFeed.status).toBe(200);
    expect(studentFeed.body.data.length).toBe(3);
    const studentTitles = studentFeed.body.data.map(n => n.title);
    expect(studentTitles).toContain('Global Holiday Notice');
    expect(studentTitles).toContain('CSE Lab Maintenance');
    expect(studentTitles).toContain('CSE Semester 3 Project Submission');
    expect(studentTitles).not.toContain('Staff Meeting');
    expect(studentTitles).not.toContain('CSE Semester 4 Internship Notice');
  });
});
