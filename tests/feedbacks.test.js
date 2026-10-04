import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';

vi.mock('../src/models/feedback.js', () => ({
  Feedback: {
    create: vi.fn(),
    findById: vi.fn(),
    findOneAndUpdate: vi.fn(),
    aggregate: vi.fn(),
  },
}));
vi.mock('../src/models/location.js', () => ({
  Location: {
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
  },
}));
vi.mock('../src/models/category.js', () => ({}));
vi.mock('../src/models/session.js', () => ({
  Session: { findOne: vi.fn() },
}));
vi.mock('../src/models/user.js', () => ({
  User: { findById: vi.fn() },
}));

import { Feedback } from '../src/models/feedback.js';
import { Location } from '../src/models/location.js';
import { Session } from '../src/models/session.js';
import { User } from '../src/models/user.js';
import feedbackRoutes from '../src/routes/feedbackRoutes.js';
import { errorHandler } from '../src/middleware/errorHandler.js';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/feedbacks', feedbackRoutes);
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

beforeEach(() => {
  vi.clearAllMocks();
  Session.findOne.mockResolvedValue(validSession);
  User.findById.mockResolvedValue({ _id: userId, name: 'Relax Tester' });
  Location.findById.mockResolvedValue({ _id: validBody.locationId, name: 'Relax Spot' });
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
        status: 'pending',
      });
    });
  });

  describe('errors', () => {
    it('returns 404 when location is not found', async () => {
      Location.findById.mockResolvedValue(null);

      const res = await request(app)
        .post('/feedbacks')
        .set('Cookie', [
          `sessionId=${validSession._id}`,
          `accessToken=${validSession.accessToken}`,
        ])
        .send(validBody);

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: 'Location not found' });
      expect(Feedback.create).not.toHaveBeenCalled();
    });

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

describe('PATCH /feedbacks/:feedbackId/approve', () => {
  const feedbackId = '665f1b2b2f4e0a1c3b5d7f94';
  const locationId = validBody.locationId;

  it('returns 401 without auth cookies', async () => {
    const res = await request(app).patch(`/feedbacks/${feedbackId}/approve`);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: 'Missing access token' });
  });

  it('returns 404 when feedback is not found', async () => {
    Feedback.findOneAndUpdate.mockResolvedValue(null);
    Feedback.findById.mockResolvedValue(null);

    const res = await request(app)
      .patch(`/feedbacks/${feedbackId}/approve`)
      .set('Cookie', [
        `sessionId=${validSession._id}`,
        `accessToken=${validSession.accessToken}`,
      ]);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: 'Feedback not found' });
    expect(Location.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('approves pending feedback and recalculates location rating', async () => {
    const approvedFeedback = {
      _id: feedbackId,
      locationId,
      owner: userId,
      userName: validBody.userName,
      rate: 5,
      description: validBody.description,
      status: 'approved',
    };
    Feedback.findOneAndUpdate.mockResolvedValue(approvedFeedback);
    Feedback.aggregate.mockResolvedValue([{ rating: 4.5, reviewsCount: 2 }]);
    Location.findByIdAndUpdate.mockResolvedValue({});

    const res = await request(app)
      .patch(`/feedbacks/${feedbackId}/approve`)
      .set('Cookie', [
        `sessionId=${validSession._id}`,
        `accessToken=${validSession.accessToken}`,
      ]);

    expect(res.status).toBe(200);
    expect(Feedback.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: feedbackId, status: 'pending' },
      { status: 'approved' },
      { new: true },
    );
    expect(Feedback.findById).not.toHaveBeenCalled();
    expect(Feedback.aggregate).toHaveBeenCalledWith([
      { $match: { locationId, status: 'approved' } },
      {
        $group: {
          _id: null,
          rating: { $avg: '$rate' },
          reviewsCount: { $sum: 1 },
        },
      },
    ]);
    expect(Location.findByIdAndUpdate).toHaveBeenCalledWith(locationId, {
      rating: 4.5,
      reviewsCount: 2,
    });
    expect(res.body.status).toBe('approved');
  });

  it('recalculates location stats when feedback is already approved', async () => {
    const approvedFeedback = {
      _id: feedbackId,
      locationId,
      status: 'approved',
    };
    Feedback.findOneAndUpdate.mockResolvedValue(null);
    Feedback.findById.mockResolvedValue(approvedFeedback);
    Feedback.aggregate.mockResolvedValue([{ rating: 4, reviewsCount: 1 }]);
    Location.findByIdAndUpdate.mockResolvedValue({});

    const res = await request(app)
      .patch(`/feedbacks/${feedbackId}/approve`)
      .set('Cookie', [
        `sessionId=${validSession._id}`,
        `accessToken=${validSession.accessToken}`,
      ]);

    expect(res.status).toBe(200);
    expect(Feedback.findById).toHaveBeenCalledWith(feedbackId);
    expect(Location.findByIdAndUpdate).toHaveBeenCalledWith(locationId, {
      rating: 4,
      reviewsCount: 1,
    });
  });
});
