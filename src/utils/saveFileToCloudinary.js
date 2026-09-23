import { v2 as cloudinary } from 'cloudinary';
import createHttpError from 'http-errors';

const isCloudinaryConfigured = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );

export const saveFileToCloudinary = (file, folder = 'avatars') => {
  if (!isCloudinaryConfigured()) {
    throw createHttpError(500, 'Cloudinary is not configured');
  }

  if (!file) {
    throw createHttpError(400, 'File is required');
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error || !result) {
          reject(createHttpError(500, 'Failed to upload file'));
          return;
        }
        resolve(result.secure_url);
      },
    );

    uploadStream.end(file.buffer);
  });
};
