import { describe, it, expect } from 'vitest';
import { validateEmail, validatePassword, validateUsername } from './validation';

describe('validation utilities', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      expect(validatePassword('Password123')).toBe(true);
      expect(validatePassword('MySecure1')).toBe(true);
    });

    it('should reject weak passwords', () => {
      expect(validatePassword('weak')).toBe(false);
      expect(validatePassword('password')).toBe(false);
      expect(validatePassword('PASSWORD')).toBe(false);
      expect(validatePassword('12345678')).toBe(false);
    });
  });

  describe('validateUsername', () => {
    it('should validate correct usernames', () => {
      expect(validateUsername('user123')).toBe(true);
      expect(validateUsername('test-user')).toBe(true);
      expect(validateUsername('user_name')).toBe(true);
    });

    it('should reject invalid usernames', () => {
      expect(validateUsername('us')).toBe(false);
      expect(validateUsername('user with spaces')).toBe(false);
      expect(validateUsername('user@domain')).toBe(false);
    });
  });
});