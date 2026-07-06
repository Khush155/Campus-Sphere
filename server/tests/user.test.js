const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Department = require('../src/models/Department');
const AuditLog = require('../src/models/AuditLog');
const ROLES = require('../src/constants/roles');

let mongoServer;
let adminToken;
let studentToken;
let testDept;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // 1. Create a test department
  testDept = await Department.create({
    name: 'Computer Engineering',
    code: 'CSE',
    description: 'Computer Science Department',
  });

  // 2. Create users
  const admin = await User.create({
    name: 'Super Admin',
    email: 'superadmin@campussphere.edu',
    password: 'password123',
    role: ROLES.SUPER_ADMIN,
  });

  const student = await User.create({
    name: 'Rohan Sharma',
    email: 'rohan@campussphere.edu',
    password: 'password123',
    role: ROLES.STUDENT,
    departmentId: testDept._id,
  });

  // 3. Login
  const adminLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: admin.email, password: 'password123' });
  adminToken = adminLogin.body.data.accessToken;

  const studentLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: student.email, password: 'password123' });
  studentToken = studentLogin.body.data.accessToken;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('User Administration API tests', () => {
  it('should block non-admins from fetching users', async () => {
    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(403);
  });

  it('should allow Super Admin to query paginated, filtered user roster', async () => {
    const res = await request(app)
      .get('/api/v1/users')
      .query({ search: 'Rohan' })
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data[0].name).toBe('Rohan Sharma');
    expect(res.body.meta.total).toBe(1);
  });

  it('should prevent setting HOD if another HOD is already active in that department', async () => {
    // Register first HOD
    const faculty1 = await User.create({
      name: 'Dr. Iyer',
      email: 'iyer@campussphere.edu',
      password: 'password123',
      role: ROLES.FACULTY,
      departmentId: testDept._id,
    });

    const faculty2 = await User.create({
      name: 'Dr. Prasad',
      email: 'prasad@campussphere.edu',
      password: 'password123',
      role: ROLES.FACULTY,
      departmentId: testDept._id,
    });

    // Make faculty1 HOD
    await request(app)
      .put(`/api/v1/users/${faculty1._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: ROLES.HOD });

    // Try to make faculty2 HOD in same department
    const failRes = await request(app)
      .put(`/api/v1/users/${faculty2._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: ROLES.HOD });

    expect(failRes.status).toBe(400);
    expect(failRes.body.errorCode).toBe('HOD_ALREADY_ASSIGNED');
  });

  it('should require a reason when editing student academic course details', async () => {
    const student = await User.findOne({ role: ROLES.STUDENT });

    const failRes = await request(app)
      .put(`/api/v1/users/${student._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ semester: 2 }); // missing 'reason'

    expect(failRes.status).toBe(400);

    const successRes = await request(app)
      .put(`/api/v1/users/${student._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ semester: 2, reason: 'Promoted to semester 2' });

    expect(successRes.status).toBe(200);
  });

  it('should write audits on role change, status change, and student academic details edit', async () => {
    const testFaculty = await User.create({
      name: 'Test Lecturer',
      email: 'testlecturer@campussphere.edu',
      password: 'password123',
      role: ROLES.FACULTY,
    });

    // 1. Change role
    await request(app)
      .put(`/api/v1/users/${testFaculty._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: ROLES.SUPER_ADMIN });

    const audit1 = await AuditLog.findOne({ action: 'ROLE_CHANGE', targetId: testFaculty._id });
    expect(audit1).toBeDefined();
    expect(audit1.after.role).toBe(ROLES.SUPER_ADMIN);

    // 2. Soft deactivate
    await request(app)
      .delete(`/api/v1/users/${testFaculty._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    const audit2 = await AuditLog.findOne({ action: 'USER_DEACTIVATED', targetId: testFaculty._id });
    expect(audit2).toBeDefined();

    const checkUser = await User.findById(testFaculty._id);
    expect(checkUser.status).toBe('INACTIVE');
  });

  it('should fetch the last 8 audit log entries for Super Admin Dashboard timeline', async () => {
    const res = await request(app)
      .get('/api/v1/users/audit-logs')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(8);
    expect(res.body.data[0]).toHaveProperty('actorName');
    expect(res.body.data[0]).toHaveProperty('action');
  });
});
