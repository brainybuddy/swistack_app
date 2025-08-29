// Authentication constants and configuration

export const AUTH_CONSTANTS = {
  // Token lifetimes (in seconds)
  ACCESS_TOKEN_LIFETIME: 60 * 60, // 1 hour
  REFRESH_TOKEN_LIFETIME: 30 * 24 * 60 * 60, // 30 days
  EMAIL_VERIFICATION_TOKEN_LIFETIME: 24 * 60 * 60, // 24 hours
  PASSWORD_RESET_TOKEN_LIFETIME: 60 * 60, // 1 hour
  
  // Token refresh timing
  REFRESH_THRESHOLD_MINUTES: 5, // Refresh when 5 minutes remain
  REFRESH_THRESHOLD_PERCENTAGE: 0.2, // Or when 20% of lifetime remains
  
  // Rate limiting
  LOGIN_ATTEMPTS_MAX: 5,
  LOGIN_ATTEMPTS_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  PASSWORD_RESET_ATTEMPTS_MAX: 3,
  PASSWORD_RESET_ATTEMPTS_WINDOW_MS: 60 * 60 * 1000, // 1 hour
  EMAIL_VERIFICATION_ATTEMPTS_MAX: 5,
  EMAIL_VERIFICATION_ATTEMPTS_WINDOW_MS: 60 * 60 * 1000, // 1 hour
  
  // Password requirements
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  PASSWORD_REQUIRE_UPPERCASE: true,
  PASSWORD_REQUIRE_LOWERCASE: true,
  PASSWORD_REQUIRE_NUMBERS: true,
  PASSWORD_REQUIRE_SPECIAL_CHARS: false,
  
  // Username requirements
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 30,
  USERNAME_ALLOWED_CHARS: /^[a-zA-Z0-9_-]+$/,
  
  // Session management
  SESSION_TIMEOUT_MS: 24 * 60 * 60 * 1000, // 24 hours
  IDLE_TIMEOUT_MS: 2 * 60 * 60 * 1000, // 2 hours
  
  // Token storage keys
  STORAGE_KEYS: {
    ACCESS_TOKEN: 'swistack_token',
    REFRESH_TOKEN: 'swistack_refresh_token',
    USER: 'swistack_user',
    SESSION_ID: 'swistack_session_id',
    LAST_ACTIVITY: 'swistack_last_activity',
    RATE_LIMIT_LOGIN: 'swistack_rate_limit_login',
    RATE_LIMIT_RESET: 'swistack_rate_limit_reset',
  },
  
  // HTTP status codes
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
  },
  
  // Auth error codes
  ERROR_CODES: {
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
    ACCOUNT_DISABLED: 'ACCOUNT_DISABLED',
    EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    TOKEN_INVALID: 'TOKEN_INVALID',
    PERMISSION_DENIED: 'PERMISSION_DENIED',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    PASSWORD_TOO_WEAK: 'PASSWORD_TOO_WEAK',
    USERNAME_TAKEN: 'USERNAME_TAKEN',
    EMAIL_TAKEN: 'EMAIL_TAKEN',
    USER_NOT_FOUND: 'USER_NOT_FOUND',
    INVALID_TOKEN_FORMAT: 'INVALID_TOKEN_FORMAT',
    REFRESH_TOKEN_EXPIRED: 'REFRESH_TOKEN_EXPIRED',
    SESSION_EXPIRED: 'SESSION_EXPIRED',
  },
  
  // User roles hierarchy (higher number = more permissions)
  ROLE_HIERARCHY: {
    viewer: 1,
    user: 2,
    moderator: 3,
    admin: 4,
  },
  
  // Default permissions by role
  ROLE_PERMISSIONS: {
    viewer: ['read'],
    user: ['read', 'write'],
    moderator: ['read', 'write', 'moderate'],
    admin: ['read', 'write', 'delete', 'moderate', 'admin'],
  },
  
  // Cookie settings
  COOKIE_SETTINGS: {
    SECURE: true, // Set to false for development
    HTTP_ONLY: true,
    SAME_SITE: 'strict' as const,
    MAX_AGE: 30 * 24 * 60 * 60 * 1000, // 30 days
  },
  
  // CORS settings
  CORS_ORIGINS: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://swistack.com',
    'https://app.swistack.com',
  ],
  
  // Email settings
  EMAIL_SETTINGS: {
    VERIFICATION_SUBJECT: 'Verify Your Email - Swistack',
    PASSWORD_RESET_SUBJECT: 'Reset Your Password - Swistack',
    WELCOME_SUBJECT: 'Welcome to Swistack - Your Coding Journey Begins!',
    FROM_NAME: 'Swistack',
    FROM_EMAIL: 'noreply@swistack.com',
  },
} as const;

// Auth event types
export const AUTH_EVENTS = {
  LOGIN: 'auth:login',
  LOGOUT: 'auth:logout',
  REGISTER: 'auth:register',
  TOKEN_REFRESH: 'auth:token_refresh',
  TOKEN_EXPIRED: 'auth:token_expired',
  PERMISSION_DENIED: 'auth:permission_denied',
  SESSION_TIMEOUT: 'auth:session_timeout',
  ACCOUNT_LOCKED: 'auth:account_locked',
  PASSWORD_CHANGED: 'auth:password_changed',
  EMAIL_VERIFIED: 'auth:email_verified',
} as const;

// Validation messages
export const AUTH_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  REGISTER_SUCCESS: 'Registration successful',
  PASSWORD_CHANGED: 'Password changed successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
  EMAIL_VERIFIED: 'Email verified successfully',
  VERIFICATION_SENT: 'Verification email sent successfully',
  RESET_EMAIL_SENT: 'Password reset email sent if account exists',
  PASSWORD_RESET: 'Password reset successfully',
  
  // Error messages
  INVALID_CREDENTIALS: 'Invalid email or password',
  ACCOUNT_LOCKED: 'Account is temporarily locked due to too many failed attempts',
  ACCOUNT_DISABLED: 'Your account has been disabled. Please contact support.',
  EMAIL_NOT_VERIFIED: 'Please verify your email address before continuing',
  TOKEN_EXPIRED: 'Your session has expired. Please log in again.',
  TOKEN_INVALID: 'Invalid or malformed authentication token',
  PERMISSION_DENIED: 'You do not have permission to perform this action',
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please try again later.',
  PASSWORD_TOO_WEAK: 'Password does not meet security requirements',
  USERNAME_TAKEN: 'Username is already taken',
  EMAIL_TAKEN: 'Email address is already registered',
  USER_NOT_FOUND: 'User account not found',
  SESSION_EXPIRED: 'Your session has expired due to inactivity',
  
  // Validation messages
  EMAIL_REQUIRED: 'Email address is required',
  EMAIL_INVALID: 'Please enter a valid email address',
  PASSWORD_REQUIRED: 'Password is required',
  PASSWORD_TOO_SHORT: `Password must be at least ${AUTH_CONSTANTS.PASSWORD_MIN_LENGTH} characters`,
  PASSWORD_TOO_LONG: `Password cannot exceed ${AUTH_CONSTANTS.PASSWORD_MAX_LENGTH} characters`,
  PASSWORD_REQUIREMENTS: 'Password must contain uppercase, lowercase, and number',
  PASSWORDS_DONT_MATCH: "Passwords don't match",
  USERNAME_REQUIRED: 'Username is required',
  USERNAME_TOO_SHORT: `Username must be at least ${AUTH_CONSTANTS.USERNAME_MIN_LENGTH} characters`,
  USERNAME_TOO_LONG: `Username cannot exceed ${AUTH_CONSTANTS.USERNAME_MAX_LENGTH} characters`,
  USERNAME_INVALID_CHARS: 'Username can only contain letters, numbers, underscores, and hyphens',
  FIRST_NAME_REQUIRED: 'First name is required',
  LAST_NAME_REQUIRED: 'Last name is required',
  CURRENT_PASSWORD_REQUIRED: 'Current password is required',
  NEW_PASSWORD_REQUIRED: 'New password is required',
  CONFIRM_PASSWORD_REQUIRED: 'Password confirmation is required',
  TOKEN_REQUIRED: 'Authentication token is required',
  RESET_TOKEN_REQUIRED: 'Reset token is required',
  VERIFICATION_TOKEN_REQUIRED: 'Verification token is required',
} as const;

// Regex patterns
export const AUTH_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_STRONG: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  PASSWORD_MEDIUM: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]/,
  USERNAME: /^[a-zA-Z0-9_-]+$/,
  JWT_TOKEN: /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/,
} as const;

// Helper function to get error message by code
export function getAuthErrorMessage(errorCode: keyof typeof AUTH_CONSTANTS.ERROR_CODES): string {
  const messageKey = errorCode as keyof typeof AUTH_MESSAGES;
  return AUTH_MESSAGES[messageKey] || 'An authentication error occurred';
}

// Helper function to check if environment is development
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

// Helper function to get appropriate CORS origins
export function getCorsOrigins(): string[] {
  if (isDevelopment()) {
    return [...AUTH_CONSTANTS.CORS_ORIGINS, 'http://localhost:3000', 'http://localhost:3001'];
  }
  return AUTH_CONSTANTS.CORS_ORIGINS.filter(origin => !origin.includes('localhost'));
}