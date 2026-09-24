import { isCelebrateError } from 'celebrate';
import { HttpError } from 'http-errors';
import mongoose from 'mongoose';

const validationMessage = (err) => {
  for (const joiError of err.details.values()) {
    const detail = joiError.details[0];
    if (detail?.message) {
      return detail.message;
    }
  }

  return 'Validation failed';
};

export const errorHandler = (err, req, res, next) => {
  void next;

  if (isCelebrateError(err)) {
    return res.status(400).json({
      message: validationMessage(err),
    });
  }

  if (err instanceof HttpError) {
    return res.status(err.status).json({
      message: err.message || err.name,
    });
  }

  if (err.code === 11000) {
    const message = err.keyValue?.email
      ? 'Email already in use'
      : 'Duplicate key';

    return res.status(409).json({ message });
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const message = Object.values(err.errors)
      .map((item) => item.message)
      .join(', ');

    return res.status(400).json({ message });
  }

  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({
      message: 'Invalid id',
    });
  }

  const isProd = process.env.NODE_ENV === 'production';

  res.status(500).json({
    message: isProd
      ? 'Something went wrong. Please try again later.'
      : err.message,
  });
};