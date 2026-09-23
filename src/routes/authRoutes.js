import { Router } from 'express';
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshUserSession,
  getSession,
  requestResetEmail,
  resetPassword,
} from '../controllers/authController.js';

const router = Router();

router.post('/auth/register', registerUser);
router.post('/auth/login', loginUser);
router.post('/auth/logout', logoutUser);
router.post('/auth/refresh', refreshUserSession);
router.get('/auth/session', getSession);
router.post('/auth/request-reset-email', requestResetEmail);
router.post('/auth/reset-password', resetPassword);

export default router;
