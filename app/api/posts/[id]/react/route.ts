// app/api/posts/[id]/react/route.ts
export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { badRequest, serverError, ok } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    const userId = request.headers.get("x-user-id")!;
    const body = await request.json();
    const { reaction } = body;

    if (!["like", "dislike"].includes(reaction)) {
      return badRequest("Reaction must be 'like' or 'dislike'");
    }

    // Check existing reaction
    const [existing] = await sql`
      SELECT reaction FROM post_reactions
      WHERE user_id = ${userId} AND post_id = ${postId}
    `;

    if (existing) {
      if (existing.reaction === reaction) {
        // Toggle off (remove reaction)
        await sql`
          DELETE FROM post_reactions
          WHERE user_id = ${userId} AND post_id = ${postId}
        `;
      } else {
        // Switch reaction
        await sql`
          UPDATE post_reactions SET reaction = ${reaction}
          WHERE user_id = ${userId} AND post_id = ${postId}
        `;
      }
    } else {
      // New reaction
      await sql`
        INSERT INTO post_reactions (user_id, post_id, reaction)
        VALUES (${userId}, ${postId}, ${reaction})
      `;
    }

    // Return updated counts
    const [counts] = await sql`
      SELECT
        SUM(CASE WHEN reaction = 'like' THEN 1 ELSE 0 END)::int AS like_count,
        SUM(CASE WHEN reaction = 'dislike' THEN 1 ELSE 0 END)::int AS dislike_count,
        MAX(CASE WHEN user_id = ${userId} THEN reaction END) AS user_reaction
      FROM post_reactions
      WHERE post_id = ${postId}
    `;

    return ok(counts);
  } catch (err) {
    console.error("React error:", err);
    return serverError();
  }
}
