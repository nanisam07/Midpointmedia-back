import pool from '../config/database';

// ============================================================
// COMMENTS
// ============================================================

export interface CreateCommentInput {
  newsId:    string;
  userId:    string;
  text:      string;
}

/**
 * Get comments for an article (non-deleted, newest first)
 */
export const getCommentsByNewsId = async (newsId: string) => {
  const result = await pool.query(
    `SELECT
       c.id,
       c.news_id,
       c.user_id,
       c.comment_text,
       c.created_at,
       c.updated_at,
       u.name   AS author_name,
       u.profile_image AS author_avatar
     FROM comments c
     LEFT JOIN users u ON u.id = c.user_id
     WHERE c.news_id = $1
       AND c.is_deleted = false
     ORDER BY c.created_at ASC`,
    [newsId]
  );
  return result.rows;
};

/**
 * Add a comment and increment comment_count
 */
export const addComment = async ({
  newsId,
  userId,
  text,
}: CreateCommentInput) => {
  const result = await pool.query(
    `INSERT INTO comments (news_id, user_id, comment_text)
     VALUES ($1, $2, $3)
     RETURNING id, news_id, user_id, comment_text, created_at`,
    [newsId, userId, text]
  );

  // Increment comment_count
  await pool.query(
    `UPDATE news_articles
     SET comment_count = comment_count + 1
     WHERE id = $1`,
    [newsId]
  );

  // Fetch with author info
  const withAuthor = await pool.query(
    `SELECT
       c.id,
       c.news_id,
       c.user_id,
       c.comment_text,
       c.created_at,
       u.name AS author_name,
       u.profile_image AS author_avatar
     FROM comments c
     LEFT JOIN users u ON u.id = c.user_id
     WHERE c.id = $1`,
    [result.rows[0].id]
  );

  return withAuthor.rows[0];
};

/**
 * Soft-delete a comment and decrement comment_count
 */
export const softDeleteComment = async (
  commentId: string,
  requestingUserId?: string
) => {
  // Verify ownership if userId provided
  if (requestingUserId) {
    const check = await pool.query(
      `SELECT id, news_id FROM comments WHERE id = $1 AND user_id = $2 AND is_deleted = false`,
      [commentId, requestingUserId]
    );
    if (check.rows.length === 0) return null;

    const newsId = check.rows[0].news_id;
    await pool.query(
      `UPDATE comments SET is_deleted = true, updated_at = NOW() WHERE id = $1`,
      [commentId]
    );
    await pool.query(
      `UPDATE news_articles
       SET comment_count = GREATEST(0, comment_count - 1)
       WHERE id = $1`,
      [newsId]
    );
    return { id: commentId };
  }

  // No userId — allow (for admin)
  const check = await pool.query(
    `SELECT id, news_id FROM comments WHERE id = $1 AND is_deleted = false`,
    [commentId]
  );
  if (check.rows.length === 0) return null;

  const newsId = check.rows[0].news_id;
  await pool.query(
    `UPDATE comments SET is_deleted = true, updated_at = NOW() WHERE id = $1`,
    [commentId]
  );
  await pool.query(
    `UPDATE news_articles
     SET comment_count = GREATEST(0, comment_count - 1)
     WHERE id = $1`,
    [newsId]
  );
  return { id: commentId };
};
