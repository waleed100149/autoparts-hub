import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

// 1. جلب الطلبات الخاصة (للإدارة أو لعميل معين)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");

    let query = "SELECT * FROM custom_requests ORDER BY created_at DESC";
    let params: any[] = [];

    if (userId) {
      query = "SELECT * FROM custom_requests WHERE user_id = ? ORDER BY created_at DESC";
      params = [userId];
    }

    const [rows] = await pool.query(query, params);
    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 2. إرسال طلب قطعة غير متوفرة من العميل
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user_id, user_name, user_email, part_name, make, model, year, vin, notes } = body;

    await pool.query(
      "INSERT INTO custom_requests (user_id, user_name, user_email, part_name, make, model, year, vin, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'قيد النظر')",
      [user_id, user_name, user_email, part_name, make, model, year || null, vin || null, notes || null]
    );

    return NextResponse.json({ message: "تم إرسال طلبك بنجاح وسنقوم بالرد عليك قريباً!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 3. رد الموظف/الإدارة على الطلب وتحديث الحالة تلقائياً
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { request_id, status, admin_reply } = body;

    // تحديد الحالة: إذا اختار الموظف حالة أو كتب رداً يتم تحديد الحالة المناسبة
    let updatedStatus = status;
    if (!updatedStatus || updatedStatus === "قيد النظر") {
      updatedStatus = admin_reply && admin_reply.trim() !== "" ? "تم الرد" : "قيد النظر";
    }

    await pool.query(
      "UPDATE custom_requests SET status = ?, admin_reply = ? WHERE id = ?",
      [updatedStatus, admin_reply || null, request_id]
    );

    return NextResponse.json({ message: "تم تحديث الرد والحالة بنجاح" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}