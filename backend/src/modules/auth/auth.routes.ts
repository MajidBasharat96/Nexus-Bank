import { Router } from 'express';
import { AuthController } from './auth.service';
import { authenticate } from '../../common/middleware/auth.middleware';

const router = Router();
const controller = new AuthController();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post('/login', controller.login);
router.post('/mfa/verify', controller.verifyMfa);
router.post('/register', controller.register);
router.post('/refresh', controller.refreshToken);
router.post('/logout', authenticate, controller.logout);
router.get('/profile', authenticate, controller.getProfile);
router.post('/mfa/setup', authenticate, controller.setupMfa);
router.post('/mfa/enable', authenticate, controller.enableMfa);
router.post('/change-password', authenticate, controller.changePassword);
router.post('/forgot-password', controller.forgotPassword);
router.post('/reset-password', controller.resetPassword);

export default router;
