import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

// دالة فحص وتعديل حجم وحزمة ترميز حقل status تلقائياً
async function ensureOrdersSchema() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      user_name VARCHAR(255) NOT NULL,
      user_email VARCHAR(255) NOT NULL,
      total_price DECIMAL(10, 2) NOT NULL,
      items_summary TEXT NOT NULL,
      status VARCHAR(255) CHARACTER SET utf8mb4 DEFAULT 'معلق',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // توسيع حقل status وتغيير الترميز لمنع خطأ Data truncated
  try {
    await pool.execute(`ALTER TABLE orders MODIFY COLUMN status VARCHAR(255) CHARACTER SET utf8mb4 DEFAULT 'معلق'`);
  } catch (e) {
    // تم التحديث سابقاً
  }
}

// 1. جلب الطلبات (GET)
export async function GET() {
  try {
    await ensureOrdersSchema();
    const [rows]: any = await pool.execute(
      "SELECT * FROM orders ORDER BY created_at DESC"
    );
    return NextResponse.json(rows);
  } catch (error: any) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 2. إنشاء طلب جديد من العميل (POST)
export async function POST(req: Request) {
  try {
    await ensureOrdersSchema();

    const body = await req.json();
    const { user_id, user_name, user_email, total_price, items } = body;

    if (!user_id || !total_price || !items || items.length === 0) {
      return NextResponse.json({ error: "بيانات الطلب غير مكتملة" }, { status: 400 });
    }

    const items_summary = items
      .map((item: any) => `${item.part_name} (${item.quantity}x)`)
      .join(", ");

    const cleanUserId = Number(user_id);
    const cleanUserName = user_name ? String(user_name) : "عميل";
    const cleanUserEmail = user_email ? String(user_email) : "";
    const cleanTotalPrice = Number(total_price);

    await pool.execute(
      "INSERT INTO orders (user_id, user_name, user_email, total_price, items_summary, status) VALUES (?, ?, ?, ?, ?, ?)",
      [cleanUserId, cleanUserName, cleanUserEmail, cleanTotalPrice, items_summary, "معلق"]
    );

    return NextResponse.json({ message: "تم إرسال الطلب بنجاح" });
  } catch (error: any) {
    console.error("Error creating order:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 3. تحديث حالة الطلب من الإدارة (PUT)
export async function PUT(req: Request) {
  try {
    await ensureOrdersSchema();
    const body = await req.json();
    const { order_id, status } = body;

    if (!order_id || !status) {
      return NextResponse.json({ error: "معرف الطلب والحالة مطلوبان" }, { status: 400 });
    }

    // إزالة الإيموجي والرموز التعبيرية قبل التخزين لضمان توافق النصوص مع MySQL
    const cleanStatus = String(status).replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();

    await pool.execute("UPDATE orders SET status = ? WHERE id = ?", [cleanStatus, order_id]);

    return NextResponse.json({ message: "تم تحديث حالة الطلب بنجاح" });
  } catch (error: any) {
    console.error("Error updating order status:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}