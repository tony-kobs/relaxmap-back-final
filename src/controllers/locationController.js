import createHttpError from 'http-errors';
import { Location } from '../models/location.js';
import { notImplemented } from '../utils/notImplemented.js';
import { saveFileToCloudinary } from '../utils/saveFileToCloudinary.js';

export const getLocations = notImplemented;
export const getLocationById = notImplemented;
export const createLocation = async (req, res) => {
  const { name, type, region, description } = req.body;

  if (!req.files?.length) {
    throw createHttpError(400, 'At least one image is required');
  }

  const images = await Promise.all(
    req.files.map((file) => saveFileToCloudinary(file, 'locations')),
  );
  const location = await Location.create({
    name,
    type,
    region,
    description,
    images,
    owner: req.user._id,
  });

  res.status(201).json(location);
};
export const updateLocation = notImplemented;
