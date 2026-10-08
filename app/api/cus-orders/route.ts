import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

// 1. جلب الطلبات (للإدارة: جميع الطلبات | للعميل: طلباته فقط)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");

    let query = "SELECT * FROM orders ORDER BY created_at DESC";
    let params: any[] = [];

    if (userId) {
      query = "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC";
      params = [userId];
    }

    const [rows] = await pool.query(query, params);
    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 2. إنشاء طلب جديد عند الشراء من السلة
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user_id, user_name, user_email, total_price, items } = body;

    const itemsSummary = items
      .map((i: any) => `${i.part_name} (${i.quantity}x)`)
      .join(", ");

    const [result]: any = await pool.query(
      "INSERT INTO orders (user_id, user_name, user_email, total_price, items_summary, status) VALUES (?, ?, ?, ?, ?, 'معلق')",
      [user_id, user_name, user_email, total_price, itemsSummary]
    );

    return NextResponse.json({ message: "تم إنشاء الطلب بنجاح", orderId: result.insertId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 3. تحديث حالة الطلب من الإدارة
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { order_id, status } = body;

    await pool.query("UPDATE orders SET status = ? WHERE id = ?", [status, order_id]);
    return NextResponse.json({ message: "تم تحديث حالة الطلب بنجاح" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}