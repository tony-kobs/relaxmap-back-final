import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';

vi.mock('../src/models/user.js', () => ({
  User: { findById: vi.fn(), findByIdAndUpdate: vi.fn() },
}));
vi.mock('../src/models/session.js', () => ({
  Session: { findOne: vi.fn() },
}));
vi.mock('../src/models/location.js', () => ({
  Location: {},
}));
vi.mock('../src/utils/saveFileToCloudinary.js', () => ({
  saveFileToCloudinary: vi.fn(),
}));

import { User } from '../src/models/user.js';
import { Session } from '../src/models/session.js';
import { saveFileToCloudinary } from '../src/utils/saveFileToCloudinary.js';
import userRoutes from '../src/routes/userRoutes.js';
import { errorHandler } from '../src/middleware/errorHandler.js';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/users', userRoutes);
app.use(errorHandler);

const userId = '665f1b2b2f4e0a1c3b5d7f91';
const validSession = {
  _id: '665f1b2b2f4e0a1c3b5d7f92',
  userId,
  accessToken: 'valid-token',
  accessTokenValidUntil: new Date(Date.now() + 60 * 60 * 1000),
};
const authCookie = [
  `sessionId=${validSession._id}`,
  `accessToken=${validSession.accessToken}`,
];
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

beforeEach(() => {
  vi.clearAllMocks();
  Session.findOne.mockResolvedValue(validSession);
  User.findById.mockResolvedValue({
    _id: userId,
    name: 'Ada',
    email: 'ada@relaxmap.local',
  });
});

describe('PATCH /users/me', () => {
  it('updates the current user name', async () => {
    const updated = { _id: userId, name: 'New Name', email: 'ada@relaxmap.local' };
    User.findByIdAndUpdate.mockResolvedValue(updated);

    const res = await request(app)
      .patch('/users/me')
      .set('Cookie', authCookie)
      .send({ name: 'New Name' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(updated);
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      userId,
      { name: 'New Name' },
      { new: true, runValidators: true },
    );
  });

  it('returns 400 when the name is too short', async () => {
    const res = await request(app)
      .patch('/users/me')
      .set('Cookie', authCookie)
      .send({ name: 'A' });

    expect(res.status).toBe(400);
    expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
  });
});

describe('PATCH /users/me (avatar upload)', () => {
  it('uploads an avatar and saves the url', async () => {
    const updated = {
      _id: userId,
      name: 'Ada',
      avatar: 'https://cdn.example/avatar.png',
    };
    saveFileToCloudinary.mockResolvedValue(updated.avatar);
    User.findByIdAndUpdate.mockResolvedValue(updated);

    const res = await request(app)
      .patch('/users/me')
      .set('Cookie', authCookie)
      .attach('avatar', png, { filename: 'avatar.png', contentType: 'image/png' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(updated);
    expect(saveFileToCloudinary).toHaveBeenCalledWith(expect.any(Object), 'avatars');
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      userId,
      { avatar: updated.avatar },
      { new: true, runValidators: true },
    );
  });

  it('returns 200 when updating both name and avatar', async () => {
    const updated = {
      _id: userId,
      name: 'New Name',
      avatar: 'https://cdn.example/avatar.png',
    };
    saveFileToCloudinary.mockResolvedValue(updated.avatar);
    User.findByIdAndUpdate.mockResolvedValue(updated);

    const res = await request(app)
      .patch('/users/me')
      .set('Cookie', authCookie)
      .field('name', 'New Name')
      .attach('avatar', png, { filename: 'avatar.png', contentType: 'image/png' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(updated);
    expect(saveFileToCloudinary).toHaveBeenCalledWith(expect.any(Object), 'avatars');
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      userId,
      { name: 'New Name', avatar: updated.avatar },
      { new: true, runValidators: true },
    );
  });

  it('returns 400 for a non-image file', async () => {
    const res = await request(app)
      .patch('/users/me')
      .set('Cookie', authCookie)
      .attach('avatar', Buffer.from('hello'), {
        filename: 'notes.txt',
        contentType: 'text/plain',
      });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: 'Only jpg and png images are allowed' });
    expect(saveFileToCloudinary).not.toHaveBeenCalled();
  });
});
