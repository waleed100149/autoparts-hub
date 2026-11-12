import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { HttpError, handleError, requireAdmin, requireUser } from "@/lib/auth";
import { parseId, splitCommission } from "@/lib/validate";

const ORDER_STATUSES = ["معلق", "قيد التوصيل", "مكتمل", "ملغي"];
const RESERVATION_FEE = 150;
const PAYMENT_METHODS: Record<string, string> = {
  card: "دفع إلكتروني",
  bank_transfer: "تحويل بنكي",
  reservation: `نظام حجز (+${RESERVATION_FEE})`,
};

// يضيف عناصر كل طلب (من جدول order_items) للرد
async function attachItems(orders: any[]) {
  if (orders.length === 0) return orders;
  const [items]: any = await pool.query(
    `SELECT oi.order_id, oi.part_id AS id, oi.part_name, oi.image_url, oi.quantity, oi.unit_price AS price,
            oi.merchant_id, oi.commission_amount, m.store_name
     FROM order_items oi LEFT JOIN merchants m ON m.user_id = oi.merchant_id
     WHERE oi.order_id IN (?)`,
    [orders.map((o) => o.id)]
  );
  return orders.map((o) => ({ ...o, items: items.filter((i: any) => i.order_id === o.id) }));
}

// الإدارة تشوف كل الطلبات، والعميل يشوف طلباته فقط
export async function GET() {
  try {
    const user = await requireUser();
    if (user.role === "merchant") throw new HttpError(403, "مبيعات التاجر تُعرض من لوحة التاجر");

    const [rows]: any =
      user.role === "admin"
        ? await pool.query("SELECT * FROM orders ORDER BY created_at DESC")
        : await pool.query("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC", [user.id]);

    return NextResponse.json(await attachItems(rows));
  } catch (error) {
    return handleError(error);
  }
}

// إنشاء طلب — السعر يُحسب هنا من قاعدة البيانات، ولا نثق بأي سعر يرسله المتصفح
export async function POST(req: Request) {
  const conn = await pool.getConnection();
  try {
    const user = await requireUser();
    if (user.role !== "client") throw new HttpError(403, "الطلب متاح لحسابات العملاء فقط");
    const body = await req.json();

    const paymentKey = String(body.payment_method ?? "card");
    const paymentText = PAYMENT_METHODS[paymentKey];
    if (!paymentText) throw new HttpError(400, "طريقة الدفع غير صالحة");

    if (!Array.isArray(body.items) || body.items.length === 0) throw new HttpError(400, "السلة فارغة");

    // تجميع الكميات حسب القطعة
    const quantities = new Map<number, number>();
    for (const item of body.items) {
      const id = parseId(item?.id, "معرف القطعة");
      const qty = Number(item?.quantity);
      if (!Number.isInteger(qty) || qty < 1 || qty > 99) throw new HttpError(400, "الكمية يجب أن تكون بين 1 و 99");
      quantities.set(id, (quantities.get(id) ?? 0) + qty);
    }

    // قطع التجار غير المعتمدين ما تنباع
    const [parts]: any = await conn.query(
      `SELECT p.id, p.part_name, p.price, p.image_url, p.merchant_id, m.commission_rate
       FROM parts p LEFT JOIN merchants m ON m.user_id = p.merchant_id
       WHERE p.id IN (?) AND (p.merchant_id IS NULL OR m.status = 'approved')`,
      [[...quantities.keys()]]
    );
    if (parts.length !== quantities.size) throw new HttpError(400, "بعض القطع في السلة لم تعد متوفرة");

    // العمولة تنخصم من سعر التاجر: العميل يدفع السعر نفسه، والتاجر ياخذ (السعر − العمولة)
    const lines = parts.map((p: any) => {
      const quantity = quantities.get(p.id)!;
      const unit_price = Number(p.price);
      const rate = p.merchant_id ? Number(p.commission_rate) : 0;
      const split = splitCommission(unit_price, quantity, rate);
      return {
        part_id: p.id,
        part_name: p.part_name,
        image_url: p.image_url,
        quantity,
        unit_price,
        merchant_id: p.merchant_id ?? null,
        commission_rate: rate,
        commission_amount: p.merchant_id ? split.commission : 0,
        merchant_net: p.merchant_id ? split.net : 0,
      };
    });

    const subtotal = lines.reduce((s: number, l: any) => s + l.unit_price * l.quantity, 0);
    const total = Math.round((subtotal + (paymentKey === "reservation" ? RESERVATION_FEE : 0)) * 100) / 100;
    const summary = lines.map((l: any) => `${l.part_name} (${l.quantity}x)`).join(", ");

    // الطلب وعناصره يُحفظون مع بعض أو ما يُحفظ شي
    await conn.beginTransaction();
    const [result]: any = await conn.execute(
      "INSERT INTO orders (user_id, user_name, user_email, total_price, items_summary, payment_method, status) VALUES (?, ?, ?, ?, ?, ?, 'معلق')",
      [user.id, user.name, user.email, total, summary, paymentText]
    );
    const orderId = result.insertId;
    await conn.query(
      `INSERT INTO order_items
        (order_id, part_id, part_name, image_url, quantity, unit_price, merchant_id, commission_rate, commission_amount, merchant_net)
       VALUES ?`,
      [
        lines.map((l: any) => [
          orderId,
          l.part_id,
          l.part_name,
          l.image_url,
          l.quantity,
          l.unit_price,
          l.merchant_id,
          l.commission_rate,
          l.commission_amount,
          l.merchant_net,
        ]),
      ]
    );
    await conn.commit();

    return NextResponse.json({ message: "تم إرسال الطلب بنجاح", orderId, total }, { status: 201 });
  } catch (error) {
    await conn.rollback().catch(() => {});
    return handleError(error);
  } finally {
    conn.release();
  }
}

// تحديث حالة الطلب — للأدمن فقط
export async function PUT(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const orderId = parseId(body.order_id, "معرف الطلب");
    const status = String(body.status ?? "");
    if (!ORDER_STATUSES.includes(status)) throw new HttpError(400, "حالة الطلب غير صالحة");

    const [result]: any = await pool.execute("UPDATE orders SET status = ? WHERE id = ?", [status, orderId]);
    if (result.affectedRows === 0) throw new HttpError(404, "الطلب غير موجود");

    return NextResponse.json({ message: "تم تحديث حالة الطلب بنجاح" });
  } catch (error) {
    return handleError(error);
  }
}
