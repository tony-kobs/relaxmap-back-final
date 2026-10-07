import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import { upload } from '../middleware/multer.js';
import {
  getLocations,
  getLocationById,
  createLocation,
  updateLocation,
} from '../controllers/locationController.js';
import {
  locationQuerySchema,
  locationIdSchema,
  createLocationSchema,
} from '../validations/locationValidation.js';

const router = Router();

router.get('/', validate(locationQuerySchema), getLocations);
router.get('/:locationId', validate(locationIdSchema), getLocationById);
router.post(
  '/',
  authenticate,
  upload.array('images', 8),
  validate(createLocationSchema),
  createLocation,
);
router.patch(
  '/:locationId',
  authenticate,
  upload.array('images', 8),
  validate(locationIdSchema),
  validate(createLocationSchema),
  updateLocation,
);

export default router;
