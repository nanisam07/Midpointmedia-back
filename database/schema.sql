-- ============================================================
-- MIDPOINT MEDIA DATABASE SCHEMA
-- PostgreSQL 18
-- ============================================================

-- ============================================================
-- EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================
-- ENUM TYPES
-- ============================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM (
            'user',
            'reporter',
            'admin'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'news_status') THEN
        CREATE TYPE news_status AS ENUM (
            'draft',
            'published',
            'archived'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'submission_status') THEN
        CREATE TYPE submission_status AS ENUM (
            'pending',
            'approved',
            'rejected'
        );
    END IF;
END
$$;


-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(100),
    phone VARCHAR(20) UNIQUE NOT NULL,

    password_hash TEXT,

    role user_role NOT NULL DEFAULT 'user',

    profile_image TEXT,

    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- CATEGORIES
-- ============================================================

CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(100) NOT NULL UNIQUE,

    slug VARCHAR(100) NOT NULL UNIQUE,

    icon TEXT,

    display_order INTEGER NOT NULL DEFAULT 0,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- NEWS ARTICLES
-- ============================================================

CREATE TABLE IF NOT EXISTS news_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,

    headline TEXT NOT NULL,
    summary TEXT,
    content TEXT NOT NULL,

    image_url TEXT,

    source_name VARCHAR(255),
    location VARCHAR(255),

    status VARCHAR(30) NOT NULL DEFAULT 'published'
        CHECK (status IN ('draft', 'published', 'archived')),

    is_breaking BOOLEAN NOT NULL DEFAULT FALSE,
    is_trending BOOLEAN NOT NULL DEFAULT FALSE,

    read_count INTEGER NOT NULL DEFAULT 0,
    like_count INTEGER NOT NULL DEFAULT 0,
    comment_count INTEGER NOT NULL DEFAULT 0,
    share_count INTEGER NOT NULL DEFAULT 0,

    published_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- COMMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    news_id UUID NOT NULL
        REFERENCES news_articles(id)
        ON DELETE CASCADE,

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    comment_text TEXT NOT NULL,

    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- LIKES
-- ============================================================

CREATE TABLE IF NOT EXISTS likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    news_id UUID NOT NULL
        REFERENCES news_articles(id)
        ON DELETE CASCADE,

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_news_like
        UNIQUE (news_id, user_id)
);


-- ============================================================
-- BOOKMARKS
-- ============================================================

CREATE TABLE IF NOT EXISTS bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    news_id UUID NOT NULL
        REFERENCES news_articles(id)
        ON DELETE CASCADE,

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_news_bookmark
        UNIQUE (news_id, user_id)
);


-- ============================================================
-- NEWS SHARES
-- ============================================================

CREATE TABLE IF NOT EXISTS news_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    news_id UUID NOT NULL
        REFERENCES news_articles(id)
        ON DELETE CASCADE,

    user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    platform VARCHAR(50),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,

    type VARCHAR(50) NOT NULL DEFAULT 'general',

    news_id UUID
        REFERENCES news_articles(id)
        ON DELETE CASCADE,

    is_read BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_news_category
    ON news_articles(category_id);

CREATE INDEX IF NOT EXISTS idx_news_author
    ON news_articles(author_id);

CREATE INDEX IF NOT EXISTS idx_news_status
    ON news_articles(status);

CREATE INDEX IF NOT EXISTS idx_news_published_at
    ON news_articles(published_at DESC);

CREATE INDEX IF NOT EXISTS idx_news_breaking
    ON news_articles(is_breaking);

CREATE INDEX IF NOT EXISTS idx_news_trending
    ON news_articles(is_trending);

CREATE INDEX IF NOT EXISTS idx_comments_news
    ON comments(news_id);

CREATE INDEX IF NOT EXISTS idx_comments_user
    ON comments(user_id);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user
    ON bookmarks(user_id);

CREATE INDEX IF NOT EXISTS idx_likes_news
    ON likes(news_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user
    ON notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_unread
    ON notifications(user_id, is_read);
    
-- ============================================================
-- NEWS ARTICLES
-- ============================================================

CREATE TABLE IF NOT EXISTS news_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    category_id UUID REFERENCES categories(id)
        ON DELETE SET NULL,

    title TEXT NOT NULL,

    summary TEXT,

    content TEXT,

    image_url TEXT,

    source_name VARCHAR(150) DEFAULT 'మిడ్‌పాయింట్ మీడియా',

    location VARCHAR(150),

    status news_status NOT NULL DEFAULT 'draft',

    is_breaking BOOLEAN NOT NULL DEFAULT FALSE,

    is_trending BOOLEAN NOT NULL DEFAULT FALSE,

    is_featured BOOLEAN NOT NULL DEFAULT FALSE,

    views BIGINT NOT NULL DEFAULT 0,

    likes BIGINT NOT NULL DEFAULT 0,

    comments_count BIGINT NOT NULL DEFAULT 0,

    shares BIGINT NOT NULL DEFAULT 0,

    published_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    created_by UUID REFERENCES users(id)
        ON DELETE SET NULL
);


-- ============================================================
-- BOOKMARKS
-- ============================================================

CREATE TABLE IF NOT EXISTS bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL REFERENCES users(id)
        ON DELETE CASCADE,

    news_id UUID NOT NULL REFERENCES news_articles(id)
        ON DELETE CASCADE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(user_id, news_id)
);


-- ============================================================
-- LIKES
-- ============================================================

CREATE TABLE IF NOT EXISTS likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL REFERENCES users(id)
        ON DELETE CASCADE,

    news_id UUID NOT NULL REFERENCES news_articles(id)
        ON DELETE CASCADE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(user_id, news_id)
);


-- ============================================================
-- COMMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL REFERENCES users(id)
        ON DELETE CASCADE,

    news_id UUID NOT NULL REFERENCES news_articles(id)
        ON DELETE CASCADE,

    comment TEXT NOT NULL,

    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- NEWS VIEWS
-- ============================================================

CREATE TABLE IF NOT EXISTS news_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    news_id UUID NOT NULL REFERENCES news_articles(id)
        ON DELETE CASCADE,

    user_id UUID REFERENCES users(id)
        ON DELETE SET NULL,

    ip_address INET,

    viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- REPORTER NEWS SUBMISSIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS reporter_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    reporter_id UUID NOT NULL REFERENCES users(id)
        ON DELETE CASCADE,

    category_id UUID REFERENCES categories(id)
        ON DELETE SET NULL,

    title TEXT NOT NULL,

    description TEXT NOT NULL,

    location VARCHAR(150),

    image_url TEXT,

    video_url TEXT,

    status submission_status NOT NULL DEFAULT 'pending',

    admin_notes TEXT,

    reviewed_by UUID REFERENCES users(id)
        ON DELETE SET NULL,

    reviewed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL REFERENCES users(id)
        ON DELETE CASCADE,

    title VARCHAR(200) NOT NULL,

    message TEXT NOT NULL,

    type VARCHAR(50),

    news_id UUID REFERENCES news_articles(id)
        ON DELETE CASCADE,

    is_read BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- OTP VERIFICATION
-- ============================================================

CREATE TABLE IF NOT EXISTS otp_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    phone VARCHAR(20) NOT NULL,

    otp_hash TEXT NOT NULL,

    expires_at TIMESTAMPTZ NOT NULL,

    attempts INTEGER NOT NULL DEFAULT 0,

    verified BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_news_status
ON news_articles(status);

CREATE INDEX IF NOT EXISTS idx_news_category
ON news_articles(category_id);

CREATE INDEX IF NOT EXISTS idx_news_published
ON news_articles(published_at DESC);

CREATE INDEX IF NOT EXISTS idx_news_trending
ON news_articles(is_trending);

CREATE INDEX IF NOT EXISTS idx_news_breaking
ON news_articles(is_breaking);

CREATE INDEX IF NOT EXISTS idx_news_location
ON news_articles(location);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user
ON bookmarks(user_id);

CREATE INDEX IF NOT EXISTS idx_likes_news
ON likes(news_id);

CREATE INDEX IF NOT EXISTS idx_comments_news
ON comments(news_id);

CREATE INDEX IF NOT EXISTS idx_views_news
ON news_views(news_id);

CREATE INDEX IF NOT EXISTS idx_submissions_status
ON reporter_submissions(status);

CREATE INDEX IF NOT EXISTS idx_submissions_reporter
ON reporter_submissions(reporter_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user
ON notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_otp_phone
ON otp_verifications(phone);


-- ============================================================
-- DEFAULT CATEGORIES
-- ============================================================

INSERT INTO categories (name, slug, display_order)
VALUES
    ('తెలంగాణ', 'telangana', 1),
    ('స్థానికం', 'local', 2),
    ('జాతీయం', 'national', 3),
    ('అంతర్జాతీయం', 'international', 4),
    ('రాజకీయాలు', 'politics', 5),
    ('సినిమా', 'cinema', 6),
    ('క్రీడలు', 'sports', 7),
    ('టెక్నాలజీ', 'technology', 8),
    ('వ్యాపారం', 'business', 9),
    ('విద్య', 'education', 10),
    ('ఆరోగ్యం', 'health', 11),
    ('లైఫ్‌స్టైల్', 'lifestyle', 12),
    ('పర్యావరణం', 'environment', 13)
ON CONFLICT (slug) DO NOTHING;


-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

DROP TRIGGER IF EXISTS update_users_updated_at
ON users;

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS update_news_updated_at
ON news_articles;

CREATE TRIGGER update_news_updated_at
BEFORE UPDATE ON news_articles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS update_comments_updated_at
ON comments;

CREATE TRIGGER update_comments_updated_at
BEFORE UPDATE ON comments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


DROP TRIGGER IF EXISTS update_submissions_updated_at
ON reporter_submissions;

CREATE TRIGGER update_submissions_updated_at
BEFORE UPDATE ON reporter_submissions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- COMPLETE
-- ============================================================