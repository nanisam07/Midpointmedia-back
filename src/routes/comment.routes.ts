import { Router } from 'express';
import { deleteComment } from '../controllers/comment.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/*
|--------------------------------------------------------------------------
| Comment Routes
|--------------------------------------------------------------------------
*/

// DELETE /api/comments/:id  — soft-delete a comment
router.delete('/:id', authenticate, deleteComment);

export default router;
