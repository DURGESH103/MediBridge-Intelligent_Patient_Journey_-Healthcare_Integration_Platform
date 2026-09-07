import { Router } from 'express';
import { notificationController } from './notification.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { UserRole } from '../../types/roles';
import { listNotificationsSchema, notificationIdParamSchema, sendGeneralNotificationSchema } from './notification.validation';

const router = Router();

router.use(authenticate);

router.get('/', validate(listNotificationsSchema), notificationController.listMyNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.patch('/:id/read', validate(notificationIdParamSchema), notificationController.markRead);
router.patch('/read-all', notificationController.markAllRead);
router.post(
  '/general',
  authorize(UserRole.ADMIN),
  validate(sendGeneralNotificationSchema),
  notificationController.sendGeneral
);

export default router;
