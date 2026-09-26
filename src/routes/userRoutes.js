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

const router = Router();

router.get('/me', authenticate, getCurrentUser);
router.patch('/me', authenticate, updateCurrentUser);
router.patch(
  '/me/avatar',
  authenticate,
  upload.single('avatar'),
  updateUserAvatar,
);
router.get('/:userId/locations', celebrate(userLocationsQuerySchema), getUserLocations);
router.get('/:userId', celebrate(userIdSchema), getUserById);

export default router;