import { Router } from 'express';
import {
  submitStory,
  getMySubmissions,
  getAllSubmissionsAdmin,
} from '../controllers/reporter.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/*
|--------------------------------------------------------------------------
| Reporter Submission Routes
|--------------------------------------------------------------------------
*/

// GET /api/reporter/submissions  — my submissions (requires authentication)
router.get('/submissions', authenticate, getMySubmissions);

// GET /api/reporter/submissions/all  — admin view of all submissions
router.get('/submissions/all', getAllSubmissionsAdmin);

// POST /api/reporter/submissions  — create submission (requires authentication)
router.post('/submissions', authenticate, submitStory);

export default router;
