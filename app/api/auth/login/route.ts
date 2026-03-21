// app/api/auth/login/route.ts
export const runtime = "nodejs";

import { sql } from "@/lib/db";
import {
  verifyPassword,
  createToken,
  setSessionCookie,
  badRequest,
  unauthorized,
  serverError,
  ok,
} from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) return badRequest("Email and password required");

    const emailLower = email.toLowerCase().trim();

    const [user] = await sql`
      SELECT u.id, u.email, u.password_hash, u.role, u.status, u.created_at,
             p.full_name, p.bio, p.current_company, p.job_role,
             p.graduation_year, p.skills, p.avatar_url, p.is_setup_complete
      FROM users u
      LEFT JOIN profiles p ON p.id = u.id
      WHERE u.email = ${emailLower}
    `;

    if (!user) return unauthorized("Invalid email or password");

    const passwordValid = await verifyPassword(password, user.password_hash);
    if (!passwordValid) return unauthorized("Invalid email or password");

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
        full_name: user.full_name,
        bio: user.bio,
        current_company: user.current_company,
        job_role: user.job_role,
        graduation_year: user.graduation_year,
        skills: user.skills ?? [],
        avatar_url: user.avatar_url,
        is_setup_complete: user.is_setup_complete ?? false,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return serverError();
  }
}
