// app/api/notifications/[id]/read/route.ts
export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { forbidden, serverError, ok } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = request.headers.get("x-user-id")!;

    const [notif] = await sql`SELECT user_id FROM notifications WHERE id = ${id}`;
    if (!notif || notif.user_id !== userId) return forbidden();

    await sql`UPDATE notifications SET is_read = true WHERE id = ${id}`;
    return ok({ read: true });
  } catch (err) {
    console.error("Mark notification read error:", err);
    return serverError();
  }
}
