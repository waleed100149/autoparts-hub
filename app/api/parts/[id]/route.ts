import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { HttpError, handleError, requireMerchant, requireUser } from "@/lib/auth";
import { parseId, parsePart } from "@/lib/validate";

type Ctx = { params: Promise<{ id: string }> };

/** الإدارة تعدّل أي قطعة، والتاجر المعتمد يعدّل قطعه هو فقط — يرجّع شرط SQL إضافي */
async function ownershipFilter(): Promise<{ sql: string; values: (string | number)[] }> {
  const user = await requireUser();
  if (user.role === "admin") return { sql: "", values: [] };
  if (user.role === "merchant") {
    const { user: m } = await requireMerchant(true);
    return { sql: " AND merchant_id = ?", values: [m.id] };
  }
  throw new HttpError(403, "غير مصرح لك بهذا الإجراء");
}

export async function PUT(req: Request, { params }: Ctx) {
  try {
    const owner = await ownershipFilter();
    const id = parseId((await params).id, "معرف القطعة");
    const p = parsePart(await req.json());

    const [result]: any = await pool.execute(
      `UPDATE parts
       SET part_name = ?, make = ?, model = ?, year = ?, vin = ?, price = ?, image_url = ?, category = ?
       WHERE id = ?${owner.sql}`,
      [p.part_name, p.make, p.model, p.year, p.vin, p.price, p.image_url, p.category, id, ...owner.values]
    );
    if (result.affectedRows === 0) throw new HttpError(404, "القطعة غير موجودة");

    return NextResponse.json({ message: "تم تحديث القطعة بنجاح" });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const owner = await ownershipFilter();
    const id = parseId((await params).id, "معرف القطعة");

    const [result]: any = await pool.execute(`DELETE FROM parts WHERE id = ?${owner.sql}`, [id, ...owner.values]);
    if (result.affectedRows === 0) throw new HttpError(404, "القطعة غير موجودة");

    return NextResponse.json({ message: "تم حذف القطعة بنجاح" });
  } catch (error) {
    return handleError(error);
  }
}
