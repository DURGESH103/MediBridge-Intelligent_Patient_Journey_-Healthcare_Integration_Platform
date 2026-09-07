import { Router } from 'express';
import { appointmentController } from './appointment.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { UserRole } from '../../types/roles';
import {
  appointmentIdParamSchema,
  availableSlotsSchema,
  createAppointmentSchema,
  listAppointmentsSchema,
  rescheduleAppointmentSchema,
} from './appointment.validation';

const router = Router();

router.use(authenticate);

const staffRoles = [UserRole.ADMIN, UserRole.RECEPTIONIST];

router.get('/available-slots', validate(availableSlotsSchema), appointmentController.getAvailableSlots);

router.post(
  '/',
  authorize(UserRole.PATIENT, ...staffRoles),
  validate(createAppointmentSchema),
  appointmentController.createAppointment
);

router.get('/', validate(listAppointmentsSchema), appointmentController.listAppointments);

router.get('/:id', validate(appointmentIdParamSchema), appointmentController.getAppointmentById);

router.patch(
  '/:id/confirm',
  authorize(...staffRoles),
  validate(appointmentIdParamSchema),
  appointmentController.confirmAppointment
);

router.patch(
  '/:id/cancel',
  authorize(UserRole.PATIENT, UserRole.DOCTOR, ...staffRoles),
  validate(appointmentIdParamSchema),
  appointmentController.cancelAppointment
);

router.patch(
  '/:id/no-show',
  authorize(UserRole.DOCTOR, ...staffRoles),
  validate(appointmentIdParamSchema),
  appointmentController.markNoShow
);

router.patch(
  '/:id/reschedule',
  authorize(UserRole.PATIENT, ...staffRoles),
  validate(rescheduleAppointmentSchema),
  appointmentController.rescheduleAppointment
);

export default router;
