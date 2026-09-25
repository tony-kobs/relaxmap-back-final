import { Location } from '../models/location.js';
import { notImplemented } from '../utils/notImplemented.js';

export const getLocations = notImplemented;
export const getLocationById = notImplemented;
export const createLocation = async (req, res) => {
  const location = await Location.create(req.body);

  res.status(201).json(location);
};
export const updateLocation = notImplemented;
