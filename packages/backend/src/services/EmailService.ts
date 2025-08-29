import nodemailer from 'nodemailer';
import crypto from 'crypto';

export interface EmailConfig {
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  from: {
    name: string;
    email: string;
  };
  baseUrl: string;
}

const emailConfig: EmailConfig = {
  smtp: {
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  },
  from: {
    name: process.env.FROM_NAME || 'Swistack',
    email: process.env.FROM_EMAIL || 'noreply@swistack.com',
  },
  baseUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
};

export class EmailService {
  private static transporter = nodemailer.createTransport({
    host: emailConfig.smtp.host,
    port: emailConfig.smtp.port,
    secure: emailConfig.smtp.secure,
    auth: emailConfig.smtp.auth,
  });

  static generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  static async sendEmailVerification(email: string, token: string): Promise<void> {
    const verificationUrl = `${emailConfig.baseUrl}/verify-email?token=${token}`;
    
    const mailOptions = {
      from: `${emailConfig.from.name} <${emailConfig.from.email}>`,
      to: email,
      subject: 'Verify Your Email - Swistack',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #0d9488;">Welcome to Swistack!</h1>
          <p>Thank you for signing up. Please verify your email address by clicking the button below:</p>
          
          <a href="${verificationUrl}" 
             style="display: inline-block; background-color: #0d9488; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; margin: 16px 0;">
            Verify Email Address
          </a>
          
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #0d9488;">${verificationUrl}</p>
          
          <p>This verification link will expire in 24 hours.</p>
          
          <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            If you didn't create an account with Swistack, please ignore this email.
          </p>
        </div>
      `,
      text: `
Welcome to Swistack!

Thank you for signing up. Please verify your email address by visiting:
${verificationUrl}

This verification link will expire in 24 hours.

If you didn't create an account with Swistack, please ignore this email.
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  static async sendPasswordReset(email: string, token: string): Promise<void> {
    const resetUrl = `${emailConfig.baseUrl}/reset-password?token=${token}`;
    
    const mailOptions = {
      from: `${emailConfig.from.name} <${emailConfig.from.email}>`,
      to: email,
      subject: 'Reset Your Password - Swistack',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #0d9488;">Reset Your Password</h1>
          <p>You requested to reset your password for your Swistack account. Click the button below to set a new password:</p>
          
          <a href="${resetUrl}" 
             style="display: inline-block; background-color: #0d9488; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; margin: 16px 0;">
            Reset Password
          </a>
          
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #0d9488;">${resetUrl}</p>
          
          <p>This reset link will expire in 1 hour for security reasons.</p>
          
          <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
          </p>
        </div>
      `,
      text: `
Reset Your Password

You requested to reset your password for your Swistack account. Visit this link to set a new password:
${resetUrl}

This reset link will expire in 1 hour for security reasons.

If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  static async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    const loginUrl = `${emailConfig.baseUrl}/login`;
    
    const mailOptions = {
      from: `${emailConfig.from.name} <${emailConfig.from.email}>`,
      to: email,
      subject: 'Welcome to Swistack - Your Coding Journey Begins!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #0d9488;">Welcome to Swistack, ${firstName}! 🚀</h1>
          <p>Your account has been successfully verified and you're ready to start coding!</p>
          
          <h2 style="color: #374151;">What's Next?</h2>
          <ul style="line-height: 1.6;">
            <li>Create your first project with our AI-powered templates</li>
            <li>Use our browser-based IDE with Monaco Editor</li>
            <li>Collaborate with team members in real-time</li>
            <li>Deploy your projects with one-click deployment</li>
          </ul>
          
          <a href="${loginUrl}" 
             style="display: inline-block; background-color: #0d9488; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; margin: 16px 0;">
            Start Coding Now
          </a>
          
          <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            Need help getting started? Check out our documentation or reach out to our support team.
          </p>
        </div>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  static async sendEmail(to: string, subject: string, html: string): Promise<void> {
    const mailOptions = {
      from: `${emailConfig.from.name} <${emailConfig.from.email}>`,
      to,
      subject,
      html
    };

    await this.transporter.sendMail(mailOptions);
  }

  static async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email service connection failed:', error);
      return false;
    }
  }
}