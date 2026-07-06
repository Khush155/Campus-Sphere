const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const ROLES = require('../src/constants/roles');

let mongoServer;

beforeAll(async () => {
  // Setup isolated database in RAM
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
}, 60000);

beforeEach(async () => {
  // Clear user collections before every test to isolate state
  await User.deleteMany({});
});

describe('Authentication API Integration Tests', () => {
  const mockAdmin = {
    name: 'Admin User',
    email: 'admin@campussphere.edu',
    password: 'password123',
    role: ROLES.SUPER_ADMIN,
  };

  const mockStudent = {
    name: 'Student User',
    email: 'student@campussphere.edu',
    password: 'password123',
    role: ROLES.STUDENT,
  };

  // Helper function to register and login a user to get tokens
  const getAuthSession = async (userPayload) => {
    // 1. First register a user by creating directly (since register route is protected)
    const user = await User.create(userPayload);
    
    // 2. Perform login request
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: userPayload.email, password: userPayload.password });

    const cookieHeader = loginRes.headers['set-cookie'][0];
    const refreshTokenCookie = cookieHeader.split(';')[0];

    return {
      userId: user._id,
      accessToken: loginRes.body.data.accessToken,
      refreshTokenCookie,
    };
  };

  describe('POST /api/v1/auth/register', () => {
    it('should successfully register a new user when called by an authorized Admin', async () => {
      // 1. Log in admin to get access token
      const session = await getAuthSession(mockAdmin);

      // 2. Register student via API using admin token
      const res = await request(app)
        .post('/api/v1/auth/register')
        .set('Authorization', `Bearer ${session.accessToken}`)
        .send(mockStudent)
        .expect(201);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('email', mockStudent.email);
      expect(res.body.data).not.toHaveProperty('password'); // Password excluded
    });

    it('should block registration and return 403 when called by a Student role', async () => {
      // 1. Log in student to get student access token
      const studentSession = await getAuthSession(mockStudent);

      // 2. Attempt registration of another student using student token
      const res = await request(app)
        .post('/api/v1/auth/register')
        .set('Authorization', `Bearer ${studentSession.accessToken}`)
        .send({
          name: 'Another Student',
          email: 'another@campussphere.edu',
          password: 'password123',
          role: ROLES.STUDENT,
        })
        .expect(403);

      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('errorCode', 'FORBIDDEN');
    });

    it('should fail registration when input fields are invalid or missing (Zod validation)', async () => {
      const session = await getAuthSession(mockAdmin);

      const res = await request(app)
        .post('/api/v1/auth/register')
        .set('Authorization', `Bearer ${session.accessToken}`)
        .send({
          name: '', // Empty name
          email: 'bademailformat',
          password: '123', // Too short
          role: 'INVALID_ROLE',
        })
        .expect(400);

      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('errorCode', 'VALIDATION_ERROR');
      expect(res.body.data.fields).toHaveLength(4); // 4 failures
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should authenticate user and return access token + HttpOnly cookie', async () => {
      await User.create(mockStudent);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: mockStudent.email,
          password: mockStudent.password,
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.headers['set-cookie']).toBeDefined();
      expect(res.headers['set-cookie'][0]).toContain('HttpOnly');
    });

    it('should reject login and return 401 for incorrect password', async () => {
      await User.create(mockStudent);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: mockStudent.email,
          password: 'wrongpassword',
        })
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('UNAUTHORIZED');
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should successfully rotate tokens when sending a valid refresh cookie', async () => {
      const session = await getAuthSession(mockStudent);

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', [session.refreshTokenCookie])
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.headers['set-cookie']).toBeDefined(); // Rotated cookie returned
    });

    it('should return 401 if refresh cookie is missing', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.errorCode).toBe('UNAUTHORIZED');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should remove refresh token from database and clear client cookie', async () => {
      const session = await getAuthSession(mockStudent);

      // Verify token exists on user before logout
      let user = await User.findById(session.userId);
      expect(user.refreshTokens).toHaveLength(1);

      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${session.accessToken}`)
        .set('Cookie', [session.refreshTokenCookie])
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.headers['set-cookie'][0]).toContain('Max-Age=0'); // Cleared cookie

      // Verify token is removed from database
      user = await User.findById(session.userId);
      expect(user.refreshTokens).toHaveLength(0);
    });
  });

  describe('Password Reset Flow', () => {
    it('should complete full forgot and reset password lifecycle', async () => {
      await User.create(mockStudent);

      // 1. Request forgot password link
      const forgotRes = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: mockStudent.email })
        .expect(200);

      expect(forgotRes.body.success).toBe(true);
      const resetLink = forgotRes.body.data.resetLink;
      expect(resetLink).toBeDefined();

      // Extract raw token from url
      const token = resetLink.split('/').pop();

      // 2. Reset password using token
      const newPassword = 'newsuperpassword123';
      const resetRes = await request(app)
        .post(`/api/v1/auth/reset-password/${token}`)
        .send({ password: newPassword })
        .expect(200);

      expect(resetRes.body.success).toBe(true);

      // 3. Confirm login works with new password
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: mockStudent.email, password: newPassword })
        .expect(200);

      expect(loginRes.body.success).toBe(true);
      expect(loginRes.body.data).toHaveProperty('accessToken');
    });
  });
});
