import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import swaggerUi from 'swagger-ui-express';

import { config } from './config/app.config';
import { logger } from './config/logger.config';
import { Database } from './config/database.config';
import { RedisClient } from './config/redis.config';
import { swaggerSpec } from './config/swagger.config';
import { errorHandler } from './common/middleware/error.middleware';
import { tenantMiddleware } from './common/middleware/tenant.middleware';
import { auditMiddleware } from './common/middleware/audit.middleware';
import { setupSocketHandlers } from './config/socket.config';

// Route imports
import authRoutes from './modules/auth/auth.routes';
import customerRoutes from './modules/customers/customer.routes';
import accountRoutes from './modules/accounts/account.routes';
import transactionRoutes from './modules/transactions/transaction.routes';
import loanRoutes from './modules/loans/loan.routes';
import cardRoutes from './modules/cards/card.routes';
import complianceRoutes from './modules/compliance/compliance.routes';
import treasuryRoutes from './modules/treasury/treasury.routes';
import notificationRoutes from './modules/notifications/notification.routes';
import reportRoutes from './modules/reports/report.routes';
import branchRoutes from './modules/branches/branch.routes';
import adminRoutes from './modules/admin/admin.routes';
import integrationRoutes from './modules/integrations/integration.routes';
import fraudRoutes from './modules/fraud/fraud.routes';

const app: Application = express();
const httpServer = createServer(app);

// Socket.IO for real-time features
export const io = new SocketServer(httpServer, {
  cors: {
    origin: config.frontendUrl,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    }
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }
}));

// CORS
app.use(cors({
  origin: [config.frontendUrl, 'http://localhost:5173', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID', 'X-Request-ID', 'X-API-Key']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many authentication attempts.' }
});

app.use('/api/', limiter);
app.use('/api/auth/login', strictLimiter);
app.use('/api/auth/mfa', strictLimiter);

// Body parsing
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) }
}));

// Multi-tenancy
app.use(tenantMiddleware);

// Audit logging
app.use(auditMiddleware);

// API Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'NexusBank API Documentation'
}));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: config.appVersion,
    environment: config.nodeEnv,
    services: {
      database: Database.isConnected() ? 'connected' : 'disconnected',
      redis: RedisClient.isConnected() ? 'connected' : 'disconnected'
    }
  });
});

app.get('/api/v1/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes (v1)
const v1 = '/api/v1';
app.use(`${v1}/auth`, authRoutes);
app.use(`${v1}/customers`, customerRoutes);
app.use(`${v1}/accounts`, accountRoutes);
app.use(`${v1}/transactions`, transactionRoutes);
app.use(`${v1}/loans`, loanRoutes);
app.use(`${v1}/cards`, cardRoutes);
app.use(`${v1}/compliance`, complianceRoutes);
app.use(`${v1}/treasury`, treasuryRoutes);
app.use(`${v1}/notifications`, notificationRoutes);
app.use(`${v1}/reports`, reportRoutes);
app.use(`${v1}/branches`, branchRoutes);
app.use(`${v1}/admin`, adminRoutes);
app.use(`${v1}/integrations`, integrationRoutes);
app.use(`${v1}/fraud`, fraudRoutes);

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use(errorHandler);

// Setup Socket.IO handlers
setupSocketHandlers(io);

// Bootstrap application
async function bootstrap() {
  try {
    // Connect to database
    await Database.connect();
    logger.info('✅ Database connected successfully');

    // Connect to Redis
    await RedisClient.connect();
    logger.info('✅ Redis connected successfully');

    // Run migrations
    await Database.runMigrations();
    logger.info('✅ Database migrations completed');

    // Start server
    httpServer.listen(config.port, () => {
      logger.info(`🚀 NexusBank Core Banking System`);
      logger.info(`📡 Server running on port ${config.port}`);
      logger.info(`🌍 Environment: ${config.nodeEnv}`);
      logger.info(`📖 API Docs: http://localhost:${config.port}/api/docs`);
      logger.info(`❤️  Health: http://localhost:${config.port}/health`);
    });

  } catch (error) {
    logger.error('❌ Failed to start application:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await Database.disconnect();
  await RedisClient.disconnect();
  httpServer.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

bootstrap();

export default app;
