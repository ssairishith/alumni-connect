// app/api/auth/signup/route.ts
export const runtime = "nodejs";

import { sql } from "@/lib/db";
import {
  hashPassword,
  createToken,
  setSessionCookie,
  badRequest,
  serverError,
  ok,
} from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, isFaculty = false } = body;

    if (!email || !password) return badRequest("Email and password required");
    if (password.length < 6) return badRequest("Password must be at least 6 characters");

    const emailLower = email.toLowerCase().trim();

    // Check if user already exists
    const existing = await sql`
      SELECT id FROM users WHERE email = ${emailLower}
    `;
    if (existing.length > 0) return badRequest("Email already registered");

    const passwordHash = await hashPassword(password);
    const role = isFaculty ? "faculty" : "student";
    const status = isFaculty ? "pending" : "active";

    // Create user
    const [user] = await sql`
      INSERT INTO users (email, password_hash, role, status)
      VALUES (${emailLower}, ${passwordHash}, ${role}, ${status})
      RETURNING id, email, role, status, created_at
    `;

    // Create empty profile
    await sql`
      INSERT INTO profiles (id, is_setup_complete)
      VALUES (${user.id}, false)
    `;

    const token = await createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
    await setSessionCookie(token);

    return ok({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        created_at: user.created_at,
      },
      profile: {
        id: user.id,
        full_name: null,
        bio: null,
        current_company: null,
        job_role: null,
        graduation_year: null,
        skills: [],
        avatar_url: null,
        is_setup_complete: false,
      },
    }, 201);
  } catch (err) {
    console.error("Signup error:", err);
    return serverError();
  }
}
