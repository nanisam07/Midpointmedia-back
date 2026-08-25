import pool from '../config/database';

import {
  CreateNewsInput,
  UpdateNewsInput,
} from '../models/news.model';

// ============================================================
// HELPERS
// ============================================================

/**
 * Base SELECT columns for a news article (public view)
 * Joins categories so Flutter can get category name directly.
 */
const NEWS_SELECT = `
  na.id,
  na.category_id,
  c.name AS category_name,
  na.author_id,
  na.headline,
  na.summary,
  na.content,
  na.image_url,
  na.source_name,
  na.location,
  na.status,
  na.is_breaking,
  na.is_trending,
  na.read_count,
  na.like_count,
  na.comment_count,
  na.share_count,
  na.published_at,
  na.created_at,
  na.updated_at
`;

// ============================================================
// QUERY: GET ALL NEWS (with pagination, search, filters)
// ============================================================

export interface GetNewsOptions {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;        // category slug or UUID
  breaking?: boolean;
  trending?: boolean;
}

export const getAllNews = async (opts: GetNewsOptions = {}) => {
  const page  = Math.max(1, opts.page  ?? 1);
  const limit = Math.min(100, Math.max(1, opts.limit ?? 10));
  const offset = (page - 1) * limit;

  const conditions: string[] = [`na.status = 'published'`];
  const params: unknown[]    = [];
  let   p                    = 1;

  if (opts.breaking === true) {
    conditions.push(`na.is_breaking = true`);
  }
  if (opts.trending === true) {
    conditions.push(`na.is_trending = true`);
  }
  if (opts.category) {
    // Accept UUID or slug
    conditions.push(
      `(c.slug = $${p} OR na.category_id::text = $${p})`
    );
    params.push(opts.category);
    p++;
  }
  if (opts.search && opts.search.trim()) {
    const term = `%${opts.search.trim()}%`;
    conditions.push(`(
      na.headline     ILIKE $${p} OR
      na.summary      ILIKE $${p} OR
      na.content      ILIKE $${p} OR
      na.location     ILIKE $${p} OR
      na.source_name  ILIKE $${p}
    )`);
    params.push(term);
    p++;
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  // Total count
  const countResult = await pool.query(
    `SELECT COUNT(*) FROM news_articles na
     LEFT JOIN categories c ON c.id = na.category_id
     ${where}`,
    params
  );
  const total = parseInt(countResult.rows[0].count, 10);

  // Data rows
  const dataResult = await pool.query(
    `SELECT ${NEWS_SELECT}
     FROM news_articles na
     LEFT JOIN categories c ON c.id = na.category_id
     ${where}
     ORDER BY na.published_at DESC NULLS LAST, na.created_at DESC
     LIMIT $${p} OFFSET $${p + 1}`,
    [...params, limit, offset]
  );

  return {
    data:       dataResult.rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

// ============================================================
// QUERY: ADMIN — GET ALL NEWS (all statuses)
// ============================================================

export const getAllNewsAdmin = async () => {
  const result = await pool.query(`
    SELECT ${NEWS_SELECT}
    FROM news_articles na
    LEFT JOIN categories c ON c.id = na.category_id
    ORDER BY na.created_at DESC
  `);
  return result.rows;
};

// ============================================================
// QUERY: SINGLE ARTICLE
// ============================================================

export const getNewsById = async (id: string) => {
  const result = await pool.query(
    `SELECT ${NEWS_SELECT}
     FROM news_articles na
     LEFT JOIN categories c ON c.id = na.category_id
     WHERE na.id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

// ============================================================
// MUTATION: CREATE
// ============================================================

export const createNews = async (data: CreateNewsInput) => {
  const status = data.status || 'published';

  const publishedAt =
    status === 'published'
      ? data.published_at || new Date().toISOString()
      : data.published_at || null;

  const result = await pool.query(
    `INSERT INTO news_articles (
      category_id,
      author_id,
      headline,
      summary,
      content,
      image_url,
      source_name,
      location,
      status,
      is_breaking,
      is_trending,
      published_at
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    RETURNING *`,
    [
      data.category_id || null,
      data.author_id   || null,
      data.headline,
      data.summary     || null,
      data.content,
      data.image_url   || null,
      data.source_name || null,
      data.location    || null,
      status,
      data.is_breaking || false,
      data.is_trending || false,
      publishedAt,
    ]
  );

  return result.rows[0];
};

// ============================================================
// MUTATION: UPDATE
// ============================================================

export const updateNews = async (
  id: string,
  data: UpdateNewsInput
) => {
  const result = await pool.query(
    `UPDATE news_articles
     SET
       category_id  = COALESCE($1,  category_id),
       author_id    = COALESCE($2,  author_id),
       headline     = COALESCE($3,  headline),
       summary      = COALESCE($4,  summary),
       content      = COALESCE($5,  content),
       image_url    = COALESCE($6,  image_url),
       source_name  = COALESCE($7,  source_name),
       location     = COALESCE($8,  location),
       status       = COALESCE($9,  status),
       is_breaking  = COALESCE($10, is_breaking),
       is_trending  = COALESCE($11, is_trending),
       published_at = COALESCE($12, published_at),
       updated_at   = CURRENT_TIMESTAMP
     WHERE id = $13
     RETURNING *`,
    [
      data.category_id,
      data.author_id,
      data.headline,
      data.summary,
      data.content,
      data.image_url,
      data.source_name,
      data.location,
      data.status,
      data.is_breaking,
      data.is_trending,
      data.published_at,
      id,
    ]
  );

  return result.rows[0] || null;
};

// ============================================================
// MUTATION: DELETE
// ============================================================

export const deleteNews = async (id: string) => {
  const result = await pool.query(
    `DELETE FROM news_articles WHERE id = $1 RETURNING id`,
    [id]
  );
  return result.rows[0] || null;
};

// ============================================================
// MUTATION: INCREMENT READ COUNT (also inserts news_views row)
// ============================================================

export const incrementReadCount = async (
  id: string,
  userId?: string,
  ipAddress?: string
) => {
  // Prevent double-counting: skip if viewed by same user in last 60 seconds
  if (userId) {
    const recent = await pool.query(
      `SELECT id FROM news_views
       WHERE news_id = $1
         AND user_id = $2
         AND viewed_at > NOW() - INTERVAL '60 seconds'
       LIMIT 1`,
      [id, userId]
    );
    if (recent.rows.length > 0) {
      // Return current count without incrementing
      const cur = await pool.query(
        `SELECT id, read_count FROM news_articles WHERE id = $1`,
        [id]
      );
      return cur.rows[0] || null;
    }
  }

  // Insert view record
  await pool.query(
    `INSERT INTO news_views (news_id, user_id, ip_address)
     VALUES ($1, $2, $3)`,
    [id, userId || null, ipAddress || null]
  );

  // Increment counter
  const result = await pool.query(
    `UPDATE news_articles
     SET read_count = read_count + 1
     WHERE id = $1
     RETURNING id, read_count`,
    [id]
  );

  return result.rows[0] || null;
};

// ============================================================
// LIKES
// ============================================================

export const addLike = async (newsId: string, userId: string) => {
  // Upsert to avoid duplicate error
  await pool.query(
    `INSERT INTO likes (news_id, user_id)
     VALUES ($1, $2)
     ON CONFLICT (news_id, user_id) DO NOTHING`,
    [newsId, userId]
  );

  const result = await pool.query(
    `UPDATE news_articles
     SET like_count = (
       SELECT COUNT(*) FROM likes WHERE news_id = $1
     )
     WHERE id = $1
     RETURNING id, like_count`,
    [newsId]
  );

  return result.rows[0] || null;
};

export const removeLike = async (newsId: string, userId: string) => {
  await pool.query(
    `DELETE FROM likes WHERE news_id = $1 AND user_id = $2`,
    [newsId, userId]
  );

  const result = await pool.query(
    `UPDATE news_articles
     SET like_count = (
       SELECT COUNT(*) FROM likes WHERE news_id = $1
     )
     WHERE id = $1
     RETURNING id, like_count`,
    [newsId]
  );

  return result.rows[0] || null;
};

export const getLikeStatus = async (newsId: string, userId: string) => {
  const result = await pool.query(
    `SELECT id FROM likes WHERE news_id = $1 AND user_id = $2 LIMIT 1`,
    [newsId, userId]
  );
  return result.rows.length > 0;
};

// ============================================================
// BOOKMARKS
// ============================================================

export const addBookmark = async (newsId: string, userId: string) => {
  await pool.query(
    `INSERT INTO bookmarks (news_id, user_id)
     VALUES ($1, $2)
     ON CONFLICT (news_id, user_id) DO NOTHING`,
    [newsId, userId]
  );

  const result = await pool.query(
    `SELECT ${NEWS_SELECT}
     FROM news_articles na
     LEFT JOIN categories c ON c.id = na.category_id
     WHERE na.id = $1`,
    [newsId]
  );

  return result.rows[0] || null;
};

export const removeBookmark = async (newsId: string, userId: string) => {
  const result = await pool.query(
    `DELETE FROM bookmarks WHERE news_id = $1 AND user_id = $2 RETURNING id`,
    [newsId, userId]
  );
  return result.rows[0] || null;
};

export const getUserBookmarks = async (userId: string) => {
  const result = await pool.query(
    `SELECT ${NEWS_SELECT}, b.created_at AS bookmarked_at
     FROM bookmarks b
     JOIN news_articles na ON na.id = b.news_id
     LEFT JOIN categories c ON c.id = na.category_id
     WHERE b.user_id = $1
     ORDER BY b.created_at DESC`,
    [userId]
  );
  return result.rows;
};

export const getBookmarkStatus = async (newsId: string, userId: string) => {
  const result = await pool.query(
    `SELECT id FROM bookmarks WHERE news_id = $1 AND user_id = $2 LIMIT 1`,
    [newsId, userId]
  );
  return result.rows.length > 0;
};

// ============================================================
// SHARES
// ============================================================

export const trackShare = async (
  newsId: string,
  userId?: string,
  platform?: string
) => {
  await pool.query(
    `INSERT INTO news_shares (news_id, user_id, platform)
     VALUES ($1, $2, $3)`,
    [newsId, userId || null, platform || null]
  );

  const result = await pool.query(
    `UPDATE news_articles
     SET share_count = share_count + 1
     WHERE id = $1
     RETURNING id, share_count`,
    [newsId]
  );

  return result.rows[0] || null;
};

// ============================================================
// LEGACY HELPERS (kept for backward compat)
// ============================================================

export const getBreakingNews = async () => {
  const { data } = await getAllNews({ breaking: true, limit: 20 });
  return data;
};

export const getTrendingNews = async () => {
  const { data } = await getAllNews({ trending: true, limit: 20 });
  return data;
};