import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import usersRoutes from '../modules/users/users.routes';
import patientsRoutes from '../modules/patients/patients.routes';
import departmentRoutes from '../modules/doctors/department.routes';
import doctorRoutes from '../modules/doctors/doctor.routes';
import appointmentRoutes from '../modules/appointments/appointment.routes';
import queueRoutes from '../modules/queue/queue.routes';
import consultationRoutes from '../modules/consultations/consultation.routes';
import labRoutes from '../modules/laboratory/lab.routes';
import journeyRoutes from '../modules/journey/journey.routes';
import notificationRoutes from '../modules/notifications/notification.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.status(200).json({ success: true, message: 'MediBridge API is running', data: null });
});

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/patients', patientsRoutes);
router.use('/departments', departmentRoutes);
router.use('/doctors', doctorRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/queue', queueRoutes);
router.use('/consultations', consultationRoutes);
router.use('/laboratory', labRoutes);
router.use('/journeys', journeyRoutes);
router.use('/notifications', notificationRoutes);

export default router;
