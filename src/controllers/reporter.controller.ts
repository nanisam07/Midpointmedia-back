import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import {
  createSubmission,
  getSubmissionsForReporter,
  getAllSubmissions,
} from '../services/reporter.service';

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
// POST /api/reporter/submissions
// ============================================================

export const submitStory = async (req: Request, res: Response) => {
  try {
    const { title, description, location, category_id, image_url, video_url } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, message: 'Description is required' });
    }

    const userId = getUserId(req);

    // Handle uploaded file if present
    let finalImageUrl = image_url;
    if ((req as any).file) {
      // When upload middleware is configured, use file path
      finalImageUrl = (req as any).file.path || image_url;
    }

    const submission = await createSubmission({
      reporterId:  userId,
      categoryId:  category_id || null,
      title:       title.trim(),
      description: description.trim(),
      location:    location || null,
      imageUrl:    finalImageUrl || null,
      videoUrl:    video_url || null,
    });

    return res.status(201).json({
      success: true,
      message: 'Submission created successfully',
      data:    submission,
    });
  } catch (error) {
    console.error('Submit story error:', error);
    return res.status(500).json({ success: false, message: 'Failed to submit story' });
  }
};

// ============================================================
// GET /api/reporter/submissions
// ============================================================

export const getMySubmissions = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const submissions = await getSubmissionsForReporter(userId);
    return res.status(200).json({
      success: true,
      count:   submissions.length,
      data:    submissions,
    });
  } catch (error) {
    console.error('Get submissions error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch submissions' });
  }
};

// ============================================================
// GET /api/reporter/submissions/all  (admin)
// ============================================================

export const getAllSubmissionsAdmin = async (req: Request, res: Response) => {
  try {
    const submissions = await getAllSubmissions();
    return res.status(200).json({
      success: true,
      count:   submissions.length,
      data:    submissions,
    });
  } catch (error) {
    console.error('Get all submissions error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch submissions' });
  }
};
