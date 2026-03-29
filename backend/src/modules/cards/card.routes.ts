import { Router } from 'express';
import { authenticate } from '../../common/middleware/auth.middleware';
import { Database } from '../../config/database.config';
const router = Router();
router.use(authenticate);
router.get('/', async (req: any, res, next) => {
  try {
    const result = await Database.query(
      `SELECT c.*, cu.full_name as customer_name FROM cards c JOIN customers cu ON c.customer_id=cu.id WHERE cu.tenant_id=$1 ORDER BY c.created_at DESC`,
      [req.tenantId]
    );
    res.json({ success: true, data: result.rows });
  } catch(e) { next(e); }
});
router.post('/', async (req: any, res, next) => {
  try {
    const { customerId, accountId, cardType, cardHolderName, cardScheme='Visa' } = req.body;
    const last4 = Math.floor(1000 + Math.random()*9000);
    const masked = `**** **** **** ${last4}`;
    const expYear = new Date().getFullYear() + 4;
    const expMonth = new Date().getMonth() + 1;
    const result = await Database.query(
      `INSERT INTO cards (tenant_id,card_number_masked,card_number_encrypted,customer_id,account_id,card_type,card_scheme,card_holder_name,expiry_month,expiry_year,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'inactive') RETURNING *`,
      [req.tenantId, masked, `enc_${last4}`, customerId, accountId, cardType, cardScheme, cardHolderName, expMonth, expYear]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch(e) { next(e); }
});
router.patch('/:id/status', async (req: any, res, next) => {
  try {
    const { status, reason } = req.body;
    const result = await Database.query(
      `UPDATE cards SET status=$1, block_reason=$2 WHERE id=$3 RETURNING *`,
      [status, reason, req.params.id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch(e) { next(e); }
});
export default router;
