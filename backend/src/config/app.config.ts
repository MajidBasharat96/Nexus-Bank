import dotenv from 'dotenv';
dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000'),
  appName: process.env.APP_NAME || 'NexusBank',
  appVersion: process.env.APP_VERSION || '1.0.0',
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    name: process.env.DB_NAME || 'nexusbank',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    ssl: process.env.DB_SSL === 'true',
    poolMin: parseInt(process.env.DB_POOL_MIN || '2'),
    poolMax: parseInt(process.env.DB_POOL_MAX || '20')
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0'),
    ttl: parseInt(process.env.REDIS_TTL || '3600')
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'nexusbank-super-secret-jwt-key-2024',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'nexusbank-refresh-secret-2024',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },

  encryption: {
    key: process.env.ENCRYPTION_KEY || 'nexusbank-encryption-key-32chars',
    iv: process.env.ENCRYPTION_IV || 'nexusbank-iv-16ch'
  },

  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || 'noreply@nexusbank.com',
    fromName: process.env.EMAIL_FROM_NAME || 'NexusBank'
  },

  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    phoneNumber: process.env.TWILIO_PHONE_NUMBER || ''
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || ''
  },

  raast: {
    apiUrl: process.env.RAAST_API_URL || 'https://api.raast.com.pk',
    institutionId: process.env.RAAST_INSTITUTION_ID || '',
    apiKey: process.env.RAAST_API_KEY || ''
  },

  nadra: {
    apiUrl: process.env.NADRA_API_URL || 'https://api.nadra.gov.pk',
    apiKey: process.env.NADRA_API_KEY || ''
  },

  creditBureau: {
    url: process.env.CREDIT_BUREAU_URL || '',
    key: process.env.CREDIT_BUREAU_KEY || ''
  },

  mlService: {
    url: process.env.ML_SERVICE_URL || 'http://localhost:8001',
    apiKey: process.env.ML_API_KEY || ''
  },

  upload: {
    dir: process.env.UPLOAD_DIR || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'),
    allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'jpg,jpeg,png,pdf,doc,docx').split(',')
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    dir: process.env.LOG_DIR || './logs'
  },

  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),

  banking: {
    dailyTransferLimit: parseFloat(process.env.DAILY_TRANSFER_LIMIT || '5000000'),
    singleTransactionLimit: parseFloat(process.env.SINGLE_TRANSACTION_LIMIT || '1000000'),
    ibftFee: parseFloat(process.env.IBFT_FEE || '25'),
    minBalanceSavings: parseFloat(process.env.MINIMUM_BALANCE_SAVINGS || '1000'),
    minBalanceCurrent: parseFloat(process.env.MINIMUM_BALANCE_CURRENT || '5000'),
    amlThreshold: parseFloat(process.env.AML_THRESHOLD_AMOUNT || '500000'),
    ctrThreshold: parseFloat(process.env.CTR_THRESHOLD || '500000')
  },

  multiTenancy: {
    enabled: process.env.TENANT_ISOLATION_ENABLED === 'true',
    defaultTenant: process.env.DEFAULT_TENANT || 'default'
  }
};
