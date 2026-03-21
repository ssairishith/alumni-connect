// app/api/auth/me/route.ts
export const runtime = "nodejs";

import { sql } from "@/lib/db";
import { getSession, unauthorized, serverError, ok } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    const [user] = await sql`
      SELECT u.id, u.email, u.role, u.status, u.created_at,
             p.full_name, p.bio, p.current_company, p.job_role,
             p.graduation_year, p.skills, p.avatar_url, p.is_setup_complete
      FROM users u
      LEFT JOIN profiles p ON p.id = u.id
      WHERE u.id = ${session.userId}
    `;

    if (!user) return unauthorized("User not found");

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
    console.error("Me error:", err);
    return serverError();
  }
}
