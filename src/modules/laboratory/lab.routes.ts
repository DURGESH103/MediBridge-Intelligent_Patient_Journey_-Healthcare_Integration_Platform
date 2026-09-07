import { Router } from 'express';
import { labController } from './lab.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { UserRole } from '../../types/roles';
import { completeTestSchema, labRequestIdParamSchema, patientIdParamSchema } from './lab.validation';

const router = Router();

router.use(authenticate);

const labStaffRoles = [UserRole.LAB_STAFF, UserRole.ADMIN];

router.get('/pending', authorize(...labStaffRoles), labController.listPendingWork);

router.get(
  '/patients/:patientId',
  authorize(UserRole.PATIENT, UserRole.DOCTOR, UserRole.RECEPTIONIST, ...labStaffRoles),
  validate(patientIdParamSchema),
  labController.listForPatient
);

router.get(
  '/:id',
  authorize(UserRole.PATIENT, UserRole.DOCTOR, UserRole.RECEPTIONIST, ...labStaffRoles),
  validate(labRequestIdParamSchema),
  labController.getRequestById
);

router.get(
  '/:id/report',
  authorize(UserRole.PATIENT, UserRole.DOCTOR, UserRole.RECEPTIONIST, ...labStaffRoles),
  validate(labRequestIdParamSchema),
  labController.getReport
);

router.patch(
  '/:id/collect-sample',
  authorize(...labStaffRoles),
  validate(labRequestIdParamSchema),
  labController.collectSample
);

router.patch(
  '/:id/start-processing',
  authorize(...labStaffRoles),
  validate(labRequestIdParamSchema),
  labController.startProcessing
);

router.patch(
  '/:id/complete',
  authorize(...labStaffRoles),
  validate(completeTestSchema),
  labController.completeTest
);

export default router;
