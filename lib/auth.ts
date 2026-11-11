import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { pool, ensureDB } from "./db";

export type Role = "client" | "admin";
export interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: Role;
}

const COOKIE_NAME = "aph_session";
const MAX_AGE = 60 * 60 * 24 * 7; // أسبوع

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET غير مضبوط أو أقصر من 32 حرف");
    }
    // للتطوير المحلي فقط
    return new TextEncoder().encode("dev-only-secret-change-me-dev-only-secret");
  }
  return new TextEncoder().encode(secret);
}

/** خطأ له كود HTTP — يُرمى داخل الـ API ويتحول لرد مناسب في handleError */
export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function createSession(userId: number) {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(userId))
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(getSecret());

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true, // جافاسكربت في المتصفح ما يقدر يقرأه
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/** يرجع المستخدم الحالي من قاعدة البيانات (عشان لو انحذف أو تغيّرت صلاحيته يتطبق فوراً) */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  let userId: number;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    userId = Number(payload.sub);
    if (!userId) return null;
  } catch {
    return null;
  }

  await ensureDB();
  const [rows]: any = await pool.query("SELECT id, name, email, role FROM users WHERE id = ?", [userId]);
  return rows[0] ?? null;
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new HttpError(401, "يجب تسجيل الدخول أولاً");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "admin") throw new HttpError(403, "غير مصرح لك بهذا الإجراء");
  return user;
}

/** يحوّل أي خطأ لرد JSON — بدون كشف تفاصيل قاعدة البيانات للمستخدم */
export function handleError(error: unknown) {
  if (error instanceof HttpError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof SyntaxError) {
    return NextResponse.json({ error: "بيانات الطلب غير صالحة" }, { status: 400 });
  }
  console.error(error);
  return NextResponse.json({ error: "حدث خطأ في الخادم، حاول مرة أخرى" }, { status: 500 });
}
