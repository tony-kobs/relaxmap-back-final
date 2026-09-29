import multer from 'multer';

const storage = multer.memoryStorage();

export const IMAGE_TYPE_ERROR = 'Only jpg and png images are allowed';

const imageFileFilter = (req, file, callback) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    callback(null, true);
    return;
  }

  callback(new Error(IMAGE_TYPE_ERROR));
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024,
  },
  fileFilter: imageFileFilter,
});

export const uploadLocationImages = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024,
  },
  fileFilter: imageFileFilter,
});
