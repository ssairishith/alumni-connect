export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { ok, serverError } from "@/lib/auth";

export async function GET(_request: NextRequest) {
  try {
    const users = await sql`
      SELECT u.id, u.email, u.role, u.status, u.created_at,
             p.full_name, p.current_company, p.job_role, p.graduation_year,
             p.skills, p.bio, p.is_setup_complete
      FROM users u
      LEFT JOIN profiles p ON p.id = u.id
      ORDER BY u.role, u.status, u.created_at DESC
    `;

    return ok(users);
  } catch (err) {
    console.error("Admin users error:", err);
    return serverError();
  }
}
