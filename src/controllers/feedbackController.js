import { Feedback } from '../models/feedback.js';
import { notImplemented } from '../utils/notImplemented.js';
import '../models/location.js';
import '../models/category.js';

const FEEDBACK_CONFIG = {
  DEFAULT_STATUS: 'approved',
  SORT_ORDER: { createdAt: -1 },
  PARSE_INT_RADIX: 10,
};

export const getFeedbacks = async (req, res, next) => {
  try {
    const { locationId, page, limit } = req.query;

    const filter = { status: FEEDBACK_CONFIG.DEFAULT_STATUS };

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
  } catch (error) {
    next(error);
  }
};

export const createFeedback = notImplemented;
