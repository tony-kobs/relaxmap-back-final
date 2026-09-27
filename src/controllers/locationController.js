import { notImplemented } from '../utils/notImplemented.js';
import createError from 'http-errors';
import { Location } from '../models/location.js';

export const getLocations = notImplemented;

export const getLocationById = async (req, res, next) => {
  try {
    
    const { locationId } = req.params;

    const location = await Location.findById(locationId)
      .populate('type')
      .populate('region')
      .populate({
        path: 'owner',
        select: 'name email avatar',
      });

    if (!location) {
      throw createError(404, 'Місце відпочинку з таким ID не знайдено.');
    }

    res.status(200).json({
      success: true,
      data: location,
    });
  } catch (error) {
    next(error);
  }
};
export const createLocation = notImplemented;
export const updateLocation = notImplemented;
