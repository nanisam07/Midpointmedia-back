import { Router } from 'express';

import {
  adminGetAllNews,
  adminCreateNews,
  adminUpdateNews,
  adminDeleteNews,
  adminGetCategories,
  adminCreateCategory,
  adminGetSubmissions,
} from '../controllers/admin.controller';

import {
  authenticate,
  authorizeAdmin,
} from '../middleware/auth.middleware';

const router = Router();

// Every admin API requires JWT + admin role
router.use(authenticate);
router.use(authorizeAdmin);

router.get('/news', adminGetAllNews);
router.post('/news', adminCreateNews);
router.put('/news/:id', adminUpdateNews);
router.delete('/news/:id', adminDeleteNews);

router.get('/categories', adminGetCategories);
router.post('/categories', adminCreateCategory);

router.get('/submissions', adminGetSubmissions);

export default router;