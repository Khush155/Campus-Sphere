const request = require('supertest');
const app = require('../src/app');

describe('GET /health', () => {
  it('should return 200 OK with server health statistics', async () => {
    const res = await request(app)
      .get('/health')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('message', 'Server health check passed');
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('status', 'ok');
    expect(res.body.data).toHaveProperty('uptime');
    expect(res.body.data).toHaveProperty('database');
    expect(res.body.data).toHaveProperty('environment', 'test');
  });

  it('should return 404 for root / in non-production mode (no static client served)', async () => {
    // In test/development mode, NODE_ENV !== 'production', so the React static build
    // is NOT served. The root path falls through to the catch-all and returns 404.
    // In production, express.static serves index.html and this returns 200.
    const res = await request(app)
      .get('/')
      .expect(404);

    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('errorCode', 'NOT_FOUND');
  });

  it('should return 404 for non-existent routes with standard error shape', async () => {
    const res = await request(app)
      .get('/api/v1/non-existent-route')
      .expect(404);

    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('errorCode', 'NOT_FOUND');
    expect(res.body).toHaveProperty('message');
  });
});
