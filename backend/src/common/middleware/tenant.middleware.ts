// tenant.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { config } from '../../config/app.config';

export const tenantMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const tenantId = req.headers['x-tenant-id'] as string || config.multiTenancy.defaultTenant;
  (req as any).tenantId = tenantId;
  res.setHeader('X-Tenant-ID', tenantId);
  next();
};
