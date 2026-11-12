import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { handleError, requireMerchant } from "@/lib/auth";

// مبيعات التاجر: كل قطعة بيعت مع العمولة وصافي المستحق
export async function GET() {
  try {
    const { user } = await requireMerchant(false);
    const [rows]: any = await pool.query(
      `SELECT oi.id, oi.order_id, oi.part_id, oi.part_name, oi.image_url, oi.quantity, oi.unit_price,
              oi.commission_rate, oi.commission_amount, oi.merchant_net,
              o.status, o.created_at, o.user_name
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE oi.merchant_id = ?
       ORDER BY o.created_at DESC, oi.id DESC`,
      [user.id]
    );

    const sales = rows.map((r: any) => ({
      ...r,
      unit_price: Number(r.unit_price),
      commission_rate: Number(r.commission_rate),
      commission_amount: Number(r.commission_amount),
      merchant_net: Number(r.merchant_net),
    }));

    const active = sales.filter((s: any) => s.status !== "ملغي");
    const sum = (k: string) => Math.round(active.reduce((t: number, s: any) => t + s[k], 0) * 100) / 100;
    const summary = {
      items_sold: active.reduce((t: number, s: any) => t + s.quantity, 0),
      gross: Math.round(active.reduce((t: number, s: any) => t + s.unit_price * s.quantity, 0) * 100) / 100,
      commission: sum("commission_amount"),
      net: sum("merchant_net"),
      // المستحق فعلياً = الطلبات المكتملة فقط
      net_completed:
        Math.round(sales.filter((s: any) => s.status === "مكتمل").reduce((t: number, s: any) => t + s.merchant_net, 0) * 100) / 100,
    };

    return NextResponse.json({ sales, summary });
  } catch (error) {
    return handleError(error);
  }
}
