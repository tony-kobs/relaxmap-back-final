import { Joi, Segments } from 'celebrate';

const objectId = Joi.string().hex().length(24);

export const userIdSchema = {
  [Segments.PARAMS]: Joi.object({
    userId: objectId.required(),
  }),
};

export const userLocationsQuerySchema = {
  [Segments.PARAMS]: Joi.object({
    userId: objectId.required(),
  }),
  [Segments.QUERY]: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
  }),
};
