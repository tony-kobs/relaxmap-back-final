import { Joi, Segments } from 'celebrate';

export const updateMeSchema = {
  [Segments.BODY]: Joi.object({}),
};
