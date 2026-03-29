import { Router } from 'express';
import { authenticate, authorize } from '../../common/middleware/auth.middleware';
import { Database } from '../../config/database.config';
const router = Router();
router.use(authenticate);
router.get('/alerts', async (req: any, res, next) => {
  try {
    const result = await Database.query(
      "SELECT ca.*, c.full_name as customer_name FROM compliance_alerts ca LEFT JOIN customers c ON ca.customer_id=c.id WHERE ca.tenant_id=$1 ORDER BY ca.created_at DESC LIMIT 100",
      [req.tenantId]
    );
    res.json({ success: true, data: result.rows });
  } catch(e) { next(e); }
});
router.patch('/alerts/:id', authorize('super_admin','admin','compliance_officer'), async (req: any, res, next) => {
  try {
    const { status, notes } = req.body;
    const result = await Database.query(
      "UPDATE compliance_alerts SET status=$1, resolution_notes=$2, resolved_at=NOW(), resolved_by=$3 WHERE id=$4 RETURNING *",
      [status, notes, req.user.id, req.params.id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch(e) { next(e); }
});
router.get('/aml-report', async (req: any, res, next) => {
  try {
    const result = await Database.query(
      "SELECT t.transaction_reference, t.amount, t.currency, t.created_at, c.full_name, c.national_id FROM transactions t JOIN accounts a ON t.debit_account_id=a.id JOIN customers c ON a.customer_id=c.id WHERE t.tenant_id=$1 AND t.amount >= 500000 AND t.created_at >= NOW()-INTERVAL '30 days' ORDER BY t.amount DESC",
      [req.tenantId]
    );
    res.json({ success: true, data: result.rows });
  } catch(e) { next(e); }
});
export default router;
