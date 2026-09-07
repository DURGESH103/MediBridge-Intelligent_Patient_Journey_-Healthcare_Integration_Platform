import { Request, Response } from 'express';
import { notificationService } from './notification.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/ApiResponse';

export const notificationController = {
  listMyNotifications: asyncHandler(async (req: Request, res: Response) => {
    const { page, pageSize } = req.query as unknown as { page: number; pageSize: number };
    const notifications = await notificationService.listForUser(req.user!.userId, page, pageSize);
    sendSuccess(res, 200, 'Notifications retrieved successfully', notifications);
  }),

  getUnreadCount: asyncHandler(async (req: Request, res: Response) => {
    const count = await notificationService.getUnreadCount(req.user!.userId);
    sendSuccess(res, 200, 'Unread count retrieved successfully', { count });
  }),

  markRead: asyncHandler(async (req: Request, res: Response) => {
    await notificationService.markRead(Number(req.params.id), req.user!.userId);
    sendSuccess(res, 200, 'Notification marked as read');
  }),

  markAllRead: asyncHandler(async (req: Request, res: Response) => {
    await notificationService.markAllRead(req.user!.userId);
    sendSuccess(res, 200, 'All notifications marked as read');
  }),
};
