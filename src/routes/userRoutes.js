import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import { upload } from '../middleware/multer.js';
import {
  getCurrentUser,
  updateCurrentUser,
  getUserById,
  getUserLocations,
} from '../controllers/userController.js';
import {
  userIdSchema,
  userLocationsQuerySchema,
} from '../validations/userPublicValidation.js';
import { updateMeSchema } from '../validations/usersValidation.js';

const router = Router();

router.get('/me', authenticate, getCurrentUser);
// PATCH /users/me — multipart/form-data: name (text) + avatar (file)
router.patch(
  '/me',
  authenticate,
  upload.single('avatar'),
  validate(updateMeSchema),
  updateCurrentUser,
);
router.get('/:userId/locations', validate(userLocationsQuerySchema), getUserLocations);
router.get('/:userId', validate(userIdSchema), getUserById);

export default router;
