// app/api/admin/faculty/list/route.ts
export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { serverError, ok } from "@/lib/auth";

export async function GET(_request: NextRequest) {
  try {
    const faculty = await sql`
      SELECT u.id, u.email, u.status, u.created_at,
             p.full_name
      FROM users u
      LEFT JOIN profiles p ON p.id = u.id
      WHERE u.role = 'faculty'
      ORDER BY
        CASE WHEN u.status = 'pending' THEN 0 ELSE 1 END,
        u.created_at DESC
    `;
    return ok(faculty);
  } catch (err) {
    console.error("List faculty error:", err);
    return serverError();
  }
}
