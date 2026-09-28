import { Joi, Segments } from 'celebrate';

export const registerUserSchema = {
  [Segments.BODY]: Joi.object({
    name: Joi.string().trim().min(2).max(32).required(),
    email: Joi.string().trim().lowercase().email().max(64).required(),
    password: Joi.string().min(8).max(128).required(),
  }),
};

export const loginUserSchema = {
  [Segments.BODY]: Joi.object({
    email: Joi.string().trim().lowercase().email().required().messages({
      'string.base': 'Email має бути рядком',
      'string.email': 'Введіть коректний email',
      'string.empty': 'Email не може бути порожнім',
      'any.required': 'Email є обов\'язковим полем',
    }),
    password: Joi.string().required().messages({
      'string.base': 'Пароль має бути рядком',
      'string.empty': 'Пароль не може бути порожнім',
      'any.required': 'Пароль є обов\'язковим полем',
    }),
  }),
};

export const requestResetEmailSchema = {
  [Segments.BODY]: Joi.object({}),
};

export const resetPasswordSchema = {
  [Segments.BODY]: Joi.object({}),
};
