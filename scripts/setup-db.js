require("dotenv").config({ path: ".env.local" });
const { Client } = require("pg");
const bcrypt = require("bcryptjs");

async function setup() {
  if (!process.env.DATABASE_URL) {
    console.error("❌  DATABASE_URL is not set in .env.local");
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  console.log("✅  Connected to NeonDB");

  console.log("📦  Running schema...");

  await client.query(`
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    CREATE TABLE IF NOT EXISTS users (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email         VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role          VARCHAR(50) NOT NULL DEFAULT 'student',
      status        VARCHAR(50) NOT NULL DEFAULT 'active',
      created_at    TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS profiles (
      id                UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      full_name         VARCHAR(255),
      bio               TEXT,
      current_company   VARCHAR(255),
      job_role          VARCHAR(255),
      graduation_year   INTEGER,
      skills            TEXT[] DEFAULT '{}',
      avatar_url        TEXT,
      is_setup_complete BOOLEAN DEFAULT FALSE,
      created_at        TIMESTAMPTZ DEFAULT NOW(),
      updated_at        TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS posts (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      author_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      channel    VARCHAR(100) NOT NULL,
      title      VARCHAR(500) NOT NULL,
      content    TEXT NOT NULL,
      deadline   DATE,
      status     VARCHAR(50) NOT NULL DEFAULT 'approved',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_posts_channel_status ON posts(channel, status);
    CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
    CREATE INDEX IF NOT EXISTS idx_posts_deadline ON posts(deadline);

    CREATE TABLE IF NOT EXISTS post_reactions (
      user_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      post_id  UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      reaction VARCHAR(10) NOT NULL CHECK (reaction IN ('like', 'dislike')),
      PRIMARY KEY (user_id, post_id)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      post_id    UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      author_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content    TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);

    CREATE TABLE IF NOT EXISTS chat_messages (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      sender_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content    TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_chat_created ON chat_messages(created_at);

    CREATE TABLE IF NOT EXISTS mentorship_requests (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      alumni_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      message    TEXT,
      status     VARCHAR(50) NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(student_id, alumni_id)
    );

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

    CREATE TABLE IF NOT EXISTS audit_logs (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      admin_id    UUID REFERENCES users(id),
      action      VARCHAR(255) NOT NULL,
      target_type VARCHAR(100),
      target_id   UUID,
      details     TEXT,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE OR REPLACE FUNCTION delete_expired_posts()
    RETURNS void AS $$
    BEGIN
      DELETE FROM posts
      WHERE deadline IS NOT NULL
        AND deadline < CURRENT_DATE
        AND status = 'approved';
    END;
    $$ LANGUAGE plpgsql;
  `);

  console.log("✅  Schema applied.");

  const adminEmail = process.env.ADMIN_EMAIL || "admin@college.edu";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123456";

  const existing = await client.query(
    "SELECT id FROM users WHERE email = $1",
    [adminEmail]
  );

  if (existing.rows.length > 0) {
    console.log(`ℹ️   Admin already exists: ${adminEmail}`);
  } else {
    const hash = await bcrypt.hash(adminPassword, 12);
    const userRes = await client.query(
      "INSERT INTO users (email, password_hash, role, status) VALUES ($1, $2, 'admin', 'active') RETURNING id",
      [adminEmail, hash]
    );
    const userId = userRes.rows[0].id;
    await client.query(
      "INSERT INTO profiles (id, full_name, is_setup_complete) VALUES ($1, 'Administrator', true)",
      [userId]
    );
    console.log(`✅  Admin created: ${adminEmail} / ${adminPassword}`);
  }

  await client.end();
  console.log("\n🚀  Database setup complete! You can now run: npm run dev");
}

setup().catch((e) => {
  console.error("Setup failed:", e.message);
  process.exit(1);
});