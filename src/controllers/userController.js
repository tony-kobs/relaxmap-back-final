// src/controllers/userController.js
import createHttpError from 'http-errors';
import { notImplemented } from '../utils/notImplemented.js';
import { User } from '../models/user.js';
import { Location } from '../models/location.js';

export const getCurrentUser = async (req, res) => {
  res.status(200).json(req.user);
};
export const updateCurrentUser = notImplemented;
export const updateUserAvatar = notImplemented;
export const getUserById = notImplemented;

export const getUserLocations = async (req, res) => {
  const { userId } = req.params;
  const { page, limit } = req.query;

  const userExists = await User.exists({ _id: userId });
  if (!userExists) {
    throw createHttpError(404, 'User not found');
  }

  const filter = { owner: userId };
  const skip = (page - 1) * limit;

  const [total, data] = await Promise.all([
    Location.countDocuments(filter),
    Location.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('type', 'name')
      .populate('region', 'name'),
  ]);

  res.json({
    data,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
};
