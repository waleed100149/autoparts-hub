import { NextResponse } from "next/server";
import { pool, ensureDB } from "@/lib/db";
import { HttpError, getSessionUser, handleError, requireMerchant, requireUser } from "@/lib/auth";
import { parsePart } from "@/lib/validate";

// القطع مع اسم المحل — قطع التجار تظهر فقط لو التاجر معتمد
const SELECT_PARTS = `
  SELECT p.*, m.store_name, m.logo_url AS store_logo
  FROM parts p
  LEFT JOIN merchants m ON m.user_id = p.merchant_id`;

// عرض القطع — متاح للجميع (المتجر). ?mine=1 للتاجر يرجّع قطعه هو فقط
export async function GET(request: Request) {
  try {
    await ensureDB();
    const params = new URL(request.url).searchParams;
    const category = params.get("category");

    const where: string[] = [];
    const values: unknown[] = [];

    if (params.get("mine") === "1") {
      const user = await getSessionUser();
      if (user?.role !== "merchant") throw new HttpError(403, "هذا الطلب للتجار فقط");
      where.push("p.merchant_id = ?");
      values.push(user.id);
    } else {
      where.push("(p.merchant_id IS NULL OR m.status = 'approved')");
    }

    if (category === "parts" || category === "salvage") {
      where.push("p.category = ?");
      values.push(category);
    }

    const [rows] = await pool.query(`${SELECT_PARTS} WHERE ${where.join(" AND ")} ORDER BY p.id DESC`, values);
    return NextResponse.json(rows);
  } catch (error) {
    return handleError(error);
  }
}

// إضافة قطعة — الإدارة (قطعة للمتجر) أو التاجر المعتمد (قطعة باسم محله)
export async function POST(request: Request) {
  try {
    const user = await requireUser();
    let merchantId: number | null = null;
    if (user.role === "merchant") {
      merchantId = (await requireMerchant(true)).user.id;
    } else if (user.role !== "admin") {
      throw new HttpError(403, "غير مصرح لك بهذا الإجراء");
    }

    const p = parsePart(await request.json());
    const [result]: any = await pool.execute(
      "INSERT INTO parts (part_name, make, model, year, vin, price, image_url, category, merchant_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [p.part_name, p.make, p.model, p.year, p.vin, p.price, p.image_url, p.category, merchantId]
    );

    return NextResponse.json({ message: "تمت إضافة القطعة بنجاح", id: result.insertId }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
