// app/api/admin/posts/[id]/route.ts
export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { badRequest, serverError, ok } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adminId = request.headers.get("x-user-id")!;
    const body = await request.json();
    const { action } = body; // "approve" | "reject"

    if (!["approve", "reject"].includes(action)) {
      return badRequest("Action must be 'approve' or 'reject'");
    }

    const [post] = await sql`
      SELECT id, author_id, title, status FROM posts WHERE id = ${id}
    `;
    if (!post) return badRequest("Post not found");

    if (action === "approve") {
      await sql`UPDATE posts SET status = 'approved' WHERE id = ${id}`;
    } else {
      await sql`DELETE FROM posts WHERE id = ${id}`;
    }

    // Notify post author
    await sql`
      INSERT INTO notifications (user_id, type, content, related_id)
      VALUES (
        ${post.author_id},
        ${action === "approve" ? "post_approved" : "post_rejected"},
        ${`Your post "${post.title}" has been ${action === "approve" ? "approved and published" : "rejected by an admin"}`},
        ${post.id}
      )
    `;

    // Audit log
    await sql`
      INSERT INTO audit_logs (admin_id, action, target_type, target_id, details)
      VALUES (${adminId}, ${`post_${action}d`}, 'post', ${id}, ${post.title})
    `;

    return ok({ action, message: `Post ${action}d` });
  } catch (err) {
    console.error("Admin post action error:", err);
    return serverError();
  }
}
