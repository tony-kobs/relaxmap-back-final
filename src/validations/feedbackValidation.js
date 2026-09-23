import { Joi, Segments } from 'celebrate';

const objectId = Joi.string().hex().length(24);

export const feedbackQuerySchema = {
  [Segments.QUERY]: Joi.object({
    locationId: objectId,
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
  }),
};

export const createFeedbackSchema = {
  [Segments.BODY]: Joi.object({
    locationId: objectId.required(),
    userName: Joi.string().min(2).max(32).required(),
    rate: Joi.number().min(1).max(5).required(),
    description: Joi.string().min(1).max(200).required(),
  }),
};
