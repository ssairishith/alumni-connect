// app/api/admin/logs/route.ts
export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { serverError, ok } from "@/lib/auth";

export async function GET(_request: NextRequest) {
  try {
    const logs = await sql`
      SELECT al.id, al.action, al.target_type, al.target_id,
             al.details, al.created_at,
             p.full_name AS admin_name
      FROM audit_logs al
      LEFT JOIN profiles p ON p.id = al.admin_id
      ORDER BY al.created_at DESC
      LIMIT 100
    `;
    return ok(logs);
  } catch (err) {
    console.error("Get audit logs error:", err);
    return serverError();
  }
}
