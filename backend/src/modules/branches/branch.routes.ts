import { Router } from 'express';
import { authenticate } from '../../common/middleware/auth.middleware';
import { Database } from '../../config/database.config';
const router = Router();
router.use(authenticate);
router.get('/', async (req: any, res, next) => {
  try {
    const result = await Database.query('SELECT * FROM branches WHERE tenant_id=$1 ORDER BY name', [req.tenantId]);
    res.json({ success: true, data: result.rows });
  } catch(e) { next(e); }
});
router.post('/', async (req: any, res, next) => {
  try {
    const { branchCode, name, type, address, phone, email } = req.body;
    const result = await Database.query('INSERT INTO branches (tenant_id,branch_code,name,type,address,phone,email) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *', [req.tenantId, branchCode, name, type||'branch', JSON.stringify(address||{}), phone, email]);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch(e) { next(e); }
});
export default router;
