import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

import {
  getAllNews,
  getAllNewsAdmin,
  getNewsById,
  createNews,
  updateNews,
  deleteNews,
  incrementReadCount,
  getBreakingNews,
  getTrendingNews,
  addLike,
  removeLike,
  getLikeStatus,
  addBookmark,
  removeBookmark,
  getBookmarkStatus,
  getUserBookmarks,
  trackShare,
} from '../services/news.service';

// ============================================================
// HELPERS
// ============================================================

const isValidUUID = (value: string): boolean => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
};

/**
 * Extract user ID from authenticated JWT req.user or X-User-Id header.
 */
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
// GET /api/news
// Supports: ?page=1&limit=10&search=q&category=slug&breaking=true&trending=true
// ============================================================

export const getNews = async (req: Request, res: Response) => {
  try {
    const page     = parseInt(req.query.page     as string) || 1;
    const limit    = parseInt(req.query.limit    as string) || 10;
    const search   = (req.query.search    as string) || undefined;
    const category = (req.query.category  as string) || undefined;
    const breaking = req.query.breaking === 'true' ? true : undefined;
    const trending = req.query.trending === 'true' ? true : undefined;

    const result = await getAllNews({
      page, limit, search, category, breaking, trending,
    });

    return res.status(200).json({
      success:    true,
      count:      result.data.length,
      total:      result.total,
      page:       result.page,
      limit:      result.limit,
      totalPages: result.totalPages,
      data:       result.data,
    });
  } catch (error) {
    console.error('Get news error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch news' });
  }
};

// ============================================================
// GET /api/news/admin/all
// ============================================================

export const getAdminNews = async (req: Request, res: Response) => {
  try {
    const news = await getAllNewsAdmin();
    return res.status(200).json({ success: true, count: news.length, data: news });
  } catch (error) {
    console.error('Get admin news error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch news' });
  }
};

// ============================================================
// GET /api/news/breaking  (legacy dedicated route)
// ============================================================

export const getBreaking = async (req: Request, res: Response) => {
  try {
    const news = await getBreakingNews();
    return res.status(200).json({ success: true, count: news.length, data: news });
  } catch (error) {
    console.error('Get breaking news error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch breaking news' });
  }
};

// ============================================================
// GET /api/news/trending  (legacy dedicated route)
// ============================================================

export const getTrending = async (req: Request, res: Response) => {
  try {
    const news = await getTrendingNews();
    return res.status(200).json({ success: true, count: news.length, data: news });
  } catch (error) {
    console.error('Get trending news error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch trending news' });
  }
};

// ============================================================
// GET /api/news/:id
// ============================================================

export const getSingleNews = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (typeof id !== 'string' || !isValidUUID(id)) {
      return res.status(400).json({ success: false, message: 'Invalid news ID' });
    }

    const userId  = getUserId(req);
    const news    = await getNewsById(id);

    if (!news) {
      return res.status(404).json({ success: false, message: 'News article not found' });
    }

    // Attach user-specific flags if userId is present
    if (userId) {
      news.is_liked      = await getLikeStatus(id, userId);
      news.is_bookmarked = await getBookmarkStatus(id, userId);
    } else {
      news.is_liked      = false;
      news.is_bookmarked = false;
    }

    return res.status(200).json({ success: true, data: news });
  } catch (error) {
    console.error('Get single news error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch news article' });
  }
};

// ============================================================
// POST /api/news
// ============================================================

export const addNews = async (req: Request, res: Response) => {
  try {
    const {
      category_id, author_id, headline, summary, content,
      image_url, source_name, location, status, is_breaking, is_trending, published_at,
    } = req.body;

    if (!headline || !headline.trim()) {
      return res.status(400).json({ success: false, message: 'Headline is required' });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Content is required' });
    }

    const news = await createNews({
      category_id, author_id,
      headline: headline.trim(),
      summary, content, image_url, source_name, location,
      status, is_breaking, is_trending, published_at,
    });

    return res.status(201).json({ success: true, message: 'News article created successfully', data: news });
  } catch (error) {
    console.error('Create news error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create news article' });
  }
};

// ============================================================
// PUT /api/news/:id
// ============================================================

export const editNews = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (typeof id !== 'string' || !isValidUUID(id)) {
      return res.status(400).json({ success: false, message: 'Invalid news ID' });
    }

    const news = await updateNews(id, req.body);
    if (!news) {
      return res.status(404).json({ success: false, message: 'News article not found' });
    }

    return res.status(200).json({ success: true, message: 'News article updated successfully', data: news });
  } catch (error) {
    console.error('Update news error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update news article' });
  }
};

// ============================================================
// DELETE /api/news/:id
// ============================================================

export const removeNews = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const newsId = Array.isArray(id) ? id[0] : id;
    if (!isValidUUID(newsId)) {
      return res.status(400).json({ success: false, message: 'Invalid news ID' });
    }

    const deleted = await deleteNews(newsId);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'News article not found' });
    }

    return res.status(200).json({ success: true, message: 'News article deleted successfully' });
  } catch (error) {
    console.error('Delete news error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete news article' });
  }
};

// ============================================================
// POST /api/news/:id/view  (replaces /read)
// ============================================================

export const addView = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (typeof id !== 'string' || !isValidUUID(id)) {
      return res.status(400).json({ success: false, message: 'Invalid news ID' });
    }

    const userId    = getUserId(req);
    const ipAddress = (req.headers['x-forwarded-for'] as string) ||
                      req.socket.remoteAddress;

    const result = await incrementReadCount(id, userId, ipAddress);
    if (!result) {
      return res.status(404).json({ success: false, message: 'News article not found' });
    }

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('Increment read count error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update read count' });
  }
};

// Legacy alias
export const addRead = addView;

// ============================================================
// POST /api/news/:id/like
// ============================================================

export const likeNews = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!isValidUUID(id)) {
      return res.status(400).json({ success: false, message: 'Invalid news ID' });
    }

    const userId = getUserId(req);
    if (!userId) {
      // Return current like_count without mutation (auth not available)
      const news = await getNewsById(id);
      if (!news) return res.status(404).json({ success: false, message: 'Not found' });
      return res.status(200).json({
        success:   true,
        message:   'Like recorded (anonymous)',
        data:      { id, like_count: news.like_count, is_liked: false },
      });
    }

    const result = await addLike(id, userId);
    if (!result) {
      return res.status(404).json({ success: false, message: 'News article not found' });
    }

    return res.status(200).json({
      success: true,
      data:    { ...result, is_liked: true },
    });
  } catch (error) {
    console.error('Like news error:', error);
    return res.status(500).json({ success: false, message: 'Failed to like article' });
  }
};

// ============================================================
// DELETE /api/news/:id/like
// ============================================================

export const unlikeNews = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!isValidUUID(id)) {
      return res.status(400).json({ success: false, message: 'Invalid news ID' });
    }

    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required to unlike' });
    }

    const result = await removeLike(id, userId);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Like not found' });
    }

    return res.status(200).json({
      success: true,
      data:    { ...result, is_liked: false },
    });
  } catch (error) {
    console.error('Unlike news error:', error);
    return res.status(500).json({ success: false, message: 'Failed to unlike article' });
  }
};

// ============================================================
// POST /api/news/:id/bookmark
// ============================================================

export const bookmarkNews = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!isValidUUID(id)) {
      return res.status(400).json({ success: false, message: 'Invalid news ID' });
    }

    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required to bookmark' });
    }

    const result = await addBookmark(id, userId);
    if (!result) {
      return res.status(404).json({ success: false, message: 'News article not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Bookmarked successfully',
      data:    { ...result, is_bookmarked: true },
    });
  } catch (error) {
    console.error('Bookmark news error:', error);
    return res.status(500).json({ success: false, message: 'Failed to bookmark article' });
  }
};

// ============================================================
// DELETE /api/news/:id/bookmark
// ============================================================

export const unbookmarkNews = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!isValidUUID(id)) {
      return res.status(400).json({ success: false, message: 'Invalid news ID' });
    }

    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required to remove bookmark' });
    }

    const result = await removeBookmark(id, userId);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Bookmark not found' });
    }

    return res.status(200).json({ success: true, message: 'Bookmark removed' });
  } catch (error) {
    console.error('Unbookmark news error:', error);
    return res.status(500).json({ success: false, message: 'Failed to remove bookmark' });
  }
};

// ============================================================
// GET /api/bookmarks
// ============================================================

export const getBookmarks = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }

    const bookmarks = await getUserBookmarks(userId);
    return res.status(200).json({ success: true, count: bookmarks.length, data: bookmarks });
  } catch (error) {
    console.error('Get bookmarks error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch bookmarks' });
  }
};

// ============================================================
// POST /api/news/:id/share
// ============================================================

export const shareNews = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!isValidUUID(id)) {
      return res.status(400).json({ success: false, message: 'Invalid news ID' });
    }

    const userId   = getUserId(req);
    const platform = req.body.platform as string | undefined;

    const result = await trackShare(id, userId, platform);
    if (!result) {
      return res.status(404).json({ success: false, message: 'News article not found' });
    }

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('Share news error:', error);
    return res.status(500).json({ success: false, message: 'Failed to track share' });
  }
};