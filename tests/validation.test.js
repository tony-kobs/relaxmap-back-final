import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import authRoutes from '../src/routes/authRoutes.js';
import { errorHandler } from '../src/middleware/errorHandler.js';

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);
app.use(errorHandler);

describe('validation errors', () => {
  it('returns every invalid field at once', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ name: 'A', email: 'not-an-email', password: '123' });

    expect(res.status).toBe(400);
    expect(res.body.errors.map((item) => item.field)).toEqual([
      'name',
      'email',
      'password',
    ]);
    expect(res.body.message).toBe(
      res.body.errors.map((item) => item.message).join('; '),
    );
  });

  it('keeps a single message when only one field is invalid', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'ada@example.com' });

    expect(res.status).toBe(400);
    expect(res.body.errors).toHaveLength(1);
    expect(typeof res.body.message).toBe('string');
    expect(res.body.message).toBe(res.body.errors[0].message);
  });
});
