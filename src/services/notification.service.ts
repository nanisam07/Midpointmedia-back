import pool from '../config/database';

// ============================================================
// NOTIFICATIONS
// Notifications are user-scoped. Without auth, we return
// a generic list ordered by created_at.
// When auth is added, pass userId from the JWT token.
// ============================================================

export const getNotificationsForUser = async (userId?: string) => {
  if (!userId) {
    // Return empty list gracefully when not authenticated
    return [];
  }

  const result = await pool.query(
    `SELECT
       n.id,
       n.title,
       n.message,
       n.type,
       n.news_id,
       n.is_read,
       n.created_at
     FROM notifications n
     WHERE n.user_id = $1
     ORDER BY n.created_at DESC
     LIMIT 100`,
    [userId]
  );
  return result.rows;
};

export const markNotificationRead = async (
  notificationId: string,
  userId?: string
) => {
  const conditions = userId
    ? `id = $1 AND user_id = $2`
    : `id = $1`;
  const params = userId
    ? [notificationId, userId]
    : [notificationId];

  const result = await pool.query(
    `UPDATE notifications
     SET is_read = true
     WHERE ${conditions}
     RETURNING id, is_read`,
    params
  );
  return result.rows[0] || null;
};

export const markAllNotificationsRead = async (userId?: string) => {
  if (!userId) return { updated: 0 };

  const result = await pool.query(
    `UPDATE notifications
     SET is_read = true
     WHERE user_id = $1 AND is_read = false
     RETURNING id`,
    [userId]
  );
  return { updated: result.rowCount ?? 0 };
};

export const getUnreadCount = async (userId?: string) => {
  if (!userId) return 0;

  const result = await pool.query(
    `SELECT COUNT(*) FROM notifications
     WHERE user_id = $1 AND is_read = false`,
    [userId]
  );
  return parseInt(result.rows[0].count, 10);
};
