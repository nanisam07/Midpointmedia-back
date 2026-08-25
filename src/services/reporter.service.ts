import pool from '../config/database';

// ============================================================
// REPORTER SUBMISSIONS
// reporter_id is optional without auth — stored as null.
// When auth is added, pass userId from JWT.
// ============================================================

export interface CreateSubmissionInput {
  reporterId?: string;
  categoryId?: string;
  title:       string;
  description: string;
  location?:   string;
  imageUrl?:   string;
  videoUrl?:   string;
}

export const createSubmission = async (data: CreateSubmissionInput) => {
  const result = await pool.query(
    `INSERT INTO reporter_submissions
       (reporter_id, category_id, title, description, location, image_url, video_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      data.reporterId  || null,
      data.categoryId  || null,
      data.title,
      data.description,
      data.location    || null,
      data.imageUrl    || null,
      data.videoUrl    || null,
    ]
  );
  return result.rows[0];
};

export const getSubmissionsForReporter = async (reporterId?: string) => {
  if (!reporterId) return [];

  const result = await pool.query(
    `SELECT
       rs.id,
       rs.title,
       rs.description,
       rs.location,
       rs.image_url,
       rs.video_url,
       rs.status,
       rs.admin_notes,
       rs.created_at,
       rs.updated_at,
       c.name AS category_name
     FROM reporter_submissions rs
     LEFT JOIN categories c ON c.id = rs.category_id
     WHERE rs.reporter_id = $1
     ORDER BY rs.created_at DESC`,
    [reporterId]
  );
  return result.rows;
};

export const getAllSubmissions = async () => {
  const result = await pool.query(
    `SELECT
       rs.*,
       c.name AS category_name,
       u.name AS reporter_name
     FROM reporter_submissions rs
     LEFT JOIN categories c ON c.id = rs.category_id
     LEFT JOIN users u ON u.id = rs.reporter_id
     ORDER BY rs.created_at DESC`
  );
  return result.rows;
};

export const updateSubmissionStatus = async (
  id: string,
  status: 'pending' | 'approved' | 'rejected',
  adminNotes?: string,
  reviewedBy?: string
) => {
  const result = await pool.query(
    `UPDATE reporter_submissions
     SET status = $1,
         admin_notes = COALESCE($2, admin_notes),
         reviewed_by = COALESCE($3, reviewed_by),
         reviewed_at = NOW(),
         updated_at  = NOW()
     WHERE id = $4
     RETURNING *`,
    [status, adminNotes || null, reviewedBy || null, id]
  );
  return result.rows[0] || null;
};
