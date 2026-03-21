// scripts/setup-db.js
// Run with: node scripts/setup-db.js
// This will create all tables AND seed the first admin user.

require("dotenv").config({ path: ".env.local" });
const { neon } = require("@neondatabase/serverless");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

async function setup() {
  if (!process.env.DATABASE_URL) {
    console.error("❌  DATABASE_URL is not set in .env.local");
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  console.log("📦  Running schema...");
  const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");

  // Execute each statement (split on semicolons that end statements)
  const statements = schema
    .split(/;\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  for (const stmt of statements) {
    try {
      await sql.unsafe(stmt + ";");
    } catch (e) {
      // Ignore "already exists" errors
      if (!e.message.includes("already exists")) {
        console.error("Error:", e.message, "\n  Statement:", stmt.slice(0, 80));
      }
    }
  }
  console.log("✅  Schema applied.");

  // Seed admin
  const adminEmail = process.env.ADMIN_EMAIL || "admin@college.edu";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123456";

  const existing = await sql`SELECT id FROM users WHERE email = ${adminEmail}`;
  if (existing.length > 0) {
    console.log(`ℹ️   Admin already exists: ${adminEmail}`);
  } else {
    const hash = await bcrypt.hash(adminPassword, 12);
    const [user] = await sql`
      INSERT INTO users (email, password_hash, role, status)
      VALUES (${adminEmail}, ${hash}, 'admin', 'active')
      RETURNING id
    `;
    await sql`
      INSERT INTO profiles (id, full_name, is_setup_complete)
      VALUES (${user.id}, 'Administrator', true)
    `;
    console.log(`✅  Admin created: ${adminEmail} / ${adminPassword}`);
  }

  console.log("\n🚀  Database setup complete! You can now run: npm run dev");
}

setup().catch((e) => {
  console.error("Setup failed:", e);
  process.exit(1);
});
