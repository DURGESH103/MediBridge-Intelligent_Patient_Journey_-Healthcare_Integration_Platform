import { Router } from 'express';
import { patientsController } from './patients.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { UserRole } from '../../types/roles';
import {
  createPatientSchema,
  patientIdParamSchema,
  searchPatientsSchema,
  updatePatientSchema,
} from './patients.validation';

const router = Router();

router.use(authenticate);

const staffRoles = [
  UserRole.ADMIN,
  UserRole.RECEPTIONIST,
  UserRole.DOCTOR,
  UserRole.LAB_STAFF,
  UserRole.BILLING_STAFF,
];

router.post(
  '/',
  authorize(UserRole.ADMIN, UserRole.RECEPTIONIST),
  validate(createPatientSchema),
  patientsController.registerPatient
);

router.get('/me', authorize(UserRole.PATIENT), patientsController.getMyProfile);

router.get('/search', authorize(...staffRoles), validate(searchPatientsSchema), patientsController.searchPatients);

router.get(
  '/:id',
  authorize(...staffRoles, UserRole.PATIENT),
  validate(patientIdParamSchema),
  patientsController.getPatientById
);

router.patch(
  '/:id',
  authorize(UserRole.ADMIN, UserRole.RECEPTIONIST, UserRole.PATIENT),
  validate(updatePatientSchema),
  patientsController.updatePatient
);

export default router;
