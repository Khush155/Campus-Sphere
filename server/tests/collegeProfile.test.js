const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../src/app');
const User = require('../src/models/User');
const CollegeProfile = require('../src/models/CollegeProfile');
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

  // Clean up any test upload files
  const testUploadDir = path.join(__dirname, '../src/uploads/college-test');
  if (fs.existsSync(testUploadDir)) {
    const files = fs.readdirSync(testUploadDir);
    for (const file of files) {
      fs.unlinkSync(path.join(testUploadDir, file));
    }
    fs.rmdirSync(testUploadDir);
  }
}, 60000);

beforeEach(async () => {
  await CollegeProfile.deleteMany({});
  await AuditLog.deleteMany({});
});

describe('College Profile API Integration Tests', () => {
  it('should return singleton default college profile on first GET call', async () => {
    const res = await request(app)
      .get('/api/v1/college-profile')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('My College');

    const totalCount = await CollegeProfile.countDocuments({});
    expect(totalCount).toBe(1);
  });

  it('should never create a second profile document on subsequent calls', async () => {
    const res1 = await request(app)
      .get('/api/v1/college-profile')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res1.status).toBe(200);

    const res2 = await request(app)
      .get('/api/v1/college-profile')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res2.status).toBe(200);

    const totalCount = await CollegeProfile.countDocuments({});
    expect(totalCount).toBe(1);
  });

  it('should allow SUPER_ADMIN to update college profile details and record audit log', async () => {
    const res = await request(app)
      .put('/api/v1/college-profile')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Technological Institute of Technology',
        affiliation: 'Affiliated to State University',
        address: '100 Innovation Way',
        contactEmail: 'info@tit.edu',
        contactPhone: '+1-555-0199',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Technological Institute of Technology');
    expect(res.body.data.contactEmail).toBe('info@tit.edu');

    // Verify AuditLog contains the update event
    const log = await AuditLog.findOne({ action: 'COLLEGE_PROFILE_UPDATED' });
    expect(log).toBeDefined();
    expect(log.actorId.toString()).toBe(adminUser._id.toString());
  });

  it('should reject updating profile details for non-SUPER_ADMIN users with 403', async () => {
    const res = await request(app)
      .put('/api/v1/college-profile')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        name: 'Hacker Institute',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('should allow SUPER_ADMIN to upload logo, validating MIME type and size', async () => {
    // 1. Invalid MIME type (text file)
    const badMimeRes = await request(app)
      .post('/api/v1/college-profile/logo')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('logo', Buffer.from('hello world'), { filename: 'test.txt', contentType: 'text/plain' });

    expect(badMimeRes.status).toBe(400);
    expect(badMimeRes.body.success).toBe(false);

    // 2. File size exceeds 2MB limit
    const largeBuffer = Buffer.alloc(2.5 * 1024 * 1024); // 2.5MB
    const largeFileRes = await request(app)
      .post('/api/v1/college-profile/logo')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('logo', largeBuffer, { filename: 'large.png', contentType: 'image/png' });

    expect(largeFileRes.status).toBe(400);
    expect(largeFileRes.body.success).toBe(false);
    expect(largeFileRes.body.message).toContain('limit');

    // 3. Successful image upload
    const okRes = await request(app)
      .post('/api/v1/college-profile/logo')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('logo', Buffer.from('fake image bytes'), { filename: 'logo.png', contentType: 'image/png' });

    expect(okRes.status).toBe(200);
    expect(okRes.body.success).toBe(true);
    expect(okRes.body.data.logoUrl).toBeDefined();
    expect(okRes.body.data.logoUrl).toContain('/uploads/college-test/logo-');

    // Check file exists on disk
    const savedFilename = okRes.body.data.logoUrl.replace('/uploads/college-test/', '');
    const savedPath = path.join(__dirname, '../src/uploads/college-test', savedFilename);
    expect(fs.existsSync(savedPath)).toBe(true);
  });

  it('should replace previous logo on disk when uploading a new one', async () => {
    // 1. Upload first logo
    const okRes1 = await request(app)
      .post('/api/v1/college-profile/logo')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('logo', Buffer.from('image 1 bytes'), { filename: 'logo1.png', contentType: 'image/png' });
    expect(okRes1.status).toBe(200);

    const firstFilename = okRes1.body.data.logoUrl.replace('/uploads/college-test/', '');
    const firstPath = path.join(__dirname, '../src/uploads/college-test', firstFilename);
    expect(fs.existsSync(firstPath)).toBe(true);

    // 2. Upload second logo
    const okRes2 = await request(app)
      .post('/api/v1/college-profile/logo')
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('logo', Buffer.from('image 2 bytes'), { filename: 'logo2.png', contentType: 'image/png' });
    expect(okRes2.status).toBe(200);

    const secondFilename = okRes2.body.data.logoUrl.replace('/uploads/college-test/', '');
    const secondPath = path.join(__dirname, '../src/uploads/college-test', secondFilename);
    expect(fs.existsSync(secondPath)).toBe(true);

    // Verify first file is deleted from disk to prevent orphans
    expect(fs.existsSync(firstPath)).toBe(false);
  });
});
