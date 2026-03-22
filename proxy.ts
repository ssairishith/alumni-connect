// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "changeme-min-32-chars-xxxxxxxxxxxxxxxxx"
);

const PROTECTED_API_PREFIXES = [
  "/api/posts",
  "/api/profile",
  "/api/chat",
  "/api/mentorship",
  "/api/notifications",
  "/api/alumni",
  "/api/resume",
  "/api/admin",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect specific API routes
  const isProtected = PROTECTED_API_PREFIXES.some((p) =>
    pathname.startsWith(p)
  );
  if (!isProtected) return NextResponse.next();

  const token = request.cookies.get("acs_session")?.value;
  if (!token) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { payload } = await jwtVerify(token, SECRET);

    // Admin-only routes
    if (pathname.startsWith("/api/admin") && payload.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // Clone request with user info in headers for API routes
    const headers = new Headers(request.headers);
    headers.set("x-user-id", payload.userId as string);
    headers.set("x-user-role", payload.role as string);
    headers.set("x-user-email", payload.email as string);

    return NextResponse.next({ request: { headers } });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid session" }, { status: 401 });
  }
}

export const config = {
  matcher: ["/api/:path*"],
};
