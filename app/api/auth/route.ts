import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { pool, ensureDB } from "@/lib/db";
import { HttpError, createSession, destroySession, getSessionUser, handleError, requireAdmin } from "@/lib/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateAccount(name: unknown, email: unknown, password: unknown) {
  const cleanName = String(name ?? "").trim();
  const cleanEmail = String(email ?? "").trim().toLowerCase();
  const cleanPassword = String(password ?? "");
  if (!cleanName || !cleanEmail || !cleanPassword) throw new HttpError(400, "جميع الحقول مطلوبة");
  if (!EMAIL_RE.test(cleanEmail)) throw new HttpError(400, "البريد الإلكتروني غير صالح");
  if (cleanPassword.length < 6) throw new HttpError(400, "كلمة المرور يجب أن تكون 6 أحرف على الأقل");
  return { name: cleanName, email: cleanEmail, password: cleanPassword };
}

async function createUser(name: string, email: string, password: string, role: "client" | "admin") {
  const [existing]: any = await pool.execute("SELECT id FROM users WHERE email = ?", [email]);
  if (existing.length > 0) throw new HttpError(400, "البريد الإلكتروني مستخدم بالفعل");

  const hash = await bcrypt.hash(password, 10);
  const [result]: any = await pool.execute("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)", [
    name,
    email,
    hash,
    role,
  ]);
  return { id: result.insertId as number, name, email, role };
}

/** المستخدم الحالي (بدل الاعتماد على localStorage) */
export async function GET() {
  try {
    const user = await getSessionUser();
    return NextResponse.json({ user });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: Request) {
  try {
    await ensureDB();
    const body = await req.json();
    const { action } = body;

    // 1. إنشاء حساب عميل جديد
    if (action === "register") {
      const { name, email, password } = validateAccount(body.name, body.email, body.password);
      const user = await createUser(name, email, password, "client");
      await createSession(user.id);
      return NextResponse.json({ user });
    }

    // 2. إضافة موظف/إداري — للأدمن فقط
    if (action === "add_employee") {
      await requireAdmin();
      const { name, email, password } = validateAccount(body.name, body.email, body.password);
      await createUser(name, email, password, "admin");
      return NextResponse.json({ message: "تمت إضافة الموظف/الإداري بنجاح" });
    }

    // 3. تسجيل الدخول
    if (action === "login") {
      const email = String(body.email ?? "").trim().toLowerCase();
      const password = String(body.password ?? "");
      if (!email || !password) throw new HttpError(400, "البريد وكلمة المرور مطلوبان");

      const [rows]: any = await pool.execute("SELECT id, name, email, role, password FROM users WHERE email = ?", [email]);
      const dbUser = rows[0];

      let valid = false;
      if (dbUser) {
        if (String(dbUser.password).startsWith("$2")) {
          valid = await bcrypt.compare(password, dbUser.password);
        } else if (dbUser.password === password) {
          // حساب قديم كلمة مروره محفوظة كنص — نشفّرها الآن
          valid = true;
          await pool.execute("UPDATE users SET password = ? WHERE id = ?", [await bcrypt.hash(password, 10), dbUser.id]);
        }
      }
      if (!valid) throw new HttpError(401, "البريد الإلكتروني أو كلمة المرور غير صحيحة");

      // التأكد من أن نوع الحساب يطابق البوابة التي يدخل منها
      if (body.role === "admin" && dbUser.role !== "admin") {
        throw new HttpError(403, "غير مصرح لك بالدخول من بوابة الإدارة");
      }
      if (body.role === "client" && dbUser.role === "admin") {
        throw new HttpError(403, "حساب الإدارة يجب الدخول به من بوابة الإدارة");
      }

      await createSession(dbUser.id);
      // لا نرجّع كلمة المرور للمتصفح
      const user = { id: dbUser.id, name: dbUser.name, email: dbUser.email, role: dbUser.role };
      return NextResponse.json({ user });
    }

    // 4. تسجيل الخروج
    if (action === "logout") {
      await destroySession();
      return NextResponse.json({ message: "تم تسجيل الخروج" });
    }

    throw new HttpError(400, "إجراء غير صالح");
  } catch (error) {
    return handleError(error);
  }
}
