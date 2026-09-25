import { notImplemented } from '../utils/notImplemented.js';

export const getCurrentUser = async (req, res) => {
  res.status(200).json(req.user);
};
export const updateCurrentUser = notImplemented;
export const updateUserAvatar = notImplemented;
export const getUserById = notImplemented;
export const getUserLocations = notImplemented;
