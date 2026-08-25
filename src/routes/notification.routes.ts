import { Router } from 'express';
import {
  getNotifications,
  markRead,
  markAllRead,
} from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/*
|--------------------------------------------------------------------------
| Notification Routes
|--------------------------------------------------------------------------
*/

// GET /api/notifications
router.get('/', authenticate, getNotifications);

// POST /api/notifications/read-all  — must come before /:id
router.post('/read-all', authenticate, markAllRead);

// POST /api/notifications/:id/read
router.post('/:id/read', authenticate, markRead);

export default router;
