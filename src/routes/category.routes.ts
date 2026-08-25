import { Router } from 'express';
import { getCategories, addCategory } from '../controllers/category.controller';

const router = Router();

/*
|--------------------------------------------------------------------------
| Category Routes
|--------------------------------------------------------------------------
*/

// GET /api/categories  — all active categories
router.get('/', getCategories);

// POST /api/categories  — create category (admin)
router.post('/', addCategory);

export default router;
