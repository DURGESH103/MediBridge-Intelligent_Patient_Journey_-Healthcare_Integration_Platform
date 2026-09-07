import { Router } from 'express';
import { queueController } from './queue.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { UserRole } from '../../types/roles';
import { appointmentIdParamSchema, checkInSchema, doctorIdParamSchema, queueEntryIdParamSchema } from './queue.validation';

const router = Router();

router.use(authenticate);

const staffRoles = [UserRole.ADMIN, UserRole.RECEPTIONIST];

router.post(
  '/check-in',
  authorize(UserRole.PATIENT, ...staffRoles),
  validate(checkInSchema),
  queueController.checkIn
);

router.get(
  '/doctors/:doctorId',
  authorize(UserRole.DOCTOR, ...staffRoles),
  validate(doctorIdParamSchema),
  queueController.getDoctorQueue
);

router.get('/doctors/:doctorId/summary', validate(doctorIdParamSchema), queueController.getDoctorQueueSummary);

router.patch(
  '/doctors/:doctorId/call-next',
  authorize(UserRole.DOCTOR, ...staffRoles),
  validate(doctorIdParamSchema),
  queueController.callNext
);

router.get('/entries/:id', validate(queueEntryIdParamSchema), queueController.getEntryStatus);

router.get(
  '/appointments/:appointmentId',
  validate(appointmentIdParamSchema),
  queueController.getEntryByAppointment
);

router.patch(
  '/entries/:id/complete',
  authorize(UserRole.DOCTOR, ...staffRoles),
  validate(queueEntryIdParamSchema),
  queueController.completeEntry
);

router.patch(
  '/entries/:id/skip',
  authorize(UserRole.DOCTOR, ...staffRoles),
  validate(queueEntryIdParamSchema),
  queueController.skipEntry
);

router.patch(
  '/entries/:id/cancel',
  authorize(UserRole.PATIENT, ...staffRoles),
  validate(queueEntryIdParamSchema),
  queueController.cancelEntry
);

export default router;
