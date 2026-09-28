import createHttpError from 'http-errors';
import { User } from '../models/user.js';
import { notImplemented } from '../utils/notImplemented.js';

export const getCurrentUser = async (req, res) => {
  res.status(200).json(req.user);
};
export const updateCurrentUser = notImplemented;
export const updateUserAvatar = notImplemented;
export const getUserById = async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId).select('_id name avatar');

  if (!user) {
    throw createHttpError(404, 'User not found');
  }

  res.status(200).json(user);
};
export const getUserLocations = notImplemented;
