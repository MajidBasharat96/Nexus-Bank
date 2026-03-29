import { config } from '../../config/app.config';
import { logger } from '../../config/logger.config';

export class EmailService {
  static async sendVerificationEmail(email: string, username: string, token: string): Promise<void> {
    logger.info(`[EMAIL] Verification email to ${email} - Token: ${token}`);
    // In production: use nodemailer with SMTP config
  }

  static async sendPasswordResetEmail(email: string, username: string, token: string): Promise<void> {
    logger.info(`[EMAIL] Password reset email to ${email} - Token: ${token}`);
  }

  static async sendTransactionAlert(email: string, data: any): Promise<void> {
    logger.info(`[EMAIL] Transaction alert to ${email}`, data);
  }

  static async sendOTP(email: string, otp: string): Promise<void> {
    logger.info(`[EMAIL] OTP ${otp} to ${email}`);
  }
}
