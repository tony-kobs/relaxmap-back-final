import { Joi, Segments } from 'celebrate';

const objectId = Joi.string().hex().length(24);

export const locationQuerySchema = {
  [Segments.QUERY]: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    region: objectId,
    type: Joi.array().items(objectId).single(),
    search: Joi.string().max(96).allow(''),
    sort: Joi.string().valid('popular', 'rating', 'new').default('rating'),
  }),
};

export const locationIdSchema = {
  [Segments.PARAMS]: Joi.object({
    locationId: objectId.required(),
  }),
};

export const createLocationSchema = {
  [Segments.BODY]: Joi.object({
    name: Joi.string().min(3).max(96).required(),
    type: objectId.required(),
    region: objectId.required(),
    description: Joi.string().min(20).max(6000).required(),
  }),
};
