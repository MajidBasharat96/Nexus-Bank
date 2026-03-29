import { Router } from 'express';
import { authenticate } from '../../common/middleware/auth.middleware';
import { Database } from '../../config/database.config';
const router = Router();
router.use(authenticate);
router.get('/dashboard', async (req: any, res, next) => {
  try {
    const [customers, accounts, transactions, loans, fraud] = await Promise.all([
      Database.query("SELECT COUNT(*) as total, COUNT(CASE WHEN kyc_status='verified' THEN 1 END) as kyc_verified, COUNT(CASE WHEN created_at>=NOW()-INTERVAL '30 days' THEN 1 END) as new_month FROM customers WHERE tenant_id=$1", [req.tenantId]),
      Database.query("SELECT COUNT(*) as total, COALESCE(SUM(balance),0) as total_balance FROM accounts WHERE tenant_id=$1 AND status='active'", [req.tenantId]),
      Database.query("SELECT COUNT(*) as total, COALESCE(SUM(amount),0) as volume, COUNT(CASE WHEN DATE(created_at)=CURRENT_DATE THEN 1 END) as today_count FROM transactions WHERE tenant_id=$1 AND status='completed'", [req.tenantId]),
      Database.query("SELECT COUNT(*) as total, COALESCE(SUM(outstanding_amount),0) as outstanding, COUNT(CASE WHEN status='pending' THEN 1 END) as pending FROM loans WHERE tenant_id=$1", [req.tenantId]),
      Database.query("SELECT COUNT(*) as open_alerts FROM fraud_alerts WHERE tenant_id=$1 AND status='open'", [req.tenantId])
    ]);
    res.json({ success: true, data: { customers: customers.rows[0], accounts: accounts.rows[0], transactions: transactions.rows[0], loans: loans.rows[0], fraud: fraud.rows[0] }});
  } catch(e) { next(e); }
});
router.get('/transaction-volume', async (req: any, res, next) => {
  try {
    const result = await Database.query(
      "SELECT DATE(created_at) as date, COUNT(*) as count, COALESCE(SUM(amount),0) as volume, transaction_type FROM transactions WHERE tenant_id=$1 AND created_at>=NOW()-INTERVAL '30 days' GROUP BY DATE(created_at), transaction_type ORDER BY date",
      [req.tenantId]
    );
    res.json({ success: true, data: result.rows });
  } catch(e) { next(e); }
});
export default router;
