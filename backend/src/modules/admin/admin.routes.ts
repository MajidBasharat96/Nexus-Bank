import { Router } from 'express';
import { authenticate, authorize } from '../../common/middleware/auth.middleware';
import { Database } from '../../config/database.config';
import bcrypt from 'bcryptjs';
const router = Router();
router.use(authenticate, authorize('super_admin','admin'));
router.get('/users', async (req: any, res, next) => {
  try {
    const result = await Database.query('SELECT id,username,email,role,is_active,mfa_enabled,last_login,created_at FROM users WHERE tenant_id=$1 ORDER BY created_at DESC', [req.tenantId]);
    res.json({ success: true, data: result.rows });
  } catch(e) { next(e); }
});
router.post('/users', async (req: any, res, next) => {
  try {
    const { username, email, password, role } = req.body;
    const hash = await bcrypt.hash(password, 12);
    const result = await Database.query('INSERT INTO users (tenant_id,username,email,password_hash,role) VALUES ($1,$2,$3,$4,$5) RETURNING id,username,email,role', [req.tenantId, username, email, hash, role]);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch(e) { next(e); }
});
router.patch('/users/:id/status', async (req: any, res, next) => {
  try {
    const { isActive } = req.body;
    const result = await Database.query('UPDATE users SET is_active=$1 WHERE id=$2 AND tenant_id=$3 RETURNING id,username,email,is_active', [isActive, req.params.id, req.tenantId]);
    res.json({ success: true, data: result.rows[0] });
  } catch(e) { next(e); }
});
router.get('/audit-logs', async (req: any, res, next) => {
  try {
    const result = await Database.query("SELECT al.*, u.username FROM audit_logs al LEFT JOIN users u ON al.user_id=u.id WHERE al.tenant_id=$1 ORDER BY al.created_at DESC LIMIT 200", [req.tenantId]);
    res.json({ success: true, data: result.rows });
  } catch(e) { next(e); }
});
router.get('/system-health', (req, res) => {
  res.json({ success: true, data: { status:'healthy', uptime:process.uptime(), memory:process.memoryUsage(), nodeVersion:process.version, timestamp:new Date() }});
});
export default router;
