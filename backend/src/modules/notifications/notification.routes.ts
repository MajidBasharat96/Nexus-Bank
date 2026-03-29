import { Router } from 'express';
import { authenticate } from '../../common/middleware/auth.middleware';
import { Database } from '../../config/database.config';
const router = Router();
router.use(authenticate);
router.get('/', async (req: any, res, next) => {
  try {
    const result = await Database.query('SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50', [req.user.id]);
    res.json({ success: true, data: result.rows });
  } catch(e) { next(e); }
});
router.patch('/:id/read', async (req: any, res, next) => {
  try {
    await Database.query('UPDATE notifications SET read_at=NOW() WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch(e) { next(e); }
});
export default router;
