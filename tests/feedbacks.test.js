import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';

vi.mock('../src/models/feedback.js', () => ({
  Feedback: { create: vi.fn() },
}));
vi.mock('../src/models/location.js', () => ({}));
vi.mock('../src/models/category.js', () => ({}));
vi.mock('../src/models/session.js', () => ({
  Session: { findOne: vi.fn() },
}));
vi.mock('../src/models/user.js', () => ({
  User: { findById: vi.fn() },
}));

import { Feedback } from '../src/models/feedback.js';
import { Session } from '../src/models/session.js';
import { User } from '../src/models/user.js';
import feedbackRoutes from '../src/routes/feedbackRoutes.js';
import { errorHandler } from '../src/middleware/errorHandler.js';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(feedbackRoutes);
app.use(errorHandler);

const userId = '665f1b2b2f4e0a1c3b5d7f91';
const validSession = {
  _id: '665f1b2b2f4e0a1c3b5d7f92',
  userId,
  accessToken: 'valid-token',
  accessTokenValidUntil: new Date(Date.now() + 60 * 60 * 1000),
};

const validBody = {
  locationId: '665f1b2b2f4e0a1c3b5d7f93',
  userName: 'Relax Tester',
  rate: 5,
  description: 'Wonderful place to unwind',
};

const authCookies = {
  sessionId: validSession._id,
  accessToken: validSession.accessToken,
};

beforeEach(() => {
  vi.clearAllMocks();
  Session.findOne.mockResolvedValue(validSession);
  User.findById.mockResolvedValue({ _id: userId, name: 'Relax Tester' });
});

describe('POST /feedbacks (createFeedback)', () => {
  describe('authentication', () => {
    it('returns 401 when auth cookies are missing', async () => {
      const res = await request(app).post('/feedbacks').send(validBody);

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ message: 'Missing access token' });
    });

    it('returns 401 when session is not found', async () => {
      Session.findOne.mockResolvedValue(null);

      const res = await request(app)
        .post('/feedbacks')
        .set('Cookie', ['sessionId=unknown', 'accessToken=wrong-token'])
        .send(validBody);

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ message: 'Session not found' });
    });

    it('returns 401 when access token is expired', async () => {
      Session.findOne.mockResolvedValue({
        ...validSession,
        accessTokenValidUntil: new Date(Date.now() - 60 * 1000),
      });

      const res = await request(app)
        .post('/feedbacks')
        .set('Cookie', [
          `sessionId=${validSession._id}`,
          `accessToken=${validSession.accessToken}`,
        ])
        .send(validBody);

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ message: 'Access token expired' });
    });

    it('returns 401 when user is not found', async () => {
      User.findById.mockResolvedValue(null);

      const res = await request(app)
        .post('/feedbacks')
        .set('Cookie', [
          `sessionId=${validSession._id}`,
          `accessToken=${validSession.accessToken}`,
        ])
        .send(validBody);

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ message: 'User not found' });
    });
  });

  describe('validation', () => {
    it('returns 400 when body is invalid', async () => {
      const res = await request(app)
        .post('/feedbacks')
        .set('Cookie', [
          `sessionId=${validSession._id}`,
          `accessToken=${validSession.accessToken}`,
        ])
        .send({ ...validBody, rate: 10 });

      expect(res.status).toBe(400);
      expect(res.body.message).toBeDefined();
      expect(Feedback.create).not.toHaveBeenCalled();
    });
  });

  describe('success', () => {
    it('creates a feedback and returns it with 201', async () => {
      const createdDoc = {
        _id: '665f1b2b2f4e0a1c3b5d7f94',
        ...validBody,
        owner: userId,
        status: 'pending',
      };
      Feedback.create.mockResolvedValue(createdDoc);

      const res = await request(app)
        .post('/feedbacks')
        .set('Cookie', [
          `sessionId=${validSession._id}`,
          `accessToken=${validSession.accessToken}`,
        ])
        .send(validBody);

      expect(res.status).toBe(201);
      expect(res.body).toEqual(createdDoc);
      expect(Feedback.create).toHaveBeenCalledTimes(1);
      expect(Feedback.create).toHaveBeenCalledWith({
        locationId: validBody.locationId,
        owner: userId,
        userName: validBody.userName,
        rate: validBody.rate,
        description: validBody.description,
      });
    });
  });

  describe('errors', () => {
    it('returns 500 when Feedback.create fails', async () => {
      Feedback.create.mockRejectedValue(new Error('db down'));

      const res = await request(app)
        .post('/feedbacks')
        .set('Cookie', [
          `sessionId=${validSession._id}`,
          `accessToken=${validSession.accessToken}`,
        ])
        .send(validBody);

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ message: 'db down' });
    });
  });
});
