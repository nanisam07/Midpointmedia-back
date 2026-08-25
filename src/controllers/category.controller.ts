import { Request, Response } from 'express';
import { getAllCategories, createCategory } from '../services/category.service';

// ============================================================
// GET /api/categories
// ============================================================

export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await getAllCategories();
    return res.status(200).json({
      success: true,
      count:   categories.length,
      data:    categories,
    });
  } catch (error) {
    console.error('Get categories error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
};

// ============================================================
// POST /api/categories  (admin)
// ============================================================

export const addCategory = async (req: Request, res: Response) => {
  try {
    const { name, slug, icon, display_order } = req.body;
    if (!name || !slug) {
      return res.status(400).json({ success: false, message: 'name and slug are required' });
    }

    const category = await createCategory({ name, slug, icon, display_order });
    return res.status(201).json({ success: true, data: category });
  } catch (error: any) {
    console.error('Add category error:', error);
    if (error.code === '23505') {
      return res.status(409).json({ success: false, message: 'Category with this slug already exists' });
    }
    return res.status(500).json({ success: false, message: 'Failed to create category' });
  }
};
