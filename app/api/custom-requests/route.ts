import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

// 1. جلب الطلبات الخاصة
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");

    let query = "SELECT * FROM custom_requests";
    let params: any[] = [];

    if (userId) {
      query += " WHERE user_id = ?";
      params.push(userId);
    }

    query += " ORDER BY id DESC";

    const [rows] = await pool.query(query, params);
    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 2. إنشاء طلب قطعة غير متوفرة جديد من العميل
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user_id, user_name, user_email, part_name, make, model, year, vin, notes, category } = body;

    await pool.query(
      "INSERT INTO custom_requests (user_id, user_name, user_email, part_name, make, model, year, vin, notes, category, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'قيد النظر')",
      [
        user_id,
        user_name,
        user_email,
        part_name,
        make,
        model,
        year || null,
        vin || null,
        notes || null,
        category || "parts",
      ]
    );

    return NextResponse.json({ message: "تم إرسال طلبك الخاص بنجاح!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 3. رد الإدارة وتحديث حالة الطلب الخاص
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { request_id, status, admin_reply } = body;

    let updatedStatus = status;
    if (!updatedStatus || updatedStatus === "قيد النظر") {
      updatedStatus = admin_reply && admin_reply.trim() !== "" ? "تم الرد" : "قيد النظر";
    }

    await pool.query(
      "UPDATE custom_requests SET status = ?, admin_reply = ? WHERE id = ?",
      [updatedStatus, admin_reply || null, request_id]
    );

    return NextResponse.json({ message: "تم تحديث حالة الطلب والرد بنجاح!" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}