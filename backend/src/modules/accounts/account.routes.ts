// accounts/account.routes.ts
import { Router } from 'express';
import { AccountController } from './account.service';
import { authenticate, authorize } from '../../common/middleware/auth.middleware';
const router = Router();
const ctrl = new AccountController();
router.use(authenticate);
router.get('/dashboard', ctrl.getDashboard);
router.get('/', ctrl.list);
router.post('/', authorize('super_admin','admin','branch_manager','officer'), ctrl.create);
router.get('/:id', ctrl.getById);
router.get('/:id/balance', ctrl.getBalance);
router.patch('/:id/status', authorize('super_admin','admin','branch_manager'), ctrl.updateStatus);
export default router;
