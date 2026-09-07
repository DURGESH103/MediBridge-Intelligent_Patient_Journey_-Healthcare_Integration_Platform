import { Router } from 'express';
import { doctorController } from './doctor.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { UserRole } from '../../types/roles';
import {
  doctorIdParamSchema,
  listDoctorsSchema,
  registerDoctorSchema,
  setAvailabilitySchema,
  updateDoctorSchema,
} from './doctor.validation';

const router = Router();

router.use(authenticate);

router.post('/', authorize(UserRole.ADMIN), validate(registerDoctorSchema), doctorController.registerDoctor);
router.get('/', validate(listDoctorsSchema), doctorController.listDoctors);
router.get('/me', authorize(UserRole.DOCTOR), doctorController.getMyProfile);
router.get('/:id', validate(doctorIdParamSchema), doctorController.getDoctorById);
router.patch('/:id', authorize(UserRole.ADMIN), validate(updateDoctorSchema), doctorController.updateDoctor);

router.get('/:id/availability', validate(doctorIdParamSchema), doctorController.getAvailability);
router.put(
  '/:id/availability',
  authorize(UserRole.ADMIN, UserRole.DOCTOR),
  validate(setAvailabilitySchema),
  doctorController.setAvailability
);

export default router;
