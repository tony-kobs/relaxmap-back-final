import { Router } from 'express';
import { celebrate } from 'celebrate';
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshUserSession,
  getSession,
  requestResetEmail,
  resetPassword,
} from '../controllers/authController.js';
import { registerUserSchema } from '../validations/authValidation.js';

const router = Router();

router.post('/auth/register', celebrate(registerUserSchema), registerUser);
router.post('/auth/login', loginUser);
router.post('/auth/logout', logoutUser);
router.post('/auth/refresh', refreshUserSession);
router.get('/auth/session', getSession);
router.post('/auth/request-reset-email', requestResetEmail);
router.post('/auth/reset-password', resetPassword);

export default router;
