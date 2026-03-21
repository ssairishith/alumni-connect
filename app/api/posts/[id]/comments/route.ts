// app/api/posts/[id]/comments/route.ts
export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { badRequest, serverError, ok } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const comments = await sql`
      SELECT
        c.id, c.post_id, c.author_id, c.content, c.created_at,
        pr.full_name AS author_name,
        u.role AS author_role
      FROM comments c
      JOIN users u ON u.id = c.author_id
      LEFT JOIN profiles pr ON pr.id = c.author_id
      WHERE c.post_id = ${id}
      ORDER BY c.created_at ASC
    `;
    return ok(comments);
  } catch (err) {
    console.error("Get comments error:", err);
    return serverError();
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    const userId = request.headers.get("x-user-id")!;
    const body = await request.json();

    if (!body.content?.trim()) return badRequest("Comment content required");

    const [comment] = await sql`
      INSERT INTO comments (post_id, author_id, content)
      VALUES (${postId}, ${userId}, ${body.content.trim()})
      RETURNING id, post_id, author_id, content, created_at
    `;

    // Notify post author (if different from commenter)
    const [post] = await sql`SELECT author_id, title FROM posts WHERE id = ${postId}`;
    const [commenter] = await sql`SELECT full_name FROM profiles WHERE id = ${userId}`;

    if (post && post.author_id !== userId) {
      await sql`
        INSERT INTO notifications (user_id, type, content, related_id)
        VALUES (
          ${post.author_id},
          'comment',
          ${`${commenter?.full_name ?? "Someone"} commented on your post: "${post.title}"`},
          ${postId}
        )
      `;
    }

    // Fetch full comment with author info
    const [full] = await sql`
      SELECT c.id, c.post_id, c.author_id, c.content, c.created_at,
             pr.full_name AS author_name, u.role AS author_role
      FROM comments c
      JOIN users u ON u.id = c.author_id
      LEFT JOIN profiles pr ON pr.id = c.author_id
      WHERE c.id = ${comment.id}
    `;

    return ok(full, 201);
  } catch (err) {
    console.error("Create comment error:", err);
    return serverError();
  }
}
