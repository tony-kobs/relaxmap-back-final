import { Router } from 'express';
import { celebrate } from 'celebrate';
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

router.get('/', celebrate(locationQuerySchema), getLocations);
router.get('/:locationId', celebrate(locationIdSchema), getLocationById);
router.post(
  '/',
  authenticate,
  upload.array('images', 8),
  celebrate(createLocationSchema),
  createLocation,
);
router.patch(
  '/:locationId',
  authenticate,
  upload.array('images', 8),
  celebrate(locationIdSchema),
  celebrate(createLocationSchema),
  updateLocation,
);

export default router;
