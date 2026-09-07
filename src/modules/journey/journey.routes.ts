import { Router } from 'express';
import { journeyController } from './journey.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { UserRole } from '../../types/roles';
import { appointmentIdParamSchema, patientIdParamSchema } from './journey.validation';

const router = Router();

router.use(authenticate);

router.get('/me', authorize(UserRole.PATIENT), journeyController.getMyCurrentJourney);

router.get(
  '/patients/:patientId',
  validate(patientIdParamSchema),
  journeyController.getCurrentJourneyForPatient
);

router.get(
  '/patients/:patientId/timeline',
  validate(patientIdParamSchema),
  journeyController.getTimelineForPatient
);

router.get(
  '/appointments/:appointmentId',
  validate(appointmentIdParamSchema),
  journeyController.getJourneyForAppointment
);

export default router;
