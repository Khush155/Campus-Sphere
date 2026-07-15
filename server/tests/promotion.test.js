const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Department = require('../src/models/Department');
const Course = require('../src/models/Course');
const Branch = require('../src/models/Branch');
const PromotionBatch = require('../src/models/PromotionBatch');
const ROLES = require('../src/constants/roles');

let mongoReplSet;
let adminToken;
let adminUser;
let deptCS;
let deptME;
let courseBTech;
let courseMCA;
let branchCSE;
let branchMech;

beforeAll(async () => {
  // Start MongoMemoryReplSet so transactions are fully supported
  mongoReplSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const uri = mongoReplSet.getUri();
  await mongoose.connect(uri);

  // Create admin user
  adminUser = await User.create({
    name: 'Academic Registrar',
    email: 'registrar@campussphere.edu',
    password: 'password123',
    role: ROLES.SUPER_ADMIN,
  });

  const loginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'registrar@campussphere.edu', password: 'password123' });
  adminToken = loginRes.body.data.accessToken;

  // Create departments
  deptCS = await Department.create({ name: 'Computer Science', code: 'CS' });
  deptME = await Department.create({ name: 'Mechanical Engineering', code: 'ME' });

  // Create courses
  // B.Tech: 4 years -> 8 semesters
  courseBTech = await Course.create({ name: 'B.Tech', code: 'BTECH', durationYears: 4 });
  // MCA: 2 years -> 4 semesters
  courseMCA = await Course.create({ name: 'MCA', code: 'MCA', durationYears: 2 });

  // Create branches
  branchCSE = await Branch.create({ name: 'CSE', code: 'CSE', courseId: courseBTech._id });
  branchMech = await Branch.create({ name: 'MECH', code: 'MECH', courseId: courseBTech._id });
}, 90000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoReplSet) await mongoReplSet.stop();
}, 90000);

beforeEach(async () => {
  // Clean students and promotion batches before each test to maintain strict isolation
  await User.deleteMany({ role: ROLES.STUDENT });
  await PromotionBatch.deleteMany({});
});

describe('Bulk Semester/Year Promotion API Tests', () => {
  it('should correctly preview promotion outcomes without writing to the database', async () => {
    // Seed test students
    const student1 = await User.create({
      name: 'Alice Cooper',
      email: 'alice@campussphere.edu',
      password: 'password123',
      role: ROLES.STUDENT,
      status: 'ACTIVE',
      departmentId: deptCS._id,
      courseId: courseBTech._id,
      branchId: branchCSE._id,
      semester: 1,
      academicStatus: 'ONGOING',
    });

    const student2 = await User.create({
      name: 'Bob Marley',
      email: 'bob@campussphere.edu',
      password: 'password123',
      role: ROLES.STUDENT,
      status: 'ACTIVE',
      departmentId: deptCS._id,
      courseId: courseBTech._id,
      branchId: branchCSE._id,
      semester: 8, // Final semester for B.Tech
      academicStatus: 'ONGOING',
    });

    // Run preview
    const res = await request(app)
      .post('/api/v1/promotions/preview')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ departmentId: deptCS._id });

    expect(res.status).toBe(200);
    expect(res.body.data.totalPromote).toBe(1);
    expect(res.body.data.totalGraduate).toBe(1);
    expect(res.body.data.recentWarning).toBeNull();

    // Verify Alice is marked for PROMOTE and Bob is marked for GRADUATE
    const details = res.body.data.details;
    const aliceOutcome = details.find((d) => d.name === 'Alice Cooper');
    const bobOutcome = details.find((d) => d.name === 'Bob Marley');

    expect(aliceOutcome.outcome).toBe('PROMOTE');
    expect(aliceOutcome.newSemester).toBe(2);
    expect(bobOutcome.outcome).toBe('GRADUATE');
    expect(bobOutcome.newSemester).toBeNull();

    // Verify database WAS NOT mutated
    const dbAlice = await User.findById(student1._id);
    const dbBob = await User.findById(student2._id);
    expect(dbAlice.semester).toBe(1);
    expect(dbBob.semester).toBe(8);
    expect(dbBob.academicStatus).toBe('ONGOING');
  });

  it('should correctly execute promotion and graduate final semester students', async () => {
    const student1 = await User.create({
      name: 'Alice Cooper',
      email: 'alice@campussphere.edu',
      password: 'password123',
      role: ROLES.STUDENT,
      status: 'ACTIVE',
      departmentId: deptCS._id,
      courseId: courseBTech._id,
      branchId: branchCSE._id,
      semester: 1,
      academicStatus: 'ONGOING',
    });

    const student2 = await User.create({
      name: 'Bob Marley',
      email: 'bob@campussphere.edu',
      password: 'password123',
      role: ROLES.STUDENT,
      status: 'ACTIVE',
      departmentId: deptCS._id,
      courseId: courseBTech._id,
      branchId: branchCSE._id,
      semester: 8,
      academicStatus: 'ONGOING',
    });

    // Run execution
    const res = await request(app)
      .post('/api/v1/promotions/execute')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ departmentId: deptCS._id });

    expect(res.status).toBe(200);
    expect(res.body.data.promotedCount).toBe(1);
    expect(res.body.data.graduatedCount).toBe(1);

    // Verify database state has mutated correctly
    const dbAlice = await User.findById(student1._id);
    const dbBob = await User.findById(student2._id);

    expect(dbAlice.semester).toBe(2);
    expect(dbAlice.academicStatus).toBe('ONGOING');

    expect(dbBob.semester).toBe(8); // Semester stays at 8
    expect(dbBob.academicStatus).toBe('GRADUATED'); // Academic status becomes GRADUATED

    // Verify PromotionBatch document exists
    const batch = await PromotionBatch.findOne();
    expect(batch).toBeTruthy();
    expect(batch.promotedCount).toBe(1);
    expect(batch.graduatedCount).toBe(1);
    expect(batch.status).toBe('COMPLETED');
  });

  it('should prevent double-promotion and return warning message on subsequent run', async () => {
    // Seed student
    await User.create({
      name: 'Alice Cooper',
      email: 'alice@campussphere.edu',
      password: 'password123',
      role: ROLES.STUDENT,
      status: 'ACTIVE',
      departmentId: deptCS._id,
      courseId: courseBTech._id,
      branchId: branchCSE._id,
      semester: 1,
      academicStatus: 'ONGOING',
    });

    // Execute first run
    await request(app)
      .post('/api/v1/promotions/execute')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ departmentId: deptCS._id });

    // Request preview for a second run
    const previewRes = await request(app)
      .post('/api/v1/promotions/preview')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ departmentId: deptCS._id });

    expect(previewRes.status).toBe(200);
    // Warning should be present
    expect(previewRes.body.data.recentWarning).toContain('A promotion batch already ran');

    // Bob who graduated in the first run shouldn't appear in the second run if he was seeded and graduated
    // Alice is now semester 2, so she'd be promoted to 3 if we ran it again, but a second run is warned against.
  });

  it('should successfully roll back database changes if a mid-transaction failure occurs', async () => {
    const student1 = await User.create({
      name: 'Alice Cooper',
      email: 'alice@campussphere.edu',
      password: 'password123',
      role: ROLES.STUDENT,
      status: 'ACTIVE',
      departmentId: deptCS._id,
      courseId: courseBTech._id,
      branchId: branchCSE._id,
      semester: 1,
      academicStatus: 'ONGOING',
    });

    // Spy on PromotionBatch.create and mock it to throw an error mid-transaction
    const batchSpy = jest.spyOn(PromotionBatch, 'create').mockImplementationOnce(() => {
      throw new Error('Simulated Mid-Transaction Database Crash');
    });

    // Execute promotion run
    const res = await request(app)
      .post('/api/v1/promotions/execute')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ departmentId: deptCS._id });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Promotion failed and was rolled back');

    // Verify student1 was NOT promoted (transaction rolled back the update)
    const dbAlice = await User.findById(student1._id);
    expect(dbAlice.semester).toBe(1);

    // Verify no PromotionBatch was written
    const batches = await PromotionBatch.find();
    expect(batches.length).toBe(0);

    batchSpy.mockRestore();
  });

  it('should only promote students inside the target scope and leave others unaffected', async () => {
    // CS student (in scope)
    const csStudent = await User.create({
      name: 'CS Student',
      email: 'cs@campussphere.edu',
      password: 'password123',
      role: ROLES.STUDENT,
      status: 'ACTIVE',
      departmentId: deptCS._id,
      courseId: courseBTech._id,
      branchId: branchCSE._id,
      semester: 3,
      academicStatus: 'ONGOING',
    });

    // ME student (out of scope)
    const meStudent = await User.create({
      name: 'ME Student',
      email: 'me@campussphere.edu',
      password: 'password123',
      role: ROLES.STUDENT,
      status: 'ACTIVE',
      departmentId: deptME._id,
      courseId: courseBTech._id,
      branchId: branchMech._id,
      semester: 3,
      academicStatus: 'ONGOING',
    });

    // Run execution scoped ONLY to CS department
    const res = await request(app)
      .post('/api/v1/promotions/execute')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ departmentId: deptCS._id });

    expect(res.status).toBe(200);
    expect(res.body.data.promotedCount).toBe(1);

    // Verify CS student promoted, ME student untouched
    const dbCS = await User.findById(csStudent._id);
    const dbME = await User.findById(meStudent._id);

    expect(dbCS.semester).toBe(4);
    expect(dbME.semester).toBe(3);
  });
});
