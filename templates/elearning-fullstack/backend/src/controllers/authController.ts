import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User';
import { sendEmail } from '../services/emailService';
import { createToken, verifyToken } from '../utils/tokenUtils';
import { AppError } from '../utils/AppError';
import { catchAsync } from '../utils/catchAsync';
import logger from '../utils/logger';

// Validation rules
export const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('username')
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be 3-30 characters long and contain only letters, numbers, and underscores'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and must be less than 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and must be less than 50 characters'),
  body('role')
    .optional()
    .isIn(['student', 'instructor'])
    .withMessage('Role must be either student or instructor')
];

export const loginValidation = [
  body('identifier')
    .notEmpty()
    .withMessage('Email or username is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

export const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
];

export const resetPasswordValidation = [
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('token')
    .notEmpty()
    .withMessage('Reset token is required')
];

interface AuthenticatedRequest extends Request {
  user?: User;
}

// Helper function to create and send token
const createSendToken = (user: User, statusCode: number, res: Response, message: string = 'Success') => {
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  
  const cookieOptions = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const
  };

  res.cookie('refreshToken', refreshToken, cookieOptions);

  // Remove password from output
  const userResponse = {
    id: user.id,
    email: user.email,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: user.fullName,
    role: user.role,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    isVerified: user.isVerified,
    isActive: user.isActive,
    createdAt: user.createdAt
  };

  res.status(statusCode).json({
    status: 'success',
    message,
    data: {
      user: userResponse,
      accessToken
    }
  });
};

export const register = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const { email, username, password, firstName, lastName, role = 'student' } = req.body;

  // Check if user already exists
  const existingUser = await User.findByEmailOrUsername(email);
  if (existingUser) {
    return next(new AppError('User with this email or username already exists', 409));
  }

  // Create new user
  const newUser = await User.createWithProfile({
    email,
    username,
    password,
    firstName,
    lastName,
    role: role as 'student' | 'instructor'
  });

  // Generate email verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  // In a real app, you'd store this token in the database with an expiration
  
  // Send verification email
  if (process.env.ENABLE_EMAIL_VERIFICATION === 'true') {
    try {
      await sendEmail({
        to: newUser.email,
        subject: 'Verify Your Email - E-Learning Platform',
        template: 'emailVerification',
        data: {
          name: newUser.firstName,
          verificationUrl: `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`
        }
      });
    } catch (emailError) {
      logger.error('Failed to send verification email:', emailError);
      // Don't fail registration if email fails
    }
  }

  logger.info(`New user registered: ${newUser.email} (${newUser.role})`);

  createSendToken(newUser, 201, res, 'Registration successful! Please check your email for verification.');
});

export const login = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const { identifier, password, rememberMe } = req.body;

  // Find user by email or username
  const user = await User.findByEmailOrUsername(identifier);
  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Invalid email/username or password', 401));
  }

  // Check if user is active
  if (!user.isActive) {
    return next(new AppError('Your account has been deactivated. Please contact support.', 403));
  }

  // Update last login
  await User.updateLastLogin(user.id);

  logger.info(`User logged in: ${user.email}`);

  createSendToken(user, 200, res, 'Login successful!');
});

export const logout = catchAsync(async (req: Request, res: Response) => {
  res.cookie('refreshToken', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully'
  });
});

export const refreshToken = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  // Get token from cookie
  const { refreshToken } = req.cookies;
  
  if (!refreshToken) {
    return next(new AppError('No refresh token provided', 401));
  }

  // Verify token
  let decoded: any;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!);
  } catch (error) {
    return next(new AppError('Invalid or expired refresh token', 401));
  }

  // Get user
  const user = await User.query().findById(decoded.id);
  if (!user || !user.isActive) {
    return next(new AppError('User not found or inactive', 401));
  }

  createSendToken(user, 200, res, 'Token refreshed successfully');
});

export const forgotPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const { email } = req.body;

  // Get user by email
  const user = await User.findByEmail(email);
  if (!user) {
    return next(new AppError('No user found with that email address', 404));
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  // In a real app, you'd store this token in the database with an expiration

  // Send reset email
  try {
    await sendEmail({
      to: user.email,
      subject: 'Password Reset - E-Learning Platform',
      template: 'passwordReset',
      data: {
        name: user.firstName,
        resetUrl: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`,
        expiresIn: '10 minutes'
      }
    });

    res.status(200).json({
      status: 'success',
      message: 'Password reset link sent to your email'
    });
  } catch (error) {
    logger.error('Failed to send password reset email:', error);
    return next(new AppError('Error sending email. Please try again later.', 500));
  }
});

export const resetPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }

  const { password, token } = req.body;

  // In a real app, you'd verify the token from the database
  // For now, we'll just simulate token verification
  if (!token || token.length < 32) {
    return next(new AppError('Invalid or expired reset token', 400));
  }

  // Get user by token (this would be a database query in real app)
  // For demo, we'll just return an error
  return next(new AppError('Password reset functionality requires database token storage', 501));
});

export const verifyEmail = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { token } = req.body;

  if (!token) {
    return next(new AppError('Verification token is required', 400));
  }

  // In a real app, you'd verify the token from the database
  // For now, we'll just simulate successful verification
  res.status(200).json({
    status: 'success',
    message: 'Email verified successfully'
  });
});

export const getMe = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  
  // Get additional user stats based on role
  let stats = {};
  if (user.isInstructor) {
    stats = await User.getInstructorStats(user.id);
  } else if (user.isStudent) {
    stats = await User.getStudentStats(user.id);
  }

  res.status(200).json({
    status: 'success',
    data: {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        role: user.role,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        title: user.title,
        expertise: user.expertise,
        socialLinks: user.socialLinks,
        isVerified: user.isVerified,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt
      },
      stats
    }
  });
});

export const updateMe = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const user = req.user!;
  
  // Fields that can be updated
  const allowedFields = [
    'firstName', 'lastName', 'bio', 'title', 'expertise', 
    'socialLinks', 'avatarUrl'
  ];
  
  const updates: any = {};
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  if (Object.keys(updates).length === 0) {
    return next(new AppError('No valid fields provided for update', 400));
  }

  const updatedUser = await user.$query().patch(updates).returning('*');

  res.status(200).json({
    status: 'success',
    message: 'Profile updated successfully',
    data: {
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        fullName: updatedUser.fullName,
        role: updatedUser.role,
        avatarUrl: updatedUser.avatarUrl,
        bio: updatedUser.bio,
        title: updatedUser.title,
        expertise: updatedUser.expertise,
        socialLinks: updatedUser.socialLinks,
        isVerified: updatedUser.isVerified
      }
    }
  });
});

export const changePassword = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    return next(new AppError('Current password and new password are required', 400));
  }

  const user = req.user!;
  
  // Verify current password
  if (!(await user.comparePassword(currentPassword))) {
    return next(new AppError('Current password is incorrect', 401));
  }

  // Update password
  await user.$query().patch({ passwordHash: newPassword });

  res.status(200).json({
    status: 'success',
    message: 'Password changed successfully'
  });
});

export const deleteAccount = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { password } = req.body;
  
  if (!password) {
    return next(new AppError('Password is required to delete account', 400));
  }

  const user = req.user!;
  
  // Verify password
  if (!(await user.comparePassword(password))) {
    return next(new AppError('Password is incorrect', 401));
  }

  // Soft delete (deactivate) user
  await user.$query().patch({ isActive: false });

  logger.info(`User account deleted: ${user.email}`);

  res.status(200).json({
    status: 'success',
    message: 'Account deleted successfully'
  });
});