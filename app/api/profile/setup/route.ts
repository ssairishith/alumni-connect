// app/api/profile/setup/route.ts
export const runtime = "nodejs";

import { sql } from "@/lib/db";
import {
  getSession,
  createToken,
  setSessionCookie,
  determineRole,
  unauthorized,
  badRequest,
  serverError,
  ok,
} from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    const body = await request.json();
    const {
      full_name,
      bio,
      graduation_year,
      current_company,
      job_role,
      skills = [],
    } = body;

    if (!full_name) return badRequest("Full name is required");
    if (!graduation_year || isNaN(Number(graduation_year))) {
      return badRequest("Valid graduation year is required");
    }

    const year = Number(graduation_year);

    // Determine role from graduation year (only for non-faculty/admin)
    let newRole = session.role;
    if (session.role === "student" || session.role === "alumni") {
      newRole = determineRole(year);
    }

    // Update profile
    await sql`
      UPDATE profiles SET
        full_name = ${full_name},
        bio = ${bio ?? null},
        graduation_year = ${year},
        current_company = ${current_company ?? null},
        job_role = ${job_role ?? null},
        skills = ${skills},
        is_setup_complete = true,
        updated_at = NOW()
      WHERE id = ${session.userId}
    `;

    // Update user role if it changed
    if (newRole !== session.role) {
      await sql`
        UPDATE users SET role = ${newRole} WHERE id = ${session.userId}
      `;
    }

    // Re-issue token with possibly updated role
    const newToken = await createToken({
      userId: session.userId,
      email: session.email,
      role: newRole,
    });
    await setSessionCookie(newToken);

    return ok({ role: newRole, message: "Profile saved" });
  } catch (err) {
    console.error("Profile setup error:", err);
    return serverError();
  }
}
