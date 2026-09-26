import createHttpError from 'http-errors';
import { User } from '../models/user.js';
import { Location } from '../models/location.js';
import { notImplemented } from '../utils/notImplemented.js';


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


export const getCurrentUser = notImplemented;
export const updateCurrentUser = notImplemented;
export const updateUserAvatar = notImplemented;