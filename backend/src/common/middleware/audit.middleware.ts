import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Database } from '../../config/database.config';
import { logger } from '../../config/logger.config';

export const auditMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = uuidv4();
  (req as any).requestId = requestId;
  res.setHeader('X-Request-ID', requestId);

  const startTime = Date.now();
  const originalSend = res.send;

  res.send = function(body: any) {
    const duration = Date.now() - startTime;
    const user = (req as any).user;

    // Log significant operations
    const auditMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    const skipPaths = ['/health', '/api/docs', '/api/v1/health'];
    const shouldAudit = auditMethods.includes(req.method) &&
      !skipPaths.some(p => req.path.includes(p)) &&
      user?.id;

    if (shouldAudit) {
      Database.query(
        `INSERT INTO audit_logs (user_id, tenant_id, action, resource_type, ip_address, user_agent, request_id, status, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          user?.id,
          (req as any).tenantId,
          `${req.method} ${req.path}`,
          req.path.split('/')[3] || 'unknown',
          req.ip,
          req.get('User-Agent'),
          requestId,
          res.statusCode < 400 ? 'success' : 'failure',
          JSON.stringify({ method: req.method, duration, statusCode: res.statusCode })
        ]
      ).catch(err => logger.error('Audit log error:', err));
    }

    return originalSend.call(this, body);
  };

  next();
};
