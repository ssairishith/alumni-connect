// app/api/alumni/route.ts
export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { serverError, ok } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")!;
    const { searchParams } = new URL(request.url);
    const company = searchParams.get("company");
    const skill = searchParams.get("skill");

    let alumni;
    if (company) {
      alumni = await sql`
        SELECT p.id, p.full_name, p.current_company, p.job_role,
               p.graduation_year, p.skills, p.bio,
               mr.status AS request_status
        FROM profiles p
        JOIN users u ON u.id = p.id
        LEFT JOIN mentorship_requests mr
          ON mr.alumni_id = p.id AND mr.student_id = ${userId}
        WHERE u.role = 'alumni' AND u.status = 'active'
          AND p.is_setup_complete = true
          AND LOWER(p.current_company) LIKE LOWER(${`%${company}%`})
        ORDER BY p.full_name ASC
      `;
    } else if (skill) {
      alumni = await sql`
        SELECT p.id, p.full_name, p.current_company, p.job_role,
               p.graduation_year, p.skills, p.bio,
               mr.status AS request_status
        FROM profiles p
        JOIN users u ON u.id = p.id
        LEFT JOIN mentorship_requests mr
          ON mr.alumni_id = p.id AND mr.student_id = ${userId}
        WHERE u.role = 'alumni' AND u.status = 'active'
          AND p.is_setup_complete = true
          AND ${skill} = ANY(p.skills)
        ORDER BY p.full_name ASC
      `;
    } else {
      alumni = await sql`
        SELECT p.id, p.full_name, p.current_company, p.job_role,
               p.graduation_year, p.skills, p.bio,
               mr.status AS request_status
        FROM profiles p
        JOIN users u ON u.id = p.id
        LEFT JOIN mentorship_requests mr
          ON mr.alumni_id = p.id AND mr.student_id = ${userId}
        WHERE u.role = 'alumni' AND u.status = 'active'
          AND p.is_setup_complete = true
        ORDER BY p.full_name ASC
      `;
    }

    return ok(alumni);
  } catch (err) {
    console.error("Get alumni error:", err);
    return serverError();
  }
}
