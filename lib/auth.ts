// lib/auth.ts
// FIX: Uses httpOnly SESSION cookies (no maxAge) so login
// disappears when the browser closes — NOT localStorage.

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import type { AuthUser } from "./types";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "changeme-min-32-chars-xxxxxxxxxxxxxxxxx"
);

export const COOKIE_NAME = "acs_session";

// ── Password helpers ──────────────────────────────────────────────────────────

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// ── JWT helpers ───────────────────────────────────────────────────────────────

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export async function createToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

// ── Session cookie ────────────────────────────────────────────────────────────
// KEY FIX: No `maxAge` → session cookie → cleared when browser closes.
// httpOnly → not accessible via JavaScript → safe from XSS.

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    // ← NO maxAge here: this makes it a session cookie.
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value ?? null;
}

export async function getSession(): Promise<TokenPayload | null> {
  const token = await getSessionToken();
  if (!token) return null;
  return verifyToken(token);
}

// ── Role helpers ──────────────────────────────────────────────────────────────

export function determineRole(graduationYear: number): "student" | "alumni" {
  const currentYear = new Date().getFullYear();
  return graduationYear < currentYear ? "alumni" : "student";
}

// ── Response helpers ──────────────────────────────────────────────────────────

export function unauthorized(message = "Unauthorized") {
  return Response.json({ success: false, error: message }, { status: 401 });
}

export function forbidden(message = "Forbidden") {
  return Response.json({ success: false, error: message }, { status: 403 });
}

export function badRequest(message: string) {
  return Response.json({ success: false, error: message }, { status: 400 });
}

export function serverError(message = "Internal server error") {
  return Response.json({ success: false, error: message }, { status: 500 });
}

export function ok<T>(data: T, status = 200) {
  return Response.json({ success: true, data }, { status });
}
