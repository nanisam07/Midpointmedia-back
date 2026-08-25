import { Request, Response } from 'express';
import {
  getAllNewsAdmin,
  createNews,
  updateNews,
  deleteNews,
} from '../services/news.service';
import {
  getAllCategories,
  createCategory,
} from '../services/category.service';
import {
  getAllSubmissions,
  updateSubmissionStatus,
} from '../services/reporter.service';

const isValidUUID = (value: string): boolean => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
};

// ============================================================
// GET /api/admin/news  — all news including drafts
// ============================================================

export const adminGetAllNews = async (req: Request, res: Response) => {
  try {
    const news = await getAllNewsAdmin();
    return res.status(200).json({ success: true, count: news.length, data: news });
  } catch (error) {
    console.error('Admin get news error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch news' });
  }
};

// ============================================================
// POST /api/admin/news  — create article
// ============================================================

export const adminCreateNews = async (req: Request, res: Response) => {
  try {
    const {
      category_id, author_id, headline, summary, content,
      image_url, source_name, location, status, is_breaking, is_trending, published_at,
    } = req.body;

    if (!headline?.trim())
      return res.status(400).json({ success: false, message: 'Headline is required' });
    if (!content?.trim())
      return res.status(400).json({ success: false, message: 'Content is required' });

    const news = await createNews({
      category_id, author_id,
      headline: headline.trim(),
      summary, content, image_url, source_name, location,
      status, is_breaking, is_trending, published_at,
    });

    return res.status(201).json({ success: true, data: news });
  } catch (error) {
    console.error('Admin create news error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create article' });
  }
};

// ============================================================
// PUT /api/admin/news/:id  — update article
// ============================================================

export const adminUpdateNews = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    if (!isValidUUID(id))
      return res.status(400).json({ success: false, message: 'Invalid news ID' });

    const news = await updateNews(id, req.body);
    if (!news)
      return res.status(404).json({ success: false, message: 'Article not found' });

    return res.status(200).json({ success: true, data: news });
  } catch (error) {
    console.error('Admin update news error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update article' });
  }
};

// ============================================================
// DELETE /api/admin/news/:id  — delete article
// ============================================================

export const adminDeleteNews = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    if (!isValidUUID(id))
      return res.status(400).json({ success: false, message: 'Invalid news ID' });

    const deleted = await deleteNews(id);
    if (!deleted)
      return res.status(404).json({ success: false, message: 'Article not found' });

    return res.status(200).json({ success: true, message: 'Article deleted successfully' });
  } catch (error) {
    console.error('Admin delete news error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete article' });
  }
};

// ============================================================
// GET /api/admin/categories
// ============================================================

export const adminGetCategories = async (req: Request, res: Response) => {
  try {
    const categories = await getAllCategories();
    return res.status(200).json({ success: true, count: categories.length, data: categories });
  } catch (error) {
    console.error('Admin get categories error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
};

// ============================================================
// POST /api/admin/categories
// ============================================================

export const adminCreateCategory = async (req: Request, res: Response) => {
  try {
    const { name, slug, icon, display_order } = req.body;
    if (!name || !slug)
      return res.status(400).json({ success: false, message: 'name and slug are required' });

    const category = await createCategory({ name, slug, icon, display_order });
    return res.status(201).json({ success: true, data: category });
  } catch (error: any) {
    console.error('Admin create category error:', error);
    if (error.code === '23505')
      return res.status(409).json({ success: false, message: 'Slug already exists' });
    return res.status(500).json({ success: false, message: 'Failed to create category' });
  }
};

// ============================================================
// GET /api/admin/submissions  — all reporter submissions
// ============================================================

export const adminGetSubmissions = async (req: Request, res: Response) => {
  try {
    const submissions = await getAllSubmissions();
    return res.status(200).json({ success: true, count: submissions.length, data: submissions });
  } catch (error) {
    console.error('Admin get submissions error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch submissions' });
  }
};

// ============================================================
// PUT /api/admin/submissions/:id  — review submission
// ============================================================

export const adminReviewSubmission = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    if (!isValidUUID(id))
      return res.status(400).json({ success: false, message: 'Invalid submission ID' });

    const { status, admin_notes, reviewed_by } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status))
      return res.status(400).json({ success: false, message: 'status must be pending, approved, or rejected' });

    const submission = await updateSubmissionStatus(id, status, admin_notes, reviewed_by);
    if (!submission)
      return res.status(404).json({ success: false, message: 'Submission not found' });

    return res.status(200).json({ success: true, data: submission });
  } catch (error) {
    console.error('Admin review submission error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update submission' });
  }
};
