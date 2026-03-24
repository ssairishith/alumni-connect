export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getSession, badRequest, unauthorized, serverError, ok } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    const conversations = await sql`
      SELECT dc.id, dc.initiator_id, dc.recipient_id, dc.created_at,
             u.id as user_id, u.role as user_role, p.full_name as user_name
      FROM direct_conversations dc
      JOIN users u ON (u.id = CASE WHEN dc.initiator_id = ${session.userId} THEN dc.recipient_id ELSE dc.initiator_id END)
      LEFT JOIN profiles p ON p.id = u.id
      WHERE dc.initiator_id = ${session.userId} OR dc.recipient_id = ${session.userId}
      ORDER BY dc.created_at DESC
    `;

    return ok(conversations);
  } catch (err) {
    console.error("Direct conversations GET error:", err);
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    const body = await request.json();
    const otherUserId = body.other_user_id;

    if (!otherUserId) return badRequest("other_user_id is required");
    if (otherUserId === session.userId) return badRequest("Cannot start a conversation with yourself");

    const [otherUser] = await sql`SELECT id FROM users WHERE id = ${otherUserId}`;
    if (!otherUser) return badRequest("User not found");

    const [existing] = await sql`
      SELECT id FROM direct_conversations
      WHERE (initiator_id = ${session.userId} AND recipient_id = ${otherUserId})
         OR (initiator_id = ${otherUserId} AND recipient_id = ${session.userId})
      LIMIT 1
    `;

    if (existing) {
      return ok({ conversationId: existing.id });
    }

    const [created] = await sql`
      INSERT INTO direct_conversations (initiator_id, recipient_id)
      VALUES (${session.userId}, ${otherUserId})
      RETURNING id, initiator_id, recipient_id, created_at
    `;

    return ok({ conversationId: created.id });
  } catch (err) {
    console.error("Direct conversations POST error:", err);
    return serverError();
  }
}
