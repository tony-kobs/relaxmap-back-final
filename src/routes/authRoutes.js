import { Router } from 'express';
import { validate } from '../middleware/validate.js';
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

router.post('/register', validate(registerUserSchema), registerUser);
router.post('/login', validate(loginUserSchema), loginUser);
router.post('/logout', logoutUser);
router.post('/refresh', refreshUserSession);
router.get('/session', getSession);
router.post('/request-reset-email', validate(requestResetEmailSchema), requestResetEmail);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);

export default router;
