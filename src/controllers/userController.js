import createHttpError from 'http-errors';
import { User } from '../models/user.js';
import { Location } from '../models/location.js';



export const getUserById = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId).select('_id name avatar');
    
    if (!user) {
      throw createHttpError(404, 'User not found');
    }

    res.status(200).json({
      status: 200,
      message: 'Successfully found user',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};


export const getUserLocations = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    const locations = await Location.find({ owner: userId });

    res.status(200).json({
      status: 200,
      message: 'Successfully found user locations',
      data: locations,
    });
  } catch (error) {
    next(error);
  }
};


export const getCurrentUser = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.user?.id || req.userId;
    
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      throw createHttpError(404, 'User not found');
    }

    res.status(200).json({
      status: 200,
      message: 'Successfully found current user',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
export const updateCurrentUser = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.user?.id || req.userId;

    const updatedUser = await User.findByIdAndUpdate(userId, req.body, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!updatedUser) {
      throw createHttpError(404, 'User not found');
    }

    res.status(200).json({
      status: 200,
      message: 'Successfully updated user',
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};
export const updateUserAvatar = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.user?.id || req.userId;

   
    if (!req.file) {
      throw createHttpError(400, 'Avatar file is required');
    }

    
    const avatarUrl = req.file.path || req.file.filename;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { avatar: avatarUrl },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      throw createHttpError(404, 'User not found');
    }

    res.status(200).json({
      status: 200,
      message: 'Updated user with avatar url',
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};