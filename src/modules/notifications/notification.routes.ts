import { Router } from 'express';
import { notificationController } from './notification.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/authenticate';
import { listNotificationsSchema, notificationIdParamSchema } from './notification.validation';

const router = Router();

router.use(authenticate);

router.get('/', validate(listNotificationsSchema), notificationController.listMyNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.patch('/:id/read', validate(notificationIdParamSchema), notificationController.markRead);
router.patch('/read-all', notificationController.markAllRead);

export default router;
