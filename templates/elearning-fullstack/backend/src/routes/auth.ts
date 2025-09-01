import { Router } from 'express';
import {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  verifyEmail,
  getMe,
  updateMe,
  changePassword,
  deleteAccount,
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation
} from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/logout', logout);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPasswordValidation, forgotPassword);
router.post('/reset-password', resetPasswordValidation, resetPassword);
router.post('/verify-email', verifyEmail);

// Protected routes
router.use(authMiddleware); // Apply auth middleware to all routes below

router.get('/me', getMe);
router.patch('/me', updateMe);
router.patch('/change-password', changePassword);
router.delete('/delete-account', deleteAccount);

export default router;