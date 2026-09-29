import createHttpError from 'http-errors';
import { Location } from '../models/location.js';
import { saveFileToCloudinary } from '../utils/saveFileToCloudinary.js';

const LOCATION_SORT = {
  rating: { rating: -1, reviewsCount: -1, createdAt: -1 },
  popular: { reviewsCount: -1, rating: -1, createdAt: -1 },
  new: { createdAt: -1 },
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const withLocationCard = (query) =>
  query
    .populate('type', 'name')
    .populate('region', 'name')
    .populate('owner', 'name avatar');

export const getLocations = async (req, res) => {
  const { page, limit, region, type, search, sort } = req.query;
  const filter = {};

  if (region) {
    filter.region = region;
  }

  if (type?.length) {
    filter.type = { $in: type };
  }

  const nameQuery = typeof search === 'string' ? search.trim() : '';

  if (nameQuery) {
    filter.name = { $regex: escapeRegex(nameQuery), $options: 'i' };
  }

  const skip = (page - 1) * limit;

  const [total, data] = await Promise.all([
    Location.countDocuments(filter),
    withLocationCard(
      Location.find(filter)
        .sort(LOCATION_SORT[sort] ?? LOCATION_SORT.rating)
        .skip(skip)
        .limit(limit),
    ),
  ]);

  res.status(200).json({
    data,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
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
    throw createHttpError(403, 'Forbidden');
  }

  if (req.files?.length) {
    location.images = await Promise.all(
      req.files.map((file) => saveFileToCloudinary(file, 'locations')),
    );
  }

  location.name = name;
  location.type = type;
  location.region = region;
  location.description = description;

  await location.save();
  await location.populate([
    { path: 'type', select: 'name' },
    { path: 'region', select: 'name' },
    { path: 'owner', select: 'name avatar' },
  ]);

  res.status(200).json(location);
};
