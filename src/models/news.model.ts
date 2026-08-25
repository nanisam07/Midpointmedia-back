export interface NewsArticle {
  id: string;
  category_id?: string | null;
  author_id?: string | null;

  headline: string;
  summary?: string | null;
  content: string;

  image_url?: string | null;
  source_name?: string | null;
  location?: string | null;

  status: 'draft' | 'published' | 'archived';

  is_breaking: boolean;
  is_trending: boolean;

  read_count: number;
  like_count: number;
  comment_count: number;
  share_count: number;

  published_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateNewsInput {
  category_id?: string | null;
  author_id?: string | null;

  headline: string;
  summary?: string | null;
  content: string;

  image_url?: string | null;
  source_name?: string | null;
  location?: string | null;

  status?: 'draft' | 'published' | 'archived';

  is_breaking?: boolean;
  is_trending?: boolean;

  published_at?: string | null;
}

export interface UpdateNewsInput {
  category_id?: string | null;
  author_id?: string | null;

  headline?: string;
  summary?: string | null;
  content?: string;

  image_url?: string | null;
  source_name?: string | null;
  location?: string | null;

  status?: 'draft' | 'published' | 'archived';

  is_breaking?: boolean;
  is_trending?: boolean;

  published_at?: string | null;
}