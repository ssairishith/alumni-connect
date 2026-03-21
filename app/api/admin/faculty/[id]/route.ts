// app/api/admin/faculty/[id]/route.ts
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

    const [user] = await sql`
      SELECT id, email, role, status FROM users WHERE id = ${id} AND role = 'faculty'
    `;
    if (!user) return badRequest("Faculty member not found");

    if (action === "approve") {
      await sql`UPDATE users SET status = 'active' WHERE id = ${id}`;
      await sql`
        INSERT INTO notifications (user_id, type, content)
        VALUES (${id}, 'account_approved', 'Your faculty account has been approved. You can now log in.')
      `;
    } else {
      // Delete the account
      await sql`DELETE FROM users WHERE id = ${id}`;
    }

    // Audit log
    await sql`
      INSERT INTO audit_logs (admin_id, action, target_type, target_id, details)
      VALUES (${adminId}, ${`faculty_${action}d`}, 'user', ${id}, ${user.email})
    `;

    return ok({ action, message: `Faculty ${action}d` });
  } catch (err) {
    console.error("Admin faculty action error:", err);
    return serverError();
  }
}

// GET /api/admin/faculty — list pending faculty
export async function GET(request: NextRequest) {
  try {
    const faculty = await sql`
      SELECT u.id, u.email, u.status, u.created_at,
             p.full_name, p.graduation_year
      FROM users u
      LEFT JOIN profiles p ON p.id = u.id
      WHERE u.role = 'faculty'
      ORDER BY u.created_at DESC
    `;
    return ok(faculty);
  } catch (err) {
    console.error("Get faculty error:", err);
    return serverError();
  }
}
