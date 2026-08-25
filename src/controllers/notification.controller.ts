import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import {
  getNotificationsForUser,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadCount,
} from '../services/notification.service';

const isValidUUID = (value: string): boolean => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
};

const getUserId = (req: Request): string | undefined => {
  const authReq = req as AuthenticatedRequest;
  if (authReq.user?.userId && isValidUUID(authReq.user.userId)) {
    return authReq.user.userId;
  }
  const header = req.headers['x-user-id'];
  const value  = Array.isArray(header) ? header[0] : header;
  if (value && isValidUUID(value)) return value;
  return undefined;
};

// ============================================================
// GET /api/notifications
// ============================================================

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId       = getUserId(req);
    const notifications = await getNotificationsForUser(userId);
    const unread       = await getUnreadCount(userId);

    return res.status(200).json({
      success:      true,
      count:        notifications.length,
      unread_count: unread,
      data:         notifications,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
};

// ============================================================
// POST /api/notifications/:id/read
// ============================================================

export const markRead = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    if (!isValidUUID(id)) {
      return res.status(400).json({ success: false, message: 'Invalid notification ID' });
    }

    const userId = getUserId(req);
    const result = await markNotificationRead(id, userId);

    if (!result) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('Mark notification read error:', error);
    return res.status(500).json({ success: false, message: 'Failed to mark notification as read' });
  }
};

// ============================================================
// POST /api/notifications/read-all
// ============================================================

export const markAllRead = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const result = await markAllNotificationsRead(userId);

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    return res.status(500).json({ success: false, message: 'Failed to mark all notifications as read' });
  }
};
