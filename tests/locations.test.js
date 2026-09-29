import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';

vi.mock('../src/models/location.js', () => ({
  Location: {
    find: vi.fn(),
    countDocuments: vi.fn(),
    findById: vi.fn(),
  },
}));
vi.mock('../src/models/session.js', () => ({
  Session: { findOne: vi.fn() },
}));
vi.mock('../src/models/user.js', () => ({
  User: { findById: vi.fn() },
}));
vi.mock('../src/utils/saveFileToCloudinary.js', () => ({
  saveFileToCloudinary: vi.fn(),
}));

import { Location } from '../src/models/location.js';
import { Session } from '../src/models/session.js';
import { User } from '../src/models/user.js';
import { saveFileToCloudinary } from '../src/utils/saveFileToCloudinary.js';
import locationRoutes from '../src/routes/locationRoutes.js';
import { errorHandler } from '../src/middleware/errorHandler.js';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(locationRoutes);
app.use(errorHandler);

const userId = '665f1b2b2f4e0a1c3b5d7f91';
const otherUserId = '665f1b2b2f4e0a1c3b5d7f99';
const locationId = '665f1b2b2f4e0a1c3b5d7f93';
const regionId = '665f1b2b2f4e0a1c3b5d7f11';
const typeId = '665f1b2b2f4e0a1c3b5d7f22';
const typeId2 = '665f1b2b2f4e0a1c3b5d7f33';

const validSession = {
  _id: '665f1b2b2f4e0a1c3b5d7f92',
  userId,
  accessToken: 'valid-token',
  accessTokenValidUntil: new Date(Date.now() + 60 * 60 * 1000),
};

const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

const createQuery = (result) => {
  const query = {
    sort: vi.fn(() => query),
    skip: vi.fn(() => query),
    limit: vi.fn(() => query),
    populate: vi.fn(() => query),
    then(onFulfilled, onRejected) {
      return Promise.resolve(result).then(onFulfilled, onRejected);
    },
  };

  return query;
};

const locationFields = {
  name: 'Pine lake shore',
  type: typeId,
  region: regionId,
  description: 'A quiet shore with pines and a long wooden path.',
};

const authCookie = [
  `sessionId=${validSession._id}`,
  `accessToken=${validSession.accessToken}`,
];

const makeLocation = (owner = userId) => {
  const doc = {
    _id: locationId,
    owner,
    images: ['https://cdn.example/old.jpg'],
    ...locationFields,
  };
  doc.save = vi.fn(async () => doc);
  doc.populate = vi.fn(async () => doc);
  return doc;
};

beforeEach(() => {
  vi.clearAllMocks();
  Session.findOne.mockResolvedValue(validSession);
  User.findById.mockResolvedValue({ _id: userId, name: 'Relax Tester' });
});

describe('GET /locations', () => {
  it('filters, sorts and paginates location cards', async () => {
    const cards = [{ _id: locationId, name: 'Pine lake shore' }];
    const query = createQuery(cards);
    Location.find.mockReturnValue(query);
    Location.countDocuments.mockResolvedValue(11);

    const res = await request(app).get('/locations').query({
      page: 2,
      limit: 5,
      region: regionId,
      type: [typeId, typeId2],
      search: ' Lake+ ',
      sort: 'new',
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: cards,
      page: 2,
      limit: 5,
      total: 11,
      totalPages: 3,
    });
    expect(Location.find).toHaveBeenCalledWith({
      region: regionId,
      type: { $in: [typeId, typeId2] },
      name: { $regex: 'Lake\\+', $options: 'i' },
    });
    expect(query.sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(query.skip).toHaveBeenCalledWith(5);
    expect(query.limit).toHaveBeenCalledWith(5);
    expect(query.populate).toHaveBeenCalledWith('owner', 'name avatar');
  });

  it('sorts by rating by default', async () => {
    const query = createQuery([]);
    Location.find.mockReturnValue(query);
    Location.countDocuments.mockResolvedValue(0);

    const res = await request(app).get('/locations');

    expect(res.status).toBe(200);
    expect(res.body.totalPages).toBe(0);
    expect(query.sort).toHaveBeenCalledWith({
      rating: -1,
      reviewsCount: -1,
      createdAt: -1,
    });
  });

  it('sorts popular locations by review count', async () => {
    const query = createQuery([]);
    Location.find.mockReturnValue(query);
    Location.countDocuments.mockResolvedValue(0);

    const res = await request(app).get('/locations').query({ sort: 'popular' });

    expect(res.status).toBe(200);
    expect(query.sort).toHaveBeenCalledWith({
      reviewsCount: -1,
      rating: -1,
      createdAt: -1,
    });
  });

  it('returns 400 for an unknown sort', async () => {
    const res = await request(app).get('/locations').query({ sort: 'oldest' });

    expect(res.status).toBe(400);
    expect(Location.find).not.toHaveBeenCalled();
  });
});

describe('PATCH /locations/:locationId', () => {
  it('returns 401 without a session', async () => {
    const res = await request(app).patch(`/locations/${locationId}`).send(locationFields);

    expect(res.status).toBe(401);
    expect(Location.findById).not.toHaveBeenCalled();
  });

  it('returns 404 when the location does not exist', async () => {
    Location.findById.mockResolvedValue(null);

    const res = await request(app)
      .patch(`/locations/${locationId}`)
      .set('Cookie', authCookie)
      .field(locationFields);

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: 'Location not found' });
  });

  it('returns 403 when the user is not the owner', async () => {
    Location.findById.mockResolvedValue(makeLocation(otherUserId));

    const res = await request(app)
      .patch(`/locations/${locationId}`)
      .set('Cookie', authCookie)
      .field(locationFields)
      .attach('images', png, { filename: 'cover.png', contentType: 'image/png' });

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ message: 'Forbidden' });
    expect(saveFileToCloudinary).not.toHaveBeenCalled();
  });

  it('keeps the current images when no files are sent', async () => {
    const doc = makeLocation();
    Location.findById.mockResolvedValue(doc);

    const res = await request(app)
      .patch(`/locations/${locationId}`)
      .set('Cookie', authCookie)
      .field(locationFields);

    expect(res.status).toBe(200);
    expect(doc.images).toEqual(['https://cdn.example/old.jpg']);
    expect(doc.name).toBe(locationFields.name);
    expect(doc.save).toHaveBeenCalledTimes(1);
    expect(saveFileToCloudinary).not.toHaveBeenCalled();
  });

  it('replaces images when new files are sent', async () => {
    const doc = makeLocation();
    Location.findById.mockResolvedValue(doc);
    saveFileToCloudinary.mockResolvedValue('https://cdn.example/new.jpg');

    const res = await request(app)
      .patch(`/locations/${locationId}`)
      .set('Cookie', authCookie)
      .field(locationFields)
      .attach('images', png, { filename: 'cover.png', contentType: 'image/png' });

    expect(res.status).toBe(200);
    expect(saveFileToCloudinary).toHaveBeenCalledWith(expect.any(Object), 'locations');
    expect(doc.images).toEqual(['https://cdn.example/new.jpg']);
    expect(res.body.images).toEqual(['https://cdn.example/new.jpg']);
  });
});
