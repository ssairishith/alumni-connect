export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getSession, badRequest, unauthorized, serverError, ok } from "@/lib/auth";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const conversationId = (await params).id;
    const session = await getSession();
    if (!session) return unauthorized();

    // Ensure user belongs to this conversation
    const [conv] = await sql`
      SELECT id FROM direct_conversations
      WHERE id = ${conversationId}
        AND (${session.userId} IN (initiator_id, recipient_id))
    `;
    if (!conv) return unauthorized("Conversation not found");

    const messages = await sql`
      SELECT dm.id, dm.sender_id, dm.content, dm.created_at,
             u.role AS sender_role, p.full_name AS sender_name
      FROM direct_messages dm
      JOIN users u ON u.id = dm.sender_id
      LEFT JOIN profiles p ON p.id = dm.sender_id
      WHERE dm.conversation_id = ${conversationId}
      ORDER BY dm.created_at ASC
    `;

    return ok(messages);
  } catch (err) {
    console.error("Direct messages GET error:", err);
    return serverError();
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const conversationId = (await params).id;
    const session = await getSession();
    if (!session) return unauthorized();

    const body = await request.json();
    const content = body.content?.trim();
    if (!content) return badRequest("Message content required");

    const [conv] = await sql`
      SELECT id FROM direct_conversations
      WHERE id = ${conversationId}
        AND (${session.userId} IN (initiator_id, recipient_id))
    `;
    if (!conv) return unauthorized("Conversation not found");

    const [msg] = await sql`
      INSERT INTO direct_messages (conversation_id, sender_id, content)
      VALUES (${conversationId}, ${session.userId}, ${content})
      RETURNING id, sender_id, content, created_at
    `;

    const [full] = await sql`
      SELECT dm.id, dm.sender_id, dm.content, dm.created_at,
             u.role AS sender_role, p.full_name AS sender_name
      FROM direct_messages dm
      JOIN users u ON u.id = dm.sender_id
      LEFT JOIN profiles p ON p.id = dm.sender_id
      WHERE dm.id = ${msg.id}
    `;

    return ok(full, 201);
  } catch (err) {
    console.error("Direct messages POST error:", err);
    return serverError();
  }
}
