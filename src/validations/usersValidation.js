import { Joi, Segments } from 'celebrate';

export const updateMeSchema = {
  [Segments.BODY]: Joi.object({
    name: Joi.string().min(2).max(32),
  }).min(1),
};
