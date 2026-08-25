import pool from '../config/database';

// ============================================================
// CATEGORIES
// ============================================================

export const getAllCategories = async () => {
  const result = await pool.query(
    `SELECT id, name, slug, icon, display_order, is_active, created_at
     FROM categories
     WHERE is_active = true
     ORDER BY display_order ASC, name ASC`
  );
  return result.rows;
};

export const getCategoryBySlug = async (slug: string) => {
  const result = await pool.query(
    `SELECT id, name, slug, icon, display_order, is_active
     FROM categories
     WHERE slug = $1`,
    [slug]
  );
  return result.rows[0] || null;
};

export const createCategory = async (data: {
  name: string;
  slug: string;
  icon?: string;
  display_order?: number;
}) => {
  const result = await pool.query(
    `INSERT INTO categories (name, slug, icon, display_order)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [data.name, data.slug, data.icon || null, data.display_order ?? 0]
  );
  return result.rows[0];
};
