import createHttpError from 'http-errors';
import { User } from '../models/user.js';
import { Location } from '../models/location.js';
import { saveFileToCloudinary } from '../utils/saveFileToCloudinary.js';

export const getCurrentUser = async (req, res) => {
  res.status(200).json(req.user);
};

export const updateCurrentUser = async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { name: req.body.name },
    { new: true, runValidators: true },
  );

  if (!user) {
    throw createHttpError(404, 'User not found');
  }

  res.status(200).json(user);
};

export const updateUserAvatar = async (req, res) => {
  if (!req.file) {
    throw createHttpError(400, 'Avatar file is required');
  }

  const avatar = await saveFileToCloudinary(req.file, 'avatars');
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { avatar },
    { new: true, runValidators: true },
  );

  if (!user) {
    throw createHttpError(404, 'User not found');
  }

  res.status(200).json(user);
};
export const getUserById = async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId).select('_id name avatar');

  if (!user) {
    throw createHttpError(404, 'User not found');
  }

  res.status(200).json(user);
};
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
      .populate('region', 'name')
      .populate('owner', 'name avatar'),
  ]);

  res.json({
    data,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
};
