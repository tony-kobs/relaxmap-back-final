import { isCelebrateError } from 'celebrate';
import { HttpError } from 'http-errors';
import mongoose from 'mongoose';
import multer from 'multer';
import { IMAGE_TYPE_ERROR } from './multer.js';

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

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'Image must be 1 MB or smaller' });
    }

    if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ message: 'No more than 8 images are allowed' });
    }

    return res.status(400).json({ message: err.message });
  }

  if (err?.message === IMAGE_TYPE_ERROR) {
    return res.status(400).json({ message: IMAGE_TYPE_ERROR });
  }

  const isProd = process.env.NODE_ENV === 'production';

  res.status(500).json({
    message: isProd
      ? 'Something went wrong. Please try again later.'
      : err.message,
  });
};