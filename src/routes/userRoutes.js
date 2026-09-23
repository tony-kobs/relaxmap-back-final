import { Router } from 'express';
import { celebrate } from 'celebrate';
import { authenticate } from '../middleware/authenticate.js';
import { upload } from '../middleware/multer.js';
import {
  getCurrentUser,
  updateCurrentUser,
  updateUserAvatar,
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
router.patch(
  '/users/me',
  authenticate,
  celebrate(updateMeSchema),
  updateCurrentUser,
);
router.patch(
  '/users/me/avatar',
  authenticate,
  upload.single('avatar'),
  updateUserAvatar,
);
router.get('/users/:userId/locations', celebrate(userLocationsQuerySchema), getUserLocations);
router.get('/users/:userId', celebrate(userIdSchema), getUserById);

export default router;
