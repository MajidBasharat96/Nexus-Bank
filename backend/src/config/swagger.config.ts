import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './app.config';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'NexusBank Core Banking API',
      version: config.appVersion,
      description: 'Enterprise-grade Core Banking System API Documentation',
      contact: {
        name: 'NexusBank API Support',
        email: 'api@nexusbank.com'
      },
      license: {
        name: 'Proprietary',
        url: 'https://nexusbank.com/license'
      }
    },
    servers: [
      {
        url: `${config.appUrl}/api/v1`,
        description: 'Development server'
      },
      {
        url: 'https://api.nexusbank.com/v1',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        },
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
            statusCode: { type: 'number' },
            timestamp: { type: 'string' }
          }
        },
        Customer: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            cifNumber: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            kycStatus: { type: 'string', enum: ['pending', 'verified', 'rejected'] },
            status: { type: 'string', enum: ['active', 'inactive', 'blocked'] }
          }
        },
        Account: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            accountNumber: { type: 'string' },
            accountType: { type: 'string' },
            balance: { type: 'number' },
            availableBalance: { type: 'number' },
            currency: { type: 'string' },
            status: { type: 'string' }
          }
        },
        Transaction: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            reference: { type: 'string' },
            type: { type: 'string' },
            amount: { type: 'number' },
            currency: { type: 'string' },
            status: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    },
    security: [{ BearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Authentication & Authorization' },
      { name: 'Customers', description: 'Customer Information File (CIF) Management' },
      { name: 'Accounts', description: 'Account Management' },
      { name: 'Transactions', description: 'Transaction Processing Engine' },
      { name: 'Loans', description: 'Loan & Credit Management' },
      { name: 'Cards', description: 'Cards & Digital Payments' },
      { name: 'Compliance', description: 'AML/KYC Compliance' },
      { name: 'Treasury', description: 'Treasury & Liquidity Management' },
      { name: 'Reports', description: 'Reporting & Analytics' },
      { name: 'Admin', description: 'Administration & Back Office' },
      { name: 'Fraud', description: 'Fraud Detection & Prevention' }
    ]
  },
  apis: ['./src/modules/**/*.routes.ts', './src/modules/**/*.controller.ts']
};

export const swaggerSpec = swaggerJsdoc(options);
