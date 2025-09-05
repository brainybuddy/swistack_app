export const getAuthConfig = () => {
  console.log('Auth config JWT_SECRET from env:', process.env.JWT_SECRET?.length, process.env.JWT_SECRET?.substring(0, 50));
  
  return {
    jwt: {
      secret: process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
      accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
      refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
    },
    bcrypt: {
      saltRounds: 12,
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // limit each IP to 5 requests per windowMs
      message: 'Too many authentication attempts, please try again later.',
    },
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
      credentials: true,
    },
  };
};

// Legacy export removed - use getAuthConfig() instead

export default getAuthConfig;