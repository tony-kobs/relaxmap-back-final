import multer from 'multer';

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024,
  },
});

const imageFileFilter = (req, file, callback) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    callback(null, true);
    return;
  }

  callback(new Error('Only jpg and png images are allowed'));
};

export const uploadLocationImages = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024,
  },
  fileFilter: imageFileFilter,
});
