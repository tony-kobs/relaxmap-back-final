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

router.get('/me', authenticate, getCurrentUser);
// PATCH /users/me — multipart/form-data: name (text) + avatar (file)
router.patch(
  '/me',
  authenticate,
  upload.single('avatar'),
  celebrate(updateMeSchema),
  updateCurrentUser,
);
router.get('/:userId/locations', celebrate(userLocationsQuerySchema), getUserLocations);
router.get('/:userId', celebrate(userIdSchema), getUserById);

export default router;
