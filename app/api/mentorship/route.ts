// app/api/mentorship/route.ts
export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { badRequest, serverError, ok } from "@/lib/auth";

// GET /api/mentorship — get requests relevant to current user
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")!;
    const userRole = request.headers.get("x-user-role")!;

    let requests;
    if (userRole === "alumni") {
      // Alumni sees requests sent TO them
      requests = await sql`
        SELECT mr.id, mr.student_id, mr.alumni_id, mr.message, mr.status, mr.created_at,
               sp.full_name AS student_name,
               ap.full_name AS alumni_name,
               ap.current_company AS alumni_company
        FROM mentorship_requests mr
        JOIN profiles sp ON sp.id = mr.student_id
        JOIN profiles ap ON ap.id = mr.alumni_id
        WHERE mr.alumni_id = ${userId}
        ORDER BY mr.created_at DESC
      `;
    } else {
      // Students see requests they sent
      requests = await sql`
        SELECT mr.id, mr.student_id, mr.alumni_id, mr.message, mr.status, mr.created_at,
               sp.full_name AS student_name,
               ap.full_name AS alumni_name,
               ap.current_company AS alumni_company
        FROM mentorship_requests mr
        JOIN profiles sp ON sp.id = mr.student_id
        JOIN profiles ap ON ap.id = mr.alumni_id
        WHERE mr.student_id = ${userId}
        ORDER BY mr.created_at DESC
      `;
    }

    return ok(requests);
  } catch (err) {
    console.error("Get mentorship error:", err);
    return serverError();
  }
}

// POST /api/mentorship — student sends request to alumni
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")!;
    const userRole = request.headers.get("x-user-role")!;

    if (userRole !== "student") {
      return badRequest("Only students can send mentorship requests");
    }

    const body = await request.json();
    const { alumni_id, message } = body;
    if (!alumni_id) return badRequest("alumni_id is required");

    // Check alumni exists
    const [alumni] = await sql`
      SELECT id FROM users WHERE id = ${alumni_id} AND role = 'alumni'
    `;
    if (!alumni) return badRequest("Alumni not found");

    // Check for existing request
    const [existing] = await sql`
      SELECT id, status FROM mentorship_requests
      WHERE student_id = ${userId} AND alumni_id = ${alumni_id}
    `;
    if (existing) {
      return badRequest(`You already have a ${existing.status} request with this alumni`);
    }

    const [req] = await sql`
      INSERT INTO mentorship_requests (student_id, alumni_id, message)
      VALUES (${userId}, ${alumni_id}, ${message ?? null})
      RETURNING id, student_id, alumni_id, message, status, created_at
    `;

    // Notify alumni
    const [studentProfile] = await sql`SELECT full_name FROM profiles WHERE id = ${userId}`;
    await sql`
      INSERT INTO notifications (user_id, type, content, related_id)
      VALUES (
        ${alumni_id},
        'mentorship_request',
        ${`${studentProfile?.full_name ?? "A student"} sent you a mentorship request`},
        ${req.id}
      )
    `;

    return ok(req, 201);
  } catch (err) {
    console.error("Create mentorship error:", err);
    return serverError();
  }
}
