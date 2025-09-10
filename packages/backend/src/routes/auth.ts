import { Router, Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { UserModel } from '../models/User';
import { EmailService } from '../services/EmailService';
import { OAuthService } from '../services/OAuthService';
import { authenticateToken, authRateLimit } from '../middleware/auth';
import passport from 'passport';
import multer from 'multer';
import { 
  loginSchema, 
  registerSchema,
  changePasswordSchema,
  LoginRequest,
  RegisterRequest,
  ChangePasswordRequest,
  HTTP_STATUS 
} from '@swistack/shared';
import crypto from 'crypto';

const router = Router();

// Configure multer for avatar uploads
const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Apply rate limiting to auth routes (temporarily disabled for testing)
// router.use(authRateLimit);

router.post('/register', async (req: Request, res: Response) => {
  try {
    const validatedData = registerSchema.parse(req.body) as RegisterRequest;

    const result = await AuthService.register(validatedData);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'User registered successfully',
      data: result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    
    if (message.includes('already exists') || message.includes('already taken')) {
      res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        error: message,
      });
    } else if (error && typeof error === 'object' && 'issues' in error) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Validation failed',
        details: (error as any).issues,
        message: (error as any).issues.map((issue: any) => `${issue.path.join('.')}: ${issue.message}`).join(', ')
      });
    } else {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: message,
      });
    }
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const validatedData = loginSchema.parse(req.body) as LoginRequest;

    const result = await AuthService.login(validatedData);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    
    if (message.includes('Invalid credentials') || message.includes('deactivated')) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: message,
      });
    } else if (error && typeof error === 'object' && 'issues' in error) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Validation failed',
        details: (error as any).issues,
        message: (error as any).issues.map((issue: any) => `${issue.path.join('.')}: ${issue.message}`).join(', ')
      });
    } else {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: message,
      });
    }
  }
});

router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Refresh token is required',
      });
      return;
    }

    const tokens = await AuthService.refreshTokens(refreshToken);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Tokens refreshed successfully',
      data: { tokens },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Token refresh failed';
    res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      error: message,
    });
  }
});

router.post('/verify', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'Invalid token',
      });
      return;
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Token is valid',
      data: {
        user: UserModel.toPublicUser(req.user),
        valid: true,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Token verification failed';
    res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      error: message,
    });
  }
});

router.post('/logout', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Refresh token is required',
      });
      return;
    }

    await AuthService.logout(refreshToken);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Logout failed';
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: message,
    });
  }
});

router.get('/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: UserModel.toPublicUser(req.user),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch profile';
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: message,
    });
  }
});

router.put('/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const { firstName, lastName, username } = req.body;

    // Validate input
    if (!firstName || !lastName || !username) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'First name, last name, and username are required',
      });
      return;
    }

    // Check if username is already taken by another user
    if (username !== req.user.username) {
      const existingUser = await UserModel.findByUsername(username);
      if (existingUser && existingUser.id !== req.user.id) {
        res.status(HTTP_STATUS.CONFLICT).json({
          success: false,
          error: 'Username is already taken',
        });
        return;
      }
    }

    // Update user profile
    await UserModel.updateProfile(req.user.id, {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      username: username.trim().toLowerCase(),
    });

    // Get updated user
    const updatedUser = await UserModel.findById(req.user.id);
    if (!updatedUser) {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to retrieve updated user',
      });
      return;
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Profile updated successfully',
      data: UserModel.toPublicUser(updatedUser),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update profile';
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: message,
    });
  }
});

// Avatar upload endpoint
router.post('/profile/avatar', authenticateToken, avatarUpload.single('photo'), async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    if (!req.file) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'No file uploaded',
      });
      return;
    }

    // Convert image to base64 for database storage
    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    // Update user avatar in database
    await UserModel.updateById(req.user.id, {
      avatar: base64Image,
    });

    // Get updated user
    const updatedUser = await UserModel.findById(req.user.id);
    if (!updatedUser) {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to retrieve updated user',
      });
      return;
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Avatar updated successfully',
      data: {
        user: UserModel.toPublicUser(updatedUser),
        avatar: base64Image,
      },
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: 'File size too large (max 5MB)',
        });
      } else {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: `Upload error: ${error.message}`,
        });
      }
    } else {
      const message = error instanceof Error ? error.message : 'Avatar upload failed';
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: message,
      });
    }
  }
});

router.post('/change-password', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const validatedData = changePasswordSchema.parse(req.body) as ChangePasswordRequest;

    // Verify current password
    const isValidPassword = await UserModel.verifyPassword(req.user, validatedData.currentPassword);
    
    if (!isValidPassword) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'Current password is incorrect',
      });
      return;
    }

    // Update password
    await UserModel.updatePassword(req.user.id, validatedData.newPassword);

    // Revoke all refresh tokens to force re-login
    await AuthService.logoutAll(req.user.id);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Password changed successfully. Please log in again.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Password change failed';
    
    if (error instanceof Error && error.name === 'ZodError') {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Validation failed',
        details: error.message,
      });
    } else {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: message,
      });
    }
  }
});

// Password reset request
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Email is required',
      });
      return;
    }

    const user = await UserModel.findByEmail(email);
    
    // Always return success for security (don't reveal if email exists)
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'If an account with that email exists, we have sent a password reset link.',
    });

    // Only send email if user exists
    if (user) {
      const resetToken = EmailService.generateVerificationToken();
      const resetExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await UserModel.updateById(user.id, {
        passwordResetToken: resetToken,
        passwordResetExpiresAt: resetExpiresAt,
      });

      try {
        await EmailService.sendPasswordReset(email, resetToken);
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
        // Don't fail the request if email fails
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Password reset request failed';
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: message,
    });
  }
});

// Reset password
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Token and password are required',
      });
      return;
    }

    if (password.length < 8) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Password must be at least 8 characters long',
      });
      return;
    }

    const user = await UserModel.findByPasswordResetToken(token);
    
    if (!user || !user.passwordResetExpiresAt || user.passwordResetExpiresAt < new Date()) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Invalid or expired reset token',
      });
      return;
    }

    // Update password and clear reset token
    await UserModel.updatePassword(user.id, password);
    await UserModel.updateById(user.id, {
      passwordResetToken: undefined,
      passwordResetExpiresAt: undefined,
    });

    // Revoke all refresh tokens to force re-login
    await AuthService.logoutAll(user.id);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Password reset successfully. Please log in with your new password.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Password reset failed';
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: message,
    });
  }
});

// Verify email
router.post('/verify-email', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Verification token is required',
      });
      return;
    }

    const user = await UserModel.findByEmailVerificationToken(token);
    
    if (!user) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Invalid verification token',
      });
      return;
    }

    if (user.emailVerifiedAt) {
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Email is already verified',
      });
      return;
    }

    // Mark email as verified
    await UserModel.updateById(user.id, {
      emailVerifiedAt: new Date(),
      emailVerificationToken: undefined,
    });

    try {
      await EmailService.sendWelcomeEmail(user.email, user.firstName);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the request if welcome email fails
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Email verified successfully!',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Email verification failed';
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: message,
    });
  }
});

// Resend email verification
router.post('/resend-verification', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Email is required',
      });
      return;
    }

    const user = await UserModel.findByEmail(email);
    
    if (!user) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    if (user.emailVerifiedAt) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Email is already verified',
      });
      return;
    }

    const verificationToken = EmailService.generateVerificationToken();
    
    await UserModel.updateById(user.id, {
      emailVerificationToken: verificationToken,
    });

    await EmailService.sendEmailVerification(email, verificationToken);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Verification email sent successfully',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to resend verification email';
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: message,
    });
  }
});

// OAuth Routes

// Google OAuth
router.get('/google', (req: Request, res: Response) => {
  const authUrl = OAuthService.getGoogleAuthUrl();
  res.redirect(authUrl);
});

router.get('/google/callback', 
  passport.authenticate('google', { session: false }),
  (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      console.log('Google OAuth callback - user object:', JSON.stringify(user, null, 2));
      
      if (!user || !user.tokens) {
        throw new Error('No user or tokens received from OAuth');
      }
      
      // Redirect to frontend with tokens in URL params
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      console.log('Frontend URL:', frontendUrl);
      
      try {
        const redirectUrl = new URL('/auth/callback', frontendUrl);
        if (redirectUrl && redirectUrl.searchParams) {
          redirectUrl.searchParams.set('token', user.tokens.accessToken);
          redirectUrl.searchParams.set('refreshToken', user.tokens.refreshToken);
          redirectUrl.searchParams.set('provider', 'google');
        }
        
        console.log('Redirecting to:', redirectUrl.toString());
        res.redirect(redirectUrl.toString());
      } catch (urlError) {
        console.error('URL construction error:', urlError);
        throw urlError;
      }
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      try {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const errorUrl = new URL('/auth/error', frontendUrl);
        if (errorUrl && errorUrl.searchParams) {
          errorUrl.searchParams.set('error', 'OAuth login failed');
        }
        res.redirect(errorUrl.toString());
      } catch (fallbackError) {
        console.error('Fallback redirect error:', fallbackError);
        res.status(500).json({ error: 'OAuth login failed' });
      }
    }
  }
);

// GitHub OAuth
router.get('/github', (req: Request, res: Response) => {
  const authUrl = OAuthService.getGitHubAuthUrl();
  res.redirect(authUrl);
});

router.get('/github/callback',
  passport.authenticate('github', { session: false }),
  (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      
      if (!user || !user.tokens) {
        throw new Error('No user or tokens received from OAuth');
      }
      
      // Redirect to frontend with tokens in URL params
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      console.log('Frontend URL:', frontendUrl);
      
      try {
        const redirectUrl = new URL('/auth/callback', frontendUrl);
        if (redirectUrl && redirectUrl.searchParams) {
          redirectUrl.searchParams.set('token', user.tokens.accessToken);
          redirectUrl.searchParams.set('refreshToken', user.tokens.refreshToken);
          redirectUrl.searchParams.set('provider', 'github');
        }
        
        res.redirect(redirectUrl.toString());
      } catch (urlError) {
        console.error('URL construction error:', urlError);
        throw urlError;
      }
    } catch (error) {
      console.error('GitHub OAuth callback error:', error);
      try {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const errorUrl = new URL('/auth/error', frontendUrl);
        if (errorUrl && errorUrl.searchParams) {
          errorUrl.searchParams.set('error', 'OAuth login failed');
        }
        res.redirect(errorUrl.toString());
      } catch (fallbackError) {
        console.error('Fallback redirect error:', fallbackError);
        res.status(500).json({ error: 'OAuth login failed' });
      }
    }
  }
);

export { router as authRouter };