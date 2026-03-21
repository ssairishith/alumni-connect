// app/api/posts/route.ts
export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { badRequest, serverError, ok } from "@/lib/auth";

// GET /api/posts?channel=internships
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    const { searchParams } = new URL(request.url);
    const channel = searchParams.get("channel");

    // Auto-delete expired posts first
    await sql`SELECT delete_expired_posts()`;

    let posts;
    if (channel) {
      posts = await sql`
        SELECT
          p.id, p.author_id, p.channel, p.title, p.content,
          p.deadline, p.status, p.created_at,
          pr.full_name AS author_name,
          u.role AS author_role,
          pr.current_company AS author_company,
          COUNT(DISTINCT c.id)::int AS comment_count,
          SUM(CASE WHEN r.reaction = 'like' THEN 1 ELSE 0 END)::int AS like_count,
          SUM(CASE WHEN r.reaction = 'dislike' THEN 1 ELSE 0 END)::int AS dislike_count,
          MAX(CASE WHEN r.user_id = ${userId} THEN r.reaction END) AS user_reaction
        FROM posts p
        JOIN users u ON u.id = p.author_id
        LEFT JOIN profiles pr ON pr.id = p.author_id
        LEFT JOIN comments c ON c.post_id = p.id
        LEFT JOIN post_reactions r ON r.post_id = p.id
        WHERE p.channel = ${channel} AND p.status = 'approved'
        GROUP BY p.id, pr.full_name, u.role, pr.current_company
        ORDER BY p.created_at DESC
      `;
    } else {
      // Admin view: all channels, all statuses
      const role = request.headers.get("x-user-role");
      if (role !== "admin") return badRequest("Channel required");

      posts = await sql`
        SELECT
          p.id, p.author_id, p.channel, p.title, p.content,
          p.deadline, p.status, p.created_at,
          pr.full_name AS author_name,
          u.role AS author_role,
          pr.current_company AS author_company,
          COUNT(DISTINCT c.id)::int AS comment_count,
          SUM(CASE WHEN r.reaction = 'like' THEN 1 ELSE 0 END)::int AS like_count,
          SUM(CASE WHEN r.reaction = 'dislike' THEN 1 ELSE 0 END)::int AS dislike_count,
          NULL AS user_reaction
        FROM posts p
        JOIN users u ON u.id = p.author_id
        LEFT JOIN profiles pr ON pr.id = p.author_id
        LEFT JOIN comments c ON c.post_id = p.id
        LEFT JOIN post_reactions r ON r.post_id = p.id
        GROUP BY p.id, pr.full_name, u.role, pr.current_company
        ORDER BY p.created_at DESC
      `;
    }

    return ok(posts);
  } catch (err) {
    console.error("Get posts error:", err);
    return serverError();
  }
}

// POST /api/posts
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")!;
    const userRole = request.headers.get("x-user-role")!;

    const body = await request.json();
    const { channel, title, content, deadline } = body;

    if (!channel || !title || !content) {
      return badRequest("Channel, title and content are required");
    }

    // Channel permission check
    if (channel === "announcements" && !["admin", "faculty"].includes(userRole)) {
      return badRequest("Only admins and faculty can post in announcements");
    }

    // Alumni posts require approval
    const status = userRole === "alumni" ? "pending" : "approved";

    const [post] = await sql`
      INSERT INTO posts (author_id, channel, title, content, deadline, status)
      VALUES (
        ${userId},
        ${channel},
        ${title},
        ${content},
        ${deadline || null},
        ${status}
      )
      RETURNING id, author_id, channel, title, content, deadline, status, created_at
    `;

    // If pending, notify all admins
    if (status === "pending") {
      const admins = await sql`SELECT id FROM users WHERE role = 'admin'`;
      for (const admin of admins) {
        await sql`
          INSERT INTO notifications (user_id, type, content, related_id)
          VALUES (
            ${admin.id},
            'pending_post',
            ${"New post pending approval: " + title},
            ${post.id}
          )
        `;
      }
    }

    // Log audit
    await sql`
      INSERT INTO audit_logs (admin_id, action, target_type, target_id, details)
      VALUES (${userId}, 'post_created', 'post', ${post.id}, ${`Channel: ${channel}, Status: ${status}`})
    `;

    return ok({ post, message: status === "pending" ? "Post submitted for approval" : "Post published" }, 201);
  } catch (err) {
    console.error("Create post error:", err);
    return serverError();
  }
}
