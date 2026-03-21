// app/api/chat/messages/route.ts
// FIX: Real-time chat via Server-Sent Events (SSE) polling.
// Each client polls every 2s - cheap, reliable, no WebSocket infra needed.
export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { badRequest, serverError, ok } from "@/lib/auth";

// GET /api/chat/messages?since=ISO_TIMESTAMP (or omit for last 50)
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return ok([]);

    const { searchParams } = new URL(request.url);
    const since = searchParams.get("since");

    let messages;
    if (since) {
      messages = await sql`
        SELECT m.id, m.sender_id, m.content, m.created_at,
               pr.full_name AS sender_name,
               u.role AS sender_role
        FROM chat_messages m
        JOIN users u ON u.id = m.sender_id
        LEFT JOIN profiles pr ON pr.id = m.sender_id
        WHERE m.created_at > ${since}
        ORDER BY m.created_at ASC
        LIMIT 100
      `;
    } else {
      messages = await sql`
        SELECT m.id, m.sender_id, m.content, m.created_at,
               pr.full_name AS sender_name,
               u.role AS sender_role
        FROM chat_messages m
        JOIN users u ON u.id = m.sender_id
        LEFT JOIN profiles pr ON pr.id = m.sender_id
        ORDER BY m.created_at DESC
        LIMIT 50
      `;
      messages = messages.reverse();
    }

    return ok(messages);
  } catch (err) {
    console.error("Get messages error:", err);
    return serverError();
  }
}

// POST /api/chat/messages
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")!;
    const body = await request.json();

    if (!body.content?.trim()) return badRequest("Message content required");

    const [msg] = await sql`
      INSERT INTO chat_messages (sender_id, content)
      VALUES (${userId}, ${body.content.trim()})
      RETURNING id, sender_id, content, created_at
    `;

    const [full] = await sql`
      SELECT m.id, m.sender_id, m.content, m.created_at,
             pr.full_name AS sender_name,
             u.role AS sender_role
      FROM chat_messages m
      JOIN users u ON u.id = m.sender_id
      LEFT JOIN profiles pr ON pr.id = m.sender_id
      WHERE m.id = ${msg.id}
    `;

    return ok(full, 201);
  } catch (err) {
    console.error("Send message error:", err);
    return serverError();
  }
}
