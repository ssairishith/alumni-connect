// app/api/notifications/route.ts
export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { serverError, ok } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")!;
    const notifications = await sql`
      SELECT id, user_id, type, content, is_read, related_id, created_at
      FROM notifications
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 50
    `;
    return ok(notifications);
  } catch (err) {
    console.error("Get notifications error:", err);
    return serverError();
  }
}
