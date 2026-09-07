import { Router } from 'express';
import { consultationController } from './consultation.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { UserRole } from '../../types/roles';
import {
  addPrescriptionSchema,
  appointmentIdParamSchema,
  consultationIdParamSchema,
  requestLabTestSchema,
  startConsultationSchema,
  updateNotesSchema,
} from './consultation.validation';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  authorize(UserRole.DOCTOR),
  validate(startConsultationSchema),
  consultationController.startConsultation
);

router.get('/:id', validate(consultationIdParamSchema), consultationController.getConsultationById);

router.get(
  '/by-appointment/:appointmentId',
  validate(appointmentIdParamSchema),
  consultationController.getByAppointment
);

router.patch(
  '/:id',
  authorize(UserRole.DOCTOR),
  validate(updateNotesSchema),
  consultationController.updateNotes
);

router.post(
  '/:id/prescriptions',
  authorize(UserRole.DOCTOR),
  validate(addPrescriptionSchema),
  consultationController.addPrescription
);

router.get('/:id/prescriptions', validate(consultationIdParamSchema), consultationController.getPrescriptions);

router.post(
  '/:id/lab-tests',
  authorize(UserRole.DOCTOR),
  validate(requestLabTestSchema),
  consultationController.requestLabTest
);

router.get('/:id/lab-tests', validate(consultationIdParamSchema), consultationController.listLabTests);

router.patch(
  '/:id/complete',
  authorize(UserRole.DOCTOR),
  validate(consultationIdParamSchema),
  consultationController.completeConsultation
);

export default router;
