import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import createHttpError from 'http-errors';

vi.mock('../src/models/user.js', () => ({
  User: { findOne: vi.fn() },
}));
vi.mock('../src/models/session.js', () => ({
  Session: { deleteMany: vi.fn(), findOne: vi.fn() },
}));
vi.mock('../src/utils/sendMail.js', () => ({
  sendEmail: vi.fn(),
}));

import { User } from '../src/models/user.js';
import { Session } from '../src/models/session.js';
import { sendEmail } from '../src/utils/sendMail.js';
import authRoutes from '../src/routes/authRoutes.js';
import { errorHandler } from '../src/middleware/errorHandler.js';

process.env.JWT_ACCESS_SECRET = 'test-access-secret';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.SMTP_FROM = 'noreply@relaxmap.local';

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);
app.use(errorHandler);

const userId = '665f1b2b2f4e0a1c3b5d7f91';
const email = 'ada@example.com';

const makeUser = () => {
  const user = {
    _id: userId,
    email,
    name: 'Ada',
    password: 'old-hash',
  };
  user.save = vi.fn(async () => user);
  return user;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /auth/request-reset-email', () => {
  it('sends a reset link for an existing user', async () => {
    User.findOne.mockResolvedValue(makeUser());
    sendEmail.mockResolvedValue();

    const res = await request(app)
      .post('/auth/request-reset-email')
      .send({ email });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Reset password email has been sent' });
    expect(sendEmail).toHaveBeenCalledTimes(1);

    const message = sendEmail.mock.calls[0][0];
    expect(message.to).toBe(email);
    expect(message.subject).toBe('Reset your password');
    expect(message.html).toContain('Hi Ada');

    const html = message.html.replaceAll('&#x3D;', '=');
    expect(html).toContain('http://localhost:3000/reset-password?token=');

    const token = html.match(/token=([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)/)[1];
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    expect(payload.purpose).toBe('password-reset');
    expect(payload.email).toBe(email);
    expect(payload.sub).toBe(userId);
  });

  it('returns 404 when the email is not registered', async () => {
    User.findOne.mockResolvedValue(null);

    const res = await request(app)
      .post('/auth/request-reset-email')
      .send({ email });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: 'User not found' });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('builds a link without a double slash when FRONTEND_URL ends with /', async () => {
    const original = process.env.FRONTEND_URL;
    process.env.FRONTEND_URL = 'https://relaxmap.example/';
    User.findOne.mockResolvedValue(makeUser());
    sendEmail.mockResolvedValue();

    try {
      const res = await request(app)
        .post('/auth/request-reset-email')
        .send({ email });

      expect(res.status).toBe(200);
      const html = sendEmail.mock.calls[0][0].html.replaceAll('&#x3D;', '=');
      expect(html).toContain('https://relaxmap.example/reset-password?token=');
      expect(html).not.toContain('relaxmap.example//');
    } finally {
      process.env.FRONTEND_URL = original;
    }
  });

  it('returns the mail error instead of hanging when sending fails', async () => {
    User.findOne.mockResolvedValue(makeUser());
    sendEmail.mockRejectedValue(
      createHttpError(502, 'Failed to send email. Please try again later.'),
    );

    const res = await request(app)
      .post('/auth/request-reset-email')
      .send({ email });

    expect(res.status).toBe(502);
    expect(res.body).toEqual({
      message: 'Failed to send email. Please try again later.',
    });
  });

  it('returns 400 for an invalid email', async () => {
    const res = await request(app)
      .post('/auth/request-reset-email')
      .send({ email: 'not-an-email' });

    expect(res.status).toBe(400);
    expect(User.findOne).not.toHaveBeenCalled();
  });
});

describe('POST /auth/reset-password', () => {
  it('updates the password and deletes sessions', async () => {
    const user = makeUser();
    const token = jwt.sign(
      { purpose: 'password-reset', email },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: 60, subject: userId },
    );
    User.findOne.mockResolvedValue(user);
    Session.deleteMany.mockResolvedValue({ deletedCount: 1 });

    const res = await request(app)
      .post('/auth/reset-password')
      .send({ token, password: 'NewPass123' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Password has been reset' });
    expect(user.password).not.toBe('old-hash');
    expect(user.save).toHaveBeenCalledTimes(1);
    expect(Session.deleteMany).toHaveBeenCalledWith({ userId });
  });

  it('returns 401 for an expired or foreign token', async () => {
    const accessToken = jwt.sign(
      { userId },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: 60 },
    );

    const res = await request(app)
      .post('/auth/reset-password')
      .send({ token: accessToken, password: 'NewPass123' });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: 'Token is expired or invalid' });
    expect(User.findOne).not.toHaveBeenCalled();
  });

  it('returns 404 when the token user no longer exists', async () => {
    const token = jwt.sign(
      { purpose: 'password-reset', email },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: 60, subject: userId },
    );
    User.findOne.mockResolvedValue(null);

    const res = await request(app)
      .post('/auth/reset-password')
      .send({ token, password: 'NewPass123' });

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: 'User not found' });
  });
});
