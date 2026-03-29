import { Router } from 'express';
import { CustomerController } from './customer.service';
import { authenticate, authorize } from '../../common/middleware/auth.middleware';

const router = Router();
const controller = new CustomerController();

router.use(authenticate);

router.get('/search', controller.search);
router.get('/', controller.list);
router.post('/', authorize('super_admin', 'admin', 'branch_manager', 'officer'), controller.create);
router.get('/:id', controller.getById);
router.put('/:id', authorize('super_admin', 'admin', 'branch_manager', 'officer'), controller.update);
router.patch('/:id/kyc', authorize('super_admin', 'admin', 'compliance_officer'), controller.updateKyc);
router.get('/:id/transactions', controller.getTransactions);
router.get('/:id/statement', controller.getStatement);

export default router;
