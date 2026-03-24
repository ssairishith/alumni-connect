import type { OverviewResponse, OverviewWeeklyData, OverviewActiveUser, UserRole } from "@/lib/types";
import { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { ok, serverError } from "@/lib/auth";

function buildDaySeries(rows: OverviewWeeklyData[], lastDays: string[]) {
  const map = new Map(rows.map((r) => [r.day, r.count]));
  return lastDays.map((day) => ({ day, count: map.get(day) ?? 0 }));
}

export async function GET(_request: NextRequest) {
  try {
    const now = await sql`SELECT NOW() AS now`;
    const today = now[0]?.now;
    const last7 = await sql`
      SELECT to_char(d::date, 'YYYY-MM-DD') AS day
      FROM generate_series((NOW() - INTERVAL '6 days')::date, NOW()::date, INTERVAL '1 day') AS d
    `;
    const days = last7.map((row) => row.day as string);

    const usersCounts = await sql`
      SELECT role, COUNT(*)::int AS count
      FROM users
      GROUP BY role
    ` as { role: string; count: number }[];

    const statusCounts = await sql`
      SELECT status, COUNT(*)::int AS count
      FROM users
      GROUP BY status
    ` as { status: string; count: number }[];

    const weeklyPosts = await sql`
      SELECT to_char(created_at, 'YYYY-MM-DD') AS day, COUNT(*)::int AS count
      FROM posts
      WHERE created_at >= NOW() - INTERVAL '6 days'
      GROUP BY day
      ORDER BY day
    ` as OverviewWeeklyData[];

    const weeklyChat = await sql`
      SELECT to_char(created_at, 'YYYY-MM-DD') AS day, COUNT(*)::int AS count
      FROM chat_messages
      WHERE created_at >= NOW() - INTERVAL '6 days'
      GROUP BY day
      ORDER BY day
    ` as OverviewWeeklyData[];

    const weeklyMentorship = await sql`
      SELECT to_char(created_at, 'YYYY-MM-DD') AS day, COUNT(*)::int AS count
      FROM mentorship_requests
      WHERE created_at >= NOW() - INTERVAL '6 days'
      GROUP BY day
      ORDER BY day
    ` as OverviewWeeklyData[];

    const activeUsers = await sql`
      SELECT u.id, u.email, u.role, p.full_name,
             COALESCE(ps.count, 0) + COALESCE(cm.count, 0) + COALESCE(ch.count, 0) AS activity_score
      FROM users u
      LEFT JOIN profiles p ON p.id = u.id
      LEFT JOIN (
        SELECT author_id, COUNT(*)::int AS count
        FROM posts
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY author_id
      ) ps ON ps.author_id = u.id
      LEFT JOIN (
        SELECT author_id, COUNT(*)::int AS count
        FROM comments
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY author_id
      ) cm ON cm.author_id = u.id
      LEFT JOIN (
        SELECT sender_id, COUNT(*)::int AS count
        FROM chat_messages
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY sender_id
      ) ch ON ch.sender_id = u.id
      ORDER BY activity_score DESC
      LIMIT 8
    ` as OverviewActiveUser[];

    const totalPosts = await sql`SELECT COUNT(*)::int AS count FROM posts`;
    const totalPendingPosts = await sql`SELECT COUNT(*)::int AS count FROM posts WHERE status = 'pending'`;

    const totals = {
      students: usersCounts.find((x) => x.role === "student")?.count ?? 0,
      alumni: usersCounts.find((x) => x.role === "alumni")?.count ?? 0,
      faculty: usersCounts.find((x) => x.role === "faculty")?.count ?? 0,
      admins: usersCounts.find((x) => x.role === "admin")?.count ?? 0,
      activeUsers: statusCounts.find((x) => x.status === "active")?.count ?? 0,
      pendingFaculty: statusCounts.find((x) => x.status === "pending")?.count ?? 0,
      totalPosts: totalPosts[0]?.count ?? 0,
      pendingPosts: totalPendingPosts[0]?.count ?? 0,
    };

    const weeklyActivity = {
      posts: buildDaySeries(weeklyPosts, days),
      chat: buildDaySeries(weeklyChat, days),
      mentorship: buildDaySeries(weeklyMentorship, days),
    };

    return ok<OverviewResponse>({ totals, weeklyActivity, activeUsers });
  } catch (err) {
    console.error("Admin overview error:", err);
    return serverError();
  }
}

