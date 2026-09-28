import createHttpError from 'http-errors';
import { Location } from '../models/location.js';
import { notImplemented } from '../utils/notImplemented.js';
import { saveFileToCloudinary } from '../utils/saveFileToCloudinary.js';

export const getLocations = notImplemented;
export const getLocationById = async (req, res) => {
  const { locationId } = req.params;

  const location = await Location.findById(locationId)
    .populate('type', 'name')
    .populate('region', 'name')
    .populate('owner', 'name avatar');

  if (!location) {
    throw createHttpError(404, 'Location not found');
  }

  res.status(200).json(location);
};
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
