// app/api/auth/logout/route.ts
export const runtime = "nodejs";
import { clearSessionCookie, ok } from "@/lib/auth";

export async function POST() {
  await clearSessionCookie();
  return ok({ message: "Logged out" });
}
