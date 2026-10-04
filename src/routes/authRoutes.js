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
import {
  loginUserSchema,
  registerUserSchema,
  requestResetEmailSchema,
  resetPasswordSchema,
} from '../validations/authValidation.js';

const router = Router();

router.post('/register', celebrate(registerUserSchema), registerUser);
router.post('/login', celebrate(loginUserSchema), loginUser);
router.post('/logout', logoutUser);
router.post('/refresh', refreshUserSession);
router.get('/session', getSession);
router.post('/request-reset-email', celebrate(requestResetEmailSchema), requestResetEmail);
router.post('/reset-password', celebrate(resetPasswordSchema), resetPassword);

export default router;
