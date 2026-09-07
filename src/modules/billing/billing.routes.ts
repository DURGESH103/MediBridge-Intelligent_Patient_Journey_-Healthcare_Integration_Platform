import { Router } from 'express';
import { billingController } from './billing.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { UserRole } from '../../types/roles';
import { billingIdParamSchema, billingPatientIdParamSchema } from './billing.validation';

const router = Router();

router.use(authenticate);

const billingRoles = [UserRole.BILLING_STAFF, UserRole.ADMIN];

router.get('/pending', authorize(...billingRoles), billingController.listPending);
router.get('/completed', authorize(...billingRoles), billingController.listCompleted);

router.get(
  '/patients/:patientId',
  authorize(UserRole.PATIENT, ...billingRoles),
  validate(billingPatientIdParamSchema),
  billingController.listForPatient
);

router.patch(
  '/:id/mark-paid',
  authorize(...billingRoles),
  validate(billingIdParamSchema),
  billingController.markPaid
);

export default router;
