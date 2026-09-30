import createHttpError from 'http-errors';
import { Location } from '../models/location.js';
import { saveFileToCloudinary } from '../utils/saveFileToCloudinary.js';

export const getLocations = async (req, res) => {
  const { page = 1, limit = 10, region, type, search, sort } = req.query;

  const filter = {};

  if (region) {
    filter.region = region;
  }

  if (type) {
    filter.type = { $in: Array.isArray(type) ? type : type.split(',') };
  }

  if (search) {
    filter.name = { $regex: search, $options: 'i' };
  }

  let sortOption = {};
  if (sort === 'popularity') {
    sortOption = { reviewsCount: -1 };
  } else if (sort === 'rating') {
    sortOption = { rating: -1 };
  } else if (sort === 'new') {
    sortOption = { createdAt: -1 };
  }

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const limitNumber = parseInt(limit, 10);

  const [data, total] = await Promise.all([
    Location.find(filter)
      .populate('type', 'name')
      .populate('region', 'name')
      .populate('owner', 'name avatar')
      .sort(sortOption)
      .skip(skip)
      .limit(limitNumber),
    Location.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limitNumber);

  res.status(200).json({
    data,
    page: parseInt(page, 10),
    limit: limitNumber,
    total,
    totalPages,
  });
};
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
export const updateLocation = async (req, res) => {
  const { locationId } = req.params;
  const { name, type, region, description } = req.body;

  const location = await Location.findById(locationId);

  if (!location) {
    throw createHttpError(404, 'Location not found');
  }

  if (location.owner.toString() !== req.user._id.toString()) {
    throw createHttpError(403, 'You are not allowed to update this location');
  }

  const updateData = { name, type, region, description };

  if (req.files?.length) {
    const images = await Promise.all(
      req.files.map((file) => saveFileToCloudinary(file, 'locations')),
    );
    updateData.images = images;
  }

  const updatedLocation = await Location.findByIdAndUpdate(
    locationId,
    updateData,
    { new: true, runValidators: true }
  ).populate('type', 'name')
   .populate('region', 'name')
   .populate('owner', 'name avatar');

  res.status(200).json(updatedLocation);
};
