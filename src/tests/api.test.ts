import request from 'supertest';
import app from '../index';
import { pool } from '../config/db';

// Mock the MySQL DB pool
jest.mock('../config/db', () => ({
  pool: {
    query: jest.fn(),
  },
}));

describe('Farmin REST API Security & Validation tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication Blocks', () => {
    it('should block requests without authorization token', async () => {
      const response = await request(app).get('/api/v1/income');
      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Access token required' });
    });

    it('should allow requests with valid guest bypass token', async () => {
      (pool.query as jest.Mock).mockResolvedValue([[]]);
      const response = await request(app)
        .get('/api/v1/income')
        .set('Authorization', 'Bearer guest-bypass-token');
      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/v1/income input validations', () => {
    it('should block income post with missing parameters', async () => {
      const response = await request(app)
        .post('/api/v1/income')
        .set('Authorization', 'Bearer guest-bypass-token')
        .send({ amount: 100 }); // missing source
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should block income post with negative amount', async () => {
      const response = await request(app)
        .post('/api/v1/income')
        .set('Authorization', 'Bearer guest-bypass-token')
        .send({ amount: -50, source: 'Sold Corn' });
      expect(response.status).toBe(400);
    });

    it('should successfully post valid income payloads', async () => {
      const mockInsertId = 12;
      (pool.query as jest.Mock).mockResolvedValue([{ insertId: mockInsertId }]);

      const response = await request(app)
        .post('/api/v1/income')
        .set('Authorization', 'Bearer guest-bypass-token')
        .send({ amount: 500.5, source: 'Corn Harvest Sales', description: 'Harvested from Plot A' });

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(mockInsertId);
      expect(response.body.amount).toBe(500.5);
    });
  });

  describe('POST /api/v1/expense input validations', () => {
    it('should block expense post with missing parameters', async () => {
      const response = await request(app)
        .post('/api/v1/expense')
        .set('Authorization', 'Bearer guest-bypass-token')
        .send({ category: 'Seedlings' }); // missing amount
      expect(response.status).toBe(400);
    });

    it('should successfully post valid expense payloads', async () => {
      const mockInsertId = 42;
      (pool.query as jest.Mock).mockResolvedValue([{ insertId: mockInsertId }]);

      const response = await request(app)
        .post('/api/v1/expense')
        .set('Authorization', 'Bearer guest-bypass-token')
        .send({ amount: 1200, category: 'Fertilizer Purchase', description: 'Urea bags' });

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(mockInsertId);
      expect(response.body.category).toBe('Fertilizer Purchase');
    });
  });
});
