import { NextResponse } from "next/server";
import { pool } from "../../../lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, name, email, password, role } = body;

    // 1. إنشاء حساب عميل جديد
    if (action === "register") {
      if (!name || !email || !password) {
        return NextResponse.json({ error: "جميع الحقول مطلوبة" }, { status: 400 });
      }

      const [existing]: any = await pool.execute("SELECT id FROM users WHERE email = ?", [email]);
      if (existing.length > 0) {
        return NextResponse.json({ error: "البريد الإلكتروني مستخدم بالفعل" }, { status: 400 });
      }

      const [result]: any = await pool.execute(
        "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'client')",
        [name, email, password]
      );

      return NextResponse.json({
        user: { id: result.insertId, name, email, role: "client" },
      });
    }

    // 2. إنشاء موظف/إداري جديد من لوحة التحكم
    if (action === "add_employee") {
      if (!name || !email || !password) {
        return NextResponse.json({ error: "جميع البيانات مطلوبة" }, { status: 400 });
      }

      const [existing]: any = await pool.execute("SELECT id FROM users WHERE email = ?", [email]);
      if (existing.length > 0) {
        return NextResponse.json({ error: "هذا البريد مضاف بالفعل" }, { status: 400 });
      }

      await pool.execute(
        "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'admin')",
        [name, email, password]
      );

      return NextResponse.json({ message: "تمت إضافة الموظف/الإداري بنجاح" });
    }

    // 3. تسجيل الدخول مع الفحص الصارم للصلاحية (Role Check)
    if (action === "login") {
      if (!email || !password) {
        return NextResponse.json({ error: "البريد وكلمة المرور مطلوبان" }, { status: 400 });
      }

      // أ) حساب الأدمن الرئيسي Master Admin
      if (email === "waleed100149@gmail.com" && password === "waleed100149") {
        if (role === "client") {
          return NextResponse.json({ error: "حساب الإدارة يجب الدخول به من بوابة الإدارة" }, { status: 403 });
        }
        return NextResponse.json({
          user: { id: 9999, name: "وليد (الإدارة)", email, role: "admin" },
        });
      }

      // ب) فحص بقية المستخدمين والموظفين في قاعدة البيانات
      const [rows]: any = await pool.execute(
        "SELECT id, name, email, role FROM users WHERE email = ? AND password = ?",
        [email, password]
      );

      if (rows.length === 0) {
        return NextResponse.json({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" }, { status: 401 });
      }

      const dbUser = rows[0];

      // التأكد من أن نوع الحساب يطابق البوابة التي يدخل منها
      if (role === "admin" && dbUser.role !== "admin") {
        return NextResponse.json({ error: "غير مصرح لك بالدخول من بوابة الإدارة" }, { status: 403 });
      }

      if (role === "client" && dbUser.role === "admin") {
        return NextResponse.json({ error: "حساب الإدارة يجب الدخول به من بوابة الإدارة" }, { status: 403 });
      }

      return NextResponse.json({ user: dbUser });
    }

    return NextResponse.json({ error: "إجراء غير صالح" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}