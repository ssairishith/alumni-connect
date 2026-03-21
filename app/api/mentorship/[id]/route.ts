// app/api/mentorship/[id]/route.ts
export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { badRequest, forbidden, serverError, ok } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = request.headers.get("x-user-id")!;
    const body = await request.json();
    const { status } = body;

    if (!["accepted", "rejected"].includes(status)) {
      return badRequest("Status must be 'accepted' or 'rejected'");
    }

    // Verify ownership
    const [req] = await sql`
      SELECT id, student_id, alumni_id FROM mentorship_requests WHERE id = ${id}
    `;
    if (!req) return badRequest("Request not found");
    if (req.alumni_id !== userId) return forbidden();

    await sql`
      UPDATE mentorship_requests SET status = ${status} WHERE id = ${id}
    `;

    // Notify student
    const [alumniProfile] = await sql`SELECT full_name FROM profiles WHERE id = ${userId}`;
    await sql`
      INSERT INTO notifications (user_id, type, content, related_id)
      VALUES (
        ${req.student_id},
        'mentorship_response',
        ${`${alumniProfile?.full_name ?? "An alumni"} ${status} your mentorship request`},
        ${id}
      )
    `;

    return ok({ status });
  } catch (err) {
    console.error("Mentorship update error:", err);
    return serverError();
  }
}
