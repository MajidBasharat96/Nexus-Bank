import { Router } from 'express';
import { authenticate } from '../../common/middleware/auth.middleware';
import { Database } from '../../config/database.config';
const router = Router();
router.use(authenticate);
router.get('/liquidity', async (req: any, res, next) => {
  try {
    const result = await Database.query(
      "SELECT currency, COALESCE(SUM(balance),0) as total_balance, COALESCE(SUM(available_balance),0) as available, COUNT(*) as accounts FROM accounts WHERE tenant_id=$1 AND status='active' GROUP BY currency",
      [req.tenantId]
    );
    res.json({ success: true, data: result.rows });
  } catch(e) { next(e); }
});
router.get('/cash-flow', async (req: any, res, next) => {
  try {
    const result = await Database.query(
      "SELECT DATE(created_at) as date, transaction_type, COALESCE(SUM(amount),0) as volume FROM transactions WHERE tenant_id=$1 AND created_at >= NOW()-INTERVAL '30 days' GROUP BY DATE(created_at), transaction_type ORDER BY date",
      [req.tenantId]
    );
    res.json({ success: true, data: result.rows });
  } catch(e) { next(e); }
});
export default router;
