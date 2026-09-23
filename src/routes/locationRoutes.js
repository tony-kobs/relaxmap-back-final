import { Router } from 'express';
import { celebrate } from 'celebrate';
import { authenticate } from '../middleware/authenticate.js';
import { uploadLocationImages } from '../middleware/multer.js';
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

router.get('/locations', celebrate(locationQuerySchema), getLocations);
router.get('/locations/:locationId', celebrate(locationIdSchema), getLocationById);
router.post(
  '/locations',
  authenticate,
  uploadLocationImages.array('images', 8),
  celebrate(createLocationSchema),
  createLocation,
);
router.patch(
  '/locations/:locationId',
  authenticate,
  uploadLocationImages.array('images', 8),
  celebrate(locationIdSchema),
  celebrate(createLocationSchema),
  updateLocation,
);

export default router;
