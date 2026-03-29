import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { Database } from '../../config/database.config';
import { RedisClient } from '../../config/redis.config';
import { config } from '../../config/app.config';
import { logger } from '../../config/logger.config';
import { AppError } from '../../common/middleware/error.middleware';
import { EmailService } from '../notifications/email.service';

export class AuthService {

  async login(username: string, password: string, ip: string, userAgent: string): Promise<any> {
    const result = await Database.query(
      'SELECT * FROM users WHERE (username = $1 OR email = $1) AND is_active = true',
      [username]
    );

    if (result.rows.length === 0) {
      throw new AppError('Invalid credentials', 401);
    }

    const user = result.rows[0];

    // Check if account is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      throw new AppError('Account temporarily locked due to multiple failed login attempts', 423);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      // Increment failed attempts
      const attempts = user.failed_login_attempts + 1;
      let lockedUntil = null;
      if (attempts >= 5) {
        lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 minutes
      }
      await Database.query(
        'UPDATE users SET failed_login_attempts = $1, locked_until = $2 WHERE id = $3',
        [attempts, lockedUntil, user.id]
      );
      throw new AppError('Invalid credentials', 401);
    }

    // Reset failed attempts
    await Database.query(
      'UPDATE users SET failed_login_attempts = 0, locked_until = NULL, last_login = NOW() WHERE id = $1',
      [user.id]
    );

    // Check if MFA required
    if (user.mfa_enabled) {
      const mfaToken = uuidv4();
      await RedisClient.set(`mfa:${mfaToken}`, user.id, 300); // 5 minutes
      return { requiresMfa: true, mfaToken };
    }

    return this.generateTokens(user);
  }

  async verifyMfa(mfaToken: string, code: string): Promise<any> {
    const userId = await RedisClient.get(`mfa:${mfaToken}`);
    if (!userId) throw new AppError('MFA token expired or invalid', 401);

    const result = await Database.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) throw new AppError('User not found', 404);

    const user = result.rows[0];
    const isValid = speakeasy.totp.verify({
      secret: user.mfa_secret,
      encoding: 'base32',
      token: code,
      window: 2
    });

    if (!isValid) throw new AppError('Invalid MFA code', 401);

    await RedisClient.del(`mfa:${mfaToken}`);
    return this.generateTokens(user);
  }

  async register(userData: any): Promise<any> {
    const { username, email, password, role = 'customer' } = userData;

    // Check existing user
    const existing = await Database.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );
    if (existing.rows.length > 0) {
      throw new AppError('Username or email already exists', 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const verificationToken = uuidv4();

    const result = await Database.query(
      `INSERT INTO users (tenant_id, username, email, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4, $5, true) RETURNING *`,
      ['default', username, email, passwordHash, role]
    );

    const user = result.rows[0];

    // Send verification email (non-blocking)
    EmailService.sendVerificationEmail(email, username, verificationToken).catch(logger.error);

    return { id: user.id, username: user.username, email: user.email, role: user.role };
  }

  async refreshToken(refreshToken: string): Promise<any> {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as any;
      const blacklisted = await RedisClient.exists(`blacklist:${refreshToken}`);
      if (blacklisted) throw new AppError('Token revoked', 401);

      const result = await Database.query('SELECT * FROM users WHERE id = $1 AND is_active = true', [decoded.id]);
      if (result.rows.length === 0) throw new AppError('User not found', 401);

      return this.generateTokens(result.rows[0]);
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError('Invalid refresh token', 401);
    }
  }

  async logout(token: string, refreshToken: string): Promise<void> {
    // Blacklist both tokens
    await RedisClient.set(`blacklist:${token}`, '1', 86400);
    if (refreshToken) await RedisClient.set(`blacklist:${refreshToken}`, '1', 604800);
  }

  async setupMfa(userId: string): Promise<{ secret: string; qrCode: string }> {
    const secret = speakeasy.generateSecret({
      name: `NexusBank (${userId})`,
      issuer: 'NexusBank'
    });

    await Database.query(
      'UPDATE users SET mfa_secret = $1 WHERE id = $2',
      [secret.base32, userId]
    );

    const qrCode = await QRCode.toDataURL(secret.otpauth_url!);
    return { secret: secret.base32, qrCode };
  }

  async enableMfa(userId: string, code: string): Promise<void> {
    const result = await Database.query('SELECT mfa_secret FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) throw new AppError('User not found', 404);

    const isValid = speakeasy.totp.verify({
      secret: result.rows[0].mfa_secret,
      encoding: 'base32',
      token: code
    });

    if (!isValid) throw new AppError('Invalid MFA code', 400);
    await Database.query('UPDATE users SET mfa_enabled = true WHERE id = $1', [userId]);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const result = await Database.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) throw new AppError('User not found', 404);

    const user = result.rows[0];
    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) throw new AppError('Current password is incorrect', 401);

    const newHash = await bcrypt.hash(newPassword, 12);
    await Database.query(
      'UPDATE users SET password_hash = $1, password_changed_at = NOW(), force_password_change = false WHERE id = $2',
      [newHash, userId]
    );
  }

  async forgotPassword(email: string): Promise<void> {
    const result = await Database.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return; // Don't reveal if email exists

    const token = uuidv4();
    await RedisClient.set(`reset:${token}`, result.rows[0].id, 3600); // 1 hour
    await EmailService.sendPasswordResetEmail(email, result.rows[0].username, token);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const userId = await RedisClient.get(`reset:${token}`);
    if (!userId) throw new AppError('Reset token invalid or expired', 400);

    const newHash = await bcrypt.hash(newPassword, 12);
    await Database.query(
      'UPDATE users SET password_hash = $1, password_changed_at = NOW() WHERE id = $2',
      [newHash, userId]
    );
    await RedisClient.del(`reset:${token}`);
  }

  private generateTokens(user: any): any {
    const payload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      tenantId: user.tenant_id,
      permissions: user.permissions || []
    };

    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn
    } as any);

    const refreshToken = jwt.sign({ id: user.id }, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn
    } as any);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        mfaEnabled: user.mfa_enabled
      }
    };
  }
}

export class AuthController {
  private authService = new AuthService();

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { username, password } = req.body;
      const ip = req.ip || req.connection.remoteAddress || '';
      const userAgent = req.get('User-Agent') || '';

      if (!username || !password) {
        throw new AppError('Username and password required', 400);
      }

      const result = await this.authService.login(username, password, ip, userAgent);

      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  };

  verifyMfa = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { mfaToken, code } = req.body;
      const result = await this.authService.verifyMfa(mfaToken, code);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.authService.register(req.body);
      res.status(201).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) throw new AppError('Refresh token required', 400);
      const tokens = await this.authService.refreshToken(refreshToken);
      res.json({ success: true, data: tokens });
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.headers.authorization?.split(' ')[1] || '';
      const { refreshToken } = req.body;
      await this.authService.logout(token, refreshToken);
      res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  };

  setupMfa = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const result = await this.authService.setupMfa(userId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  enableMfa = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const { code } = req.body;
      await this.authService.enableMfa(userId, code);
      res.json({ success: true, message: 'MFA enabled successfully' });
    } catch (error) {
      next(error);
    }
  };

  changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const { currentPassword, newPassword } = req.body;
      await this.authService.changePassword(userId, currentPassword, newPassword);
      res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
      next(error);
    }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body;
      await this.authService.forgotPassword(email);
      res.json({ success: true, message: 'If the email exists, reset instructions will be sent' });
    } catch (error) {
      next(error);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token, newPassword } = req.body;
      await this.authService.resetPassword(token, newPassword);
      res.json({ success: true, message: 'Password reset successfully' });
    } catch (error) {
      next(error);
    }
  };

  getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).user.id;
      const result = await Database.query(
        'SELECT id, username, email, role, permissions, mfa_enabled, last_login, created_at FROM users WHERE id = $1',
        [userId]
      );
      if (result.rows.length === 0) throw new AppError('User not found', 404);
      res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      next(error);
    }
  };
}
