import createHttpError from 'http-errors';
import { Feedback } from '../models/feedback.js';
import { Location } from '../models/location.js';
import '../models/category.js';

const FEEDBACK_CONFIG = {
  SORT_ORDER: { createdAt: -1 },
  PARSE_INT_RADIX: 10,
};

const recalculateLocationRating = async (locationId) => {
  const [stats] = await Feedback.aggregate([
    { $match: { locationId } },
    {
      $group: {
        _id: null,
        rating: { $avg: '$rate' },
        reviewsCount: { $sum: 1 },
      },
    },
  ]);

  const rating = stats ? Math.round(stats.rating * 10) / 10 : 0;
  const reviewsCount = stats?.reviewsCount ?? 0;

  await Location.findByIdAndUpdate(locationId, { rating, reviewsCount });
};

export const getFeedbacks = async (req, res) => {
  const { locationId, page, limit } = req.query;
  const filter = {};

  if (locationId) {
    filter.locationId = locationId;
  }

  const currentPage = parseInt(page, FEEDBACK_CONFIG.PARSE_INT_RADIX);
  const currentLimit = parseInt(limit, FEEDBACK_CONFIG.PARSE_INT_RADIX);
  const skip = (currentPage - 1) * currentLimit;

  const [feedbacks, total] = await Promise.all([
    Feedback.find(filter)
      .sort(FEEDBACK_CONFIG.SORT_ORDER)
      .skip(skip)
      .limit(currentLimit)
      .populate({
        path: 'locationId',
        select: 'name type',
        populate: { path: 'type', select: 'name kind' },
      })
      .populate('owner', 'name avatar'),
    Feedback.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / currentLimit);

  res.status(200).json({
    data: feedbacks,
    page: currentPage,
    limit: currentLimit,
    total,
    totalPages,
  });
};

export const createFeedback = async (req, res) => {
  const { locationId, userName, rate, description } = req.body;

  const location = await Location.findById(locationId);

  if (!location) {
    throw createHttpError(404, 'Location not found');
  }

  const feedback = await Feedback.create({
    locationId,
    owner: req.user._id,
    userName,
    rate,
    description,
  });

  await recalculateLocationRating(feedback.locationId);

  res.status(201).json(feedback);
};

export const deleteFeedback = async (req, res) => {
  const { feedbackId } = req.params;

  const feedback = await Feedback.findById(feedbackId);

  if (!feedback) {
    throw createHttpError(404, 'Feedback not found');
  }

  if (feedback.owner.toString() !== req.user._id.toString()) {
    throw createHttpError(403, 'Forbidden');
  }

  const locationId = feedback.locationId;
  await feedback.deleteOne();
  await recalculateLocationRating(locationId);

  res.status(204).end();
};
