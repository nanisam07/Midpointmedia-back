import { Router } from 'express';

import {
  getNews,
  getAdminNews,
  getSingleNews,
  addNews,
  editNews,
  removeNews,
  addView,
  addRead,
  getBreaking,
  getTrending,
  likeNews,
  unlikeNews,
  bookmarkNews,
  unbookmarkNews,
  getBookmarks,
  shareNews,
} from '../controllers/news.controller';

import {
  getComments,
  postComment,
} from '../controllers/comment.controller';

import {
  authenticate,
  optionalAuthenticate,
} from '../middleware/auth.middleware';

const router = Router();

/*
|--------------------------------------------------------------------------
| Public News Routes
|--------------------------------------------------------------------------
*/

// GET /api/news  — supports ?page, ?limit, ?search, ?category, ?breaking, ?trending
router.get('/', optionalAuthenticate, getNews);

// GET /api/news/breaking  — breaking news (legacy dedicated route)
router.get('/breaking', optionalAuthenticate, getBreaking);

// GET /api/news/trending  — trending news (legacy dedicated route)
router.get('/trending', optionalAuthenticate, getTrending);

// GET /api/news/bookmarks  — user's bookmarked articles (requires authentication)
router.get('/bookmarks', authenticate, getBookmarks);

// GET /api/news/:id  — single article
router.get('/:id', optionalAuthenticate, getSingleNews);

// POST /api/news/:id/view  — increment view count
router.post('/:id/view', optionalAuthenticate, addView);

// POST /api/news/:id/read  — legacy alias for view
router.post('/:id/read', optionalAuthenticate, addRead);

// POST /api/news/:id/like  — like article (requires authentication)
router.post('/:id/like', authenticate, likeNews);

// DELETE /api/news/:id/like  — unlike article (requires authentication)
router.delete('/:id/like', authenticate, unlikeNews);

// POST /api/news/:id/bookmark  — bookmark article (requires authentication)
router.post('/:id/bookmark', authenticate, bookmarkNews);

// DELETE /api/news/:id/bookmark  — remove bookmark (requires authentication)
router.delete('/:id/bookmark', authenticate, unbookmarkNews);

// POST /api/news/:id/share  — track share (optional authentication)
router.post('/:id/share', optionalAuthenticate, shareNews);

// GET /api/news/:id/comments  — get comments (public)
router.get('/:id/comments', getComments);

// POST /api/news/:id/comments  — post comment (requires authentication)
router.post('/:id/comments', authenticate, postComment);

/*
|--------------------------------------------------------------------------
| Admin News Routes (no auth guard yet — connect middleware later)
|--------------------------------------------------------------------------
*/

// GET /api/news/admin/all  — all articles including drafts
router.get('/admin/all', getAdminNews);

// POST /api/news  — create article
router.post('/', addNews);

// PUT /api/news/:id  — update article
router.put('/:id', editNews);

// DELETE /api/news/:id  — delete article
router.delete('/:id', removeNews);

export default router;