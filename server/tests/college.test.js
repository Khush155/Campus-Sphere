const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Course = require('../src/models/Course');
const Branch = require('../src/models/Branch');
const Department = require('../src/models/Department');
const Subject = require('../src/models/Subject');
const ROLES = require('../src/constants/roles');

let mongoServer;
let adminToken;
let studentToken;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // Generate tokens for authentication checks
  const admin = await User.create({
    name: 'College Admin',
    email: 'admin@campussphere.edu',
    password: 'password123',
    role: ROLES.SUPER_ADMIN,
  });
  const student = await User.create({
    name: 'Normal Student',
    email: 'student@campussphere.edu',
    password: 'password123',
    role: ROLES.STUDENT,
  });

  // Login request mock
  const adminLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: admin.email, password: 'password123' });
  adminToken = adminLogin.body.data.accessToken;

  const studentLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: student.email, password: 'password123' });
  studentToken = studentLogin.body.data.accessToken;
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
}, 60000);

beforeEach(async () => {
  // Clear academic collections between tests to keep state isolated
  await Department.deleteMany({});
  await Course.deleteMany({});
  await Branch.deleteMany({});
  await Subject.deleteMany({});
});

describe('College Setup API Integration Tests', () => {
  // Mock Payloads
  const mockDept = {
    name: 'Computer Science and Engineering',
    code: 'CSE',
    description: 'Core department for engineering logic',
  };

  const mockCourseBTech = {
    name: 'Bachelor of Technology',
    code: 'B.TECH',
    durationYears: 4,
  };

  const mockCourseMCA = {
    name: 'Master of Computer Applications',
    code: 'MCA',
    durationYears: 2,
  };

  describe('Department API', () => {
    it('should successfully create a new department when called by Admin', async () => {
      const res = await request(app)
        .post('/api/v1/college/departments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(mockDept)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.code).toBe('CSE');
    });

    it('should block read-write actions for unauthorized roles (Student)', async () => {
      await request(app)
        .post('/api/v1/college/departments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(mockDept)
        .expect(403);
    });

    it('should return 400 duplicate entry error if code is already registered', async () => {
      await Department.create(mockDept);

      const res = await request(app)
        .post('/api/v1/college/departments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Alternative Computer Science',
          code: 'CSE', // Duplicate code
        })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('DUPLICATE_ENTRY');
    });
  });

  describe('Course & Branch API', () => {
    it('should create branches linked to valid courses', async () => {
      const course = await Course.create(mockCourseBTech);

      const res = await request(app)
        .post('/api/v1/college/branches')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Information Technology',
          code: 'IT',
          courseId: course._id.toString(),
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.code).toBe('IT');
    });

    it('should fail branch registration if parent courseId is invalid', async () => {
      const randomObjectId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .post('/api/v1/college/branches')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Computer Engineering',
          code: 'COE',
          courseId: randomObjectId,
        })
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('NOT_FOUND');
    });
  });

  describe('Subject & Semester Limits Verification (User Constraint)', () => {
    it('should successfully save a subject within course duration constraints', async () => {
      // 1. Create a 4-year B.Tech Course (max semesters = 8)
      const course = await Course.create(mockCourseBTech);
      const branch = await Branch.create({
        name: 'Computer Engineering',
        code: 'CSE',
        courseId: course._id,
      });
      const dept = await Department.create(mockDept);

      // 2. Add subject in Semester 5 (Valid, since 5 <= 8)
      const res = await request(app)
        .post('/api/v1/college/subjects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Data Structures and Algorithms',
          code: 'CS501',
          credits: 4,
          type: 'THEORY',
          branchId: branch._id.toString(),
          departmentId: dept._id.toString(),
          semester: 5,
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.semester).toBe(5);
    });

    it('should fail to save a subject if the semester number exceeds the course duration', async () => {
      // 1. Create a 4-year B.Tech Course (max semesters = 8)
      const courseBTech = await Course.create(mockCourseBTech);
      const branchBTech = await Branch.create({
        name: 'Computer Engineering',
        code: 'CSE',
        courseId: courseBTech._id,
      });
      const dept = await Department.create(mockDept);

      // 2. Attempt subject in Semester 9 (Invalid for 4-year course)
      const btechRes = await request(app)
        .post('/api/v1/college/subjects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Advanced Systems Programming',
          code: 'CS901',
          credits: 4,
          type: 'THEORY',
          branchId: branchBTech._id.toString(),
          departmentId: dept._id.toString(),
          semester: 9,
        })
        .expect(400);

      expect(btechRes.body.success).toBe(false);
      expect(btechRes.body.errorCode).toBe('VALIDATION_ERROR');
      expect(btechRes.body.message).toContain('exceeds the maximum semesters');

      // 3. Create a 2-year MCA Course (max semesters = 4)
      const courseMCA = await Course.create(mockCourseMCA);
      const branchMCA = await Branch.create({
        name: 'MCA General',
        code: 'MCA',
        courseId: courseMCA._id,
      });

      // 4. Attempt subject in Semester 5 (Invalid for 2-year course)
      const mcaRes = await request(app)
        .post('/api/v1/college/subjects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Database Architectures',
          code: 'MCA501',
          credits: 3,
          type: 'THEORY',
          branchId: branchMCA._id.toString(),
          departmentId: dept._id.toString(),
          semester: 5,
        })
        .expect(400);

      expect(mcaRes.body.success).toBe(false);
      expect(mcaRes.body.errorCode).toBe('VALIDATION_ERROR');
      expect(mcaRes.body.message).toContain('exceeds the maximum semesters');
    });
  });
});
