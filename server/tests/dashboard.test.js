const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Department = require('../src/models/Department');
const Course = require('../src/models/Course');
const Branch = require('../src/models/Branch');
const ROLES = require('../src/constants/roles');

let mongoServer;
let adminToken;
let collegeAdminToken;
let regularToken;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  // Create SUPER_ADMIN
  await User.create({
    name: 'Dashboard Admin',
    email: 'dashboard-admin@campussphere.edu',
    password: 'password123',
    role: ROLES.SUPER_ADMIN,
  });

  // Create COLLEGE_ADMIN
  await User.create({
    name: 'College Admin',
    email: 'college-admin@campussphere.edu',
    password: 'password123',
    role: ROLES.COLLEGE_ADMIN,
  });

  // Create non-admin for 403 checks
  await User.create({
    name: 'Regular Faculty',
    email: 'regular-faculty@campussphere.edu',
    password: 'password123',
    role: ROLES.FACULTY,
  });

  const adminLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'dashboard-admin@campussphere.edu', password: 'password123' });
  adminToken = adminLogin.body.data.accessToken;

  const collegeAdminLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'college-admin@campussphere.edu', password: 'password123' });
  collegeAdminToken = collegeAdminLogin.body.data.accessToken;

  const regularLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'regular-faculty@campussphere.edu', password: 'password123' });
  regularToken = regularLogin.body.data.accessToken;
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
}, 60000);

// ─── Empty Database State Tests ───────────────────────────────────────────────

describe('Dashboard API — empty database (fresh install) state', () => {
  it('GET /stats returns all-zero student/department/course counts (not errors)', async () => {
    const res = await request(app)
      .get('/api/v1/admin/dashboard/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const { totalStudents, totalFaculty, totalHods, totalDepartments, totalCourses } = res.body.data;
    // Every value must be a defined number — not undefined, not NaN
    expect(typeof totalStudents).toBe('number');
    expect(typeof totalFaculty).toBe('number');
    expect(typeof totalHods).toBe('number');
    expect(typeof totalDepartments).toBe('number');
    expect(typeof totalCourses).toBe('number');
    // On fresh install, students/depts/courses are 0
    expect(totalStudents).toBe(0);
    expect(totalDepartments).toBe(0);
    expect(totalCourses).toBe(0);
    // HODs should be 0; faculty could be > 0 because beforeAll created one regular faculty
    expect(totalHods).toBe(0);
  });

  it('GET /department-distribution returns [] (not error) when no students', async () => {
    const res = await request(app)
      .get('/api/v1/admin/dashboard/department-distribution')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(0);
  });

  it('GET /insights returns [] when no departments exist (fresh install — valid state)', async () => {
    const res = await request(app)
      .get('/api/v1/admin/insights')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    // No departments → no NO_HOD insights should fire (not an error)
    const noHodInsights = res.body.data.filter((i) => i.type === 'NO_HOD');
    expect(noHodInsights.length).toBe(0);
  });
});

// ─── Role Guard Tests ─────────────────────────────────────────────────────────

describe('Dashboard API — role guard (non-admin → 403)', () => {
  it('GET /stats returns 403 for non-admins', async () => {
    const res = await request(app)
      .get('/api/v1/admin/dashboard/stats')
      .set('Authorization', `Bearer ${regularToken}`);
    expect(res.status).toBe(403);
  });

  it('GET /stats returns 200 for COLLEGE_ADMIN', async () => {
    const res = await request(app)
      .get('/api/v1/admin/dashboard/stats')
      .set('Authorization', `Bearer ${collegeAdminToken}`);
    expect(res.status).toBe(200);
  });

  it('GET /department-distribution returns 403 for non-admins', async () => {
    const res = await request(app)
      .get('/api/v1/admin/dashboard/department-distribution')
      .set('Authorization', `Bearer ${regularToken}`);
    expect(res.status).toBe(403);
  });

  it('GET /department-distribution returns 200 for COLLEGE_ADMIN', async () => {
    const res = await request(app)
      .get('/api/v1/admin/dashboard/department-distribution')
      .set('Authorization', `Bearer ${collegeAdminToken}`);
    expect(res.status).toBe(200);
  });

  it('GET /insights returns 403 for non-admins', async () => {
    const res = await request(app)
      .get('/api/v1/admin/insights')
      .set('Authorization', `Bearer ${regularToken}`);
    expect(res.status).toBe(403);
  });

  it('GET /insights returns 200 for COLLEGE_ADMIN', async () => {
    const res = await request(app)
      .get('/api/v1/admin/insights')
      .set('Authorization', `Bearer ${collegeAdminToken}`);
    expect(res.status).toBe(200);
  });

  it('all dashboard endpoints return 401 when unauthenticated', async () => {
    const endpoints = [
      '/api/v1/admin/dashboard/stats',
      '/api/v1/admin/dashboard/department-distribution',
      '/api/v1/admin/insights',
    ];
    for (const endpoint of endpoints) {
      const res = await request(app).get(endpoint);
      expect(res.status).toBe(401);
    }
  });
});

// ─── Populated Data State Tests ───────────────────────────────────────────────

describe('Dashboard API — populated data state', () => {
  let dept1, dept2;

  beforeAll(async () => {
    // Seed departments
    dept1 = await Department.create({ name: 'Computer Science', code: 'CS' });
    dept2 = await Department.create({ name: 'Mechanical Engineering', code: 'ME' });

    // Seed course — use correct field name durationYears (not duration)
    const course1 = await Course.create({ name: 'B.Tech', code: 'BTECH', durationYears: 4 });

    // Seed a branch (so course doesn't trigger EMPTY_COURSE insight)
    await Branch.create({ name: 'CSE', code: 'CSE', courseId: course1._id });

    // Seed students: 3 in dept1, 1 in dept2
    await User.create([
      { name: 'Student A', email: 'student-a@uni.edu', password: 'pass123', role: 'STUDENT', status: 'ACTIVE', departmentId: dept1._id },
      { name: 'Student B', email: 'student-b@uni.edu', password: 'pass123', role: 'STUDENT', status: 'ACTIVE', departmentId: dept1._id },
      { name: 'Student C', email: 'student-c@uni.edu', password: 'pass123', role: 'STUDENT', status: 'ACTIVE', departmentId: dept1._id },
      { name: 'Student D', email: 'student-d@uni.edu', password: 'pass123', role: 'STUDENT', status: 'ACTIVE', departmentId: dept2._id },
    ]);

    // Seed one more faculty (on top of the one created in global beforeAll)
    await User.create({ name: 'Faculty A', email: 'faculty-a@uni.edu', password: 'pass123', role: 'FACULTY', status: 'ACTIVE' });
  });

  it('GET /stats returns correct non-zero counts', async () => {
    const res = await request(app)
      .get('/api/v1/admin/dashboard/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const { totalStudents, totalDepartments, totalCourses } = res.body.data;
    expect(totalStudents).toBe(4);
    expect(totalDepartments).toBe(2);
    expect(totalCourses).toBe(1);
  });

  it('GET /department-distribution returns sorted distribution with correct counts', async () => {
    const res = await request(app)
      .get('/api/v1/admin/dashboard/department-distribution')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(2);

    // Sorted descending: CS (3) first, ME (1) second
    expect(res.body.data[0].departmentName).toBe('Computer Science');
    expect(res.body.data[0].count).toBe(3);
    expect(res.body.data[1].departmentName).toBe('Mechanical Engineering');
    expect(res.body.data[1].count).toBe(1);

    // Validate output shape — no undefined or NaN values
    res.body.data.forEach((entry) => {
      expect(entry).toHaveProperty('departmentName');
      expect(entry).toHaveProperty('count');
      expect(typeof entry.count).toBe('number');
      expect(isNaN(entry.count)).toBe(false);
    });
  });

  it('GET /insights fires NO_HOD alert for departments without HODs', async () => {
    const res = await request(app)
      .get('/api/v1/admin/insights')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const noHodInsights = res.body.data.filter((i) => i.type === 'NO_HOD');
    // Both CS and ME have no HOD → 2 alerts should fire
    expect(noHodInsights.length).toBe(2);

    noHodInsights.forEach((insight) => {
      expect(insight).toHaveProperty('id');
      expect(insight).toHaveProperty('message');
      expect(insight).toHaveProperty('severity');
      expect(insight).toHaveProperty('actionRoute');
      expect(insight).toHaveProperty('actionText');
      // actionRoute should include role=HOD for targeted linking
      expect(insight.actionRoute).toContain('role=HOD');
    });
  });

  it('GET /insights resolves NO_HOD for a dept once HOD with valid shift is assigned', async () => {
    // Assign an HOD with GENERAL shift to dept1 (CS)
    await User.create({
      name: 'HOD CS',
      email: 'hod-cs@uni.edu',
      password: 'pass123',
      role: 'HOD',
      status: 'ACTIVE',
      departmentId: dept1._id,
      shift: 'GENERAL',
    });

    const res = await request(app)
      .get('/api/v1/admin/insights')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const noHodInsights = res.body.data.filter((i) => i.type === 'NO_HOD');
    // dept1 (CS) is now covered — only dept2 (ME) should still fire
    expect(noHodInsights.length).toBe(1);
    expect(noHodInsights[0].message).toContain('Mechanical Engineering');
  });

  it('GET /insights fires PENDING_FIRST_LOGIN for users who never logged in after 7+ days', async () => {
    // Insert directly with createdAt 8 days ago to bypass Mongoose timestamp auto-set
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
    await User.collection.insertOne({
      name: 'Old New User',
      email: 'old-new@uni.edu',
      password: 'hashedpassword',
      role: 'FACULTY',
      status: 'ACTIVE',
      lastLoginAt: null,
      refreshTokens: [],
      createdAt: eightDaysAgo,
      updatedAt: eightDaysAgo,
    });

    const res = await request(app)
      .get('/api/v1/admin/insights')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const pendingInsight = res.body.data.find((i) => i.type === 'PENDING_FIRST_LOGIN');
    expect(pendingInsight).toBeTruthy();
    expect(pendingInsight.message).toMatch(/never logged in/);
    expect(pendingInsight.severity).toBe('info');
  });

  describe('COLLEGE_ADMIN Dashboard Restrictions & Notices Feed', () => {
    it('should block COLLEGE_ADMIN from fetching raw system audit logs with 403', async () => {
      const res = await request(app)
        .get('/api/v1/audit-logs')
        .set('Authorization', `Bearer ${collegeAdminToken}`);

      expect(res.status).toBe(403);
    });

    it('should block COLLEGE_ADMIN from fetching users audit logs with 403', async () => {
      const res = await request(app)
        .get('/api/v1/users/audit-logs')
        .set('Authorization', `Bearer ${collegeAdminToken}`);

      expect(res.status).toBe(403);
    });

    it('should allow COLLEGE_ADMIN to fetch recent notices on the dashboard', async () => {
      const res = await request(app)
        .get('/api/v1/admin/dashboard/recent-notices')
        .set('Authorization', `Bearer ${collegeAdminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
