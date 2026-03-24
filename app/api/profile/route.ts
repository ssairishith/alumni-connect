export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getSession, badRequest, unauthorized, serverError, ok } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get("user_id") ?? session.userId;

    const [row] = await sql`
      SELECT u.id, u.email, u.role, u.status, u.created_at,
             p.full_name, p.bio, p.current_company, p.job_role, p.graduation_year,
             p.skills, p.avatar_url, p.is_setup_complete
      FROM users u
      LEFT JOIN profiles p ON p.id = u.id
      WHERE u.id = ${targetUserId}
    `;

    if (!row) return badRequest("User not found");

    const isSelf = targetUserId === session.userId;

    // Public profile fields for others, private fields for self
    const publicProfile = {
      id: row.id,
      email: isSelf ? row.email : undefined,
      role: row.role,
      status: row.status,
      full_name: row.full_name ?? null,
      bio: row.bio ?? null,
      current_company: row.current_company ?? null,
      job_role: row.job_role ?? null,
      graduation_year: row.graduation_year,
      skills: row.skills ?? [],
      avatar_url: row.avatar_url ?? null,
      is_setup_complete: row.is_setup_complete ?? false,
      created_at: row.created_at,
    };

    return ok({ user: publicProfile, isSelf });
  } catch (err) {
    console.error("Profile GET error:", err);
    return serverError();
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    const body = await request.json();
    const {
      full_name,
      bio,
      current_company,
      job_role,
      graduation_year,
      skills,
      avatar_url,
    } = body;

    if (full_name != null && !full_name.trim()) {
      return badRequest("Full name cannot be empty");
    }

    await sql`
      INSERT INTO profiles (id, full_name, bio, current_company, job_role, graduation_year, skills, avatar_url, is_setup_complete, updated_at)
      VALUES (
        ${session.userId},
        ${full_name ?? null},
        ${bio ?? null},
        ${current_company ?? null},
        ${job_role ?? null},
        ${graduation_year ?? null},
        ${Array.isArray(skills) ? skills : []},
        ${avatar_url ?? null},
        TRUE,
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        bio = EXCLUDED.bio,
        current_company = EXCLUDED.current_company,
        job_role = EXCLUDED.job_role,
        graduation_year = EXCLUDED.graduation_year,
        skills = EXCLUDED.skills,
        avatar_url = EXCLUDED.avatar_url,
        is_setup_complete = TRUE,
        updated_at = NOW()
    `;

    return ok({ message: "Profile updated" });
  } catch (err) {
    console.error("Profile PATCH error:", err);
    return serverError();
  }
}
