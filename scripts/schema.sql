-- ==========================================
-- Alumni Chatspace - NeonDB Schema
-- Run this once to initialize the database
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- USERS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role        VARCHAR(50) NOT NULL DEFAULT 'student',
  -- roles: student | alumni | faculty | admin
  status      VARCHAR(50) NOT NULL DEFAULT 'active',
  -- statuses: active | pending (faculty awaiting verification)
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- PROFILES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS profiles (
  id              UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  full_name       VARCHAR(255),
  bio             TEXT,
  current_company VARCHAR(255),
  job_role        VARCHAR(255),
  graduation_year INTEGER,
  skills          TEXT[] DEFAULT '{}',
  avatar_url      TEXT,
  is_setup_complete BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- POSTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS posts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel    VARCHAR(100) NOT NULL,
  -- channels: announcements | internships | hackathons | general-chat
  title      VARCHAR(500) NOT NULL,
  content    TEXT NOT NULL,
  deadline   DATE,
  status     VARCHAR(50) NOT NULL DEFAULT 'approved',
  -- statuses: approved | pending (alumni posts need admin approval)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_channel_status ON posts(channel, status);
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_deadline ON posts(deadline);

-- ==========================================
-- POST REACTIONS TABLE (likes/dislikes per user)
-- ==========================================
CREATE TABLE IF NOT EXISTS post_reactions (
  user_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id  UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  reaction VARCHAR(10) NOT NULL CHECK (reaction IN ('like', 'dislike')),
  PRIMARY KEY (user_id, post_id)
);

-- ==========================================
-- COMMENTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS comments (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id   UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content   TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);

-- ==========================================
-- CHAT MESSAGES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_created ON chat_messages(created_at);

-- ==========================================
-- MENTORSHIP REQUESTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS mentorship_requests (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  alumni_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message    TEXT,
  status     VARCHAR(50) NOT NULL DEFAULT 'pending',
  -- statuses: pending | accepted | rejected
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, alumni_id)
);

-- ==========================================
-- NOTIFICATIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       VARCHAR(100) NOT NULL,
  content    TEXT NOT NULL,
  is_read    BOOLEAN DEFAULT FALSE,
  related_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);

-- ==========================================
-- AUDIT LOGS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id    UUID REFERENCES users(id),
  action      VARCHAR(255) NOT NULL,
  target_type VARCHAR(100),
  target_id   UUID,
  details     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- AUTO-DELETE EXPIRED POSTS FUNCTION
-- (Optional: run as cron or check on fetch)
-- ==========================================
CREATE OR REPLACE FUNCTION delete_expired_posts()
RETURNS void AS $$
BEGIN
  DELETE FROM posts
  WHERE deadline IS NOT NULL
    AND deadline <= CURRENT_DATE
    AND status = 'approved';
END;
$$ LANGUAGE plpgsql;
