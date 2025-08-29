import { z } from 'zod';
import { AUTH_CONSTANTS, AUTH_MESSAGES, AUTH_PATTERNS } from '../constants/auth';

export const emailSchema = z
  .string()
  .min(1, AUTH_MESSAGES.EMAIL_REQUIRED)
  .email(AUTH_MESSAGES.EMAIL_INVALID)
  .regex(AUTH_PATTERNS.EMAIL, AUTH_MESSAGES.EMAIL_INVALID);

export const passwordSchema = z
  .string()
  .min(1, AUTH_MESSAGES.PASSWORD_REQUIRED)
  .min(AUTH_CONSTANTS.PASSWORD_MIN_LENGTH, AUTH_MESSAGES.PASSWORD_TOO_SHORT)
  .max(AUTH_CONSTANTS.PASSWORD_MAX_LENGTH, AUTH_MESSAGES.PASSWORD_TOO_LONG)
  .regex(AUTH_PATTERNS.PASSWORD_MEDIUM, AUTH_MESSAGES.PASSWORD_REQUIREMENTS);

export const strongPasswordSchema = z
  .string()
  .min(1, AUTH_MESSAGES.PASSWORD_REQUIRED)
  .min(AUTH_CONSTANTS.PASSWORD_MIN_LENGTH, AUTH_MESSAGES.PASSWORD_TOO_SHORT)
  .max(AUTH_CONSTANTS.PASSWORD_MAX_LENGTH, AUTH_MESSAGES.PASSWORD_TOO_LONG)
  .regex(AUTH_PATTERNS.PASSWORD_STRONG, 'Password must contain uppercase, lowercase, number, and special character');

export const usernameSchema = z
  .string()
  .min(1, AUTH_MESSAGES.USERNAME_REQUIRED)
  .min(AUTH_CONSTANTS.USERNAME_MIN_LENGTH, AUTH_MESSAGES.USERNAME_TOO_SHORT)
  .max(AUTH_CONSTANTS.USERNAME_MAX_LENGTH, AUTH_MESSAGES.USERNAME_TOO_LONG)
  .regex(AUTH_CONSTANTS.USERNAME_ALLOWED_CHARS, AUTH_MESSAGES.USERNAME_INVALID_CHARS);

export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(50, 'Name cannot exceed 50 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes');

export const createUserSchema = z.object({
  email: emailSchema,
  username: usernameSchema,
  password: passwordSchema,
  firstName: nameSchema.refine(val => val.trim().length > 0, { message: AUTH_MESSAGES.FIRST_NAME_REQUIRED }),
  lastName: nameSchema.refine(val => val.trim().length > 0, { message: AUTH_MESSAGES.LAST_NAME_REQUIRED }),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, AUTH_MESSAGES.PASSWORD_REQUIRED),
});

export const registerSchema = z.object({
  email: emailSchema,
  username: usernameSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, AUTH_MESSAGES.CONFIRM_PASSWORD_REQUIRED),
  firstName: nameSchema.refine(val => val.trim().length > 0, { message: AUTH_MESSAGES.FIRST_NAME_REQUIRED }),
  lastName: nameSchema.refine(val => val.trim().length > 0, { message: AUTH_MESSAGES.LAST_NAME_REQUIRED }),
}).refine((data) => data.password === data.confirmPassword, {
  message: AUTH_MESSAGES.PASSWORDS_DONT_MATCH,
  path: ["confirmPassword"],
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, AUTH_MESSAGES.CURRENT_PASSWORD_REQUIRED),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, AUTH_MESSAGES.CONFIRM_PASSWORD_REQUIRED),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: AUTH_MESSAGES.PASSWORDS_DONT_MATCH,
  path: ["confirmPassword"],
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, AUTH_MESSAGES.RESET_TOKEN_REQUIRED),
  password: passwordSchema,
  confirmPassword: z.string().min(1, AUTH_MESSAGES.CONFIRM_PASSWORD_REQUIRED),
}).refine((data) => data.password === data.confirmPassword, {
  message: AUTH_MESSAGES.PASSWORDS_DONT_MATCH,
  path: ["confirmPassword"],
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  avatar: z.string().url().optional(),
});

export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
});

export function validateEmail(email: string): boolean {
  return emailSchema.safeParse(email).success;
}

export function validatePassword(password: string): boolean {
  return passwordSchema.safeParse(password).success;
}

export function validateUsername(username: string): boolean {
  return usernameSchema.safeParse(username).success;
}