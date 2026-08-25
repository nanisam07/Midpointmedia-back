import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import {
  getCommentsByNewsId,
  addComment,
  softDeleteComment,
} from '../services/comment.service';

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
// GET /api/news/:id/comments
// ============================================================

export const getComments = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    if (!isValidUUID(id)) {
      return res.status(400).json({ success: false, message: 'Invalid news ID' });
    }

    const comments = await getCommentsByNewsId(id);
    return res.status(200).json({ success: true, count: comments.length, data: comments });
  } catch (error) {
    console.error('Get comments error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch comments' });
  }
};

// ============================================================
// POST /api/news/:id/comments
// Body: { text: string }
// Header: X-User-Id (required for posting)
// ============================================================

export const postComment = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    if (!isValidUUID(id)) {
      return res.status(400).json({ success: false, message: 'Invalid news ID' });
    }

    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to post comments',
      });
    }

    const text = (req.body.text || req.body.comment_text || req.body.content || '').trim();
    if (!text) {
      return res.status(400).json({ success: false, message: 'Comment text is required' });
    }

    const comment = await addComment({ newsId: id, userId, text });
    return res.status(201).json({ success: true, data: comment });
  } catch (error) {
    console.error('Post comment error:', error);
    return res.status(500).json({ success: false, message: 'Failed to post comment' });
  }
};

// ============================================================
// DELETE /api/comments/:id
// ============================================================

export const deleteComment = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    if (!isValidUUID(id)) {
      return res.status(400).json({ success: false, message: 'Invalid comment ID' });
    }

    const userId = getUserId(req);
    const result = await softDeleteComment(id, userId);

    if (!result) {
      return res.status(404).json({ success: false, message: 'Comment not found or already deleted' });
    }

    return res.status(200).json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    console.error('Delete comment error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete comment' });
  }
};
