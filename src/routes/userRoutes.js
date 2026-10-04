import { Router } from 'express';
import { celebrate } from 'celebrate';
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

router.get('/users/me', authenticate, getCurrentUser);
// PATCH /users/me — приватний, приймає multipart/form-data: name (text) + avatar (file)
router.patch(
  '/users/me',
  authenticate,
  upload.single('avatar'),
  celebrate(updateMeSchema),
  updateCurrentUser,
);
router.get('/users/:userId/locations', celebrate(userLocationsQuerySchema), getUserLocations);
router.get('/users/:userId', celebrate(userIdSchema), getUserById);

export default router;
