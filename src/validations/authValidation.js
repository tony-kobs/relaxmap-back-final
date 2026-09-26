import { Joi, Segments } from 'celebrate';

export const registerUserSchema = {
  [Segments.BODY]: Joi.object({
    name: Joi.string().trim().min(2).max(32).required(),
    email: Joi.string().trim().lowercase().email().max(64).required(),
    password: Joi.string().min(8).max(128).required(),
  }),
};

export const loginUserSchema = {
  [Segments.BODY]: Joi.object({}),
};

export const requestResetEmailSchema = {
  [Segments.BODY]: Joi.object({}),
};

export const resetPasswordSchema = {
  [Segments.BODY]: Joi.object({}),
};
