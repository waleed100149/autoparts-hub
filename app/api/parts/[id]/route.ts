import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { HttpError, handleError, requireAdmin } from "@/lib/auth";
import { parseId, parsePart } from "@/lib/validate";

type Ctx = { params: Promise<{ id: string }> };

// تعديل قطعة — للأدمن فقط
export async function PUT(req: Request, { params }: Ctx) {
  try {
    await requireAdmin();
    const id = parseId((await params).id, "معرف القطعة");
    const p = parsePart(await req.json());

    const [result]: any = await pool.execute(
      `UPDATE parts
       SET part_name = ?, make = ?, model = ?, year = ?, vin = ?, price = ?, image_url = ?, category = ?
       WHERE id = ?`,
      [p.part_name, p.make, p.model, p.year, p.vin, p.price, p.image_url, p.category, id]
    );
    if (result.affectedRows === 0) throw new HttpError(404, "القطعة غير موجودة");

    return NextResponse.json({ message: "تم تحديث القطعة بنجاح" });
  } catch (error) {
    return handleError(error);
  }
}

// حذف قطعة — للأدمن فقط
export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    await requireAdmin();
    const id = parseId((await params).id, "معرف القطعة");

    const [result]: any = await pool.execute("DELETE FROM parts WHERE id = ?", [id]);
    if (result.affectedRows === 0) throw new HttpError(404, "القطعة غير موجودة");

    return NextResponse.json({ message: "تم حذف القطعة بنجاح" });
  } catch (error) {
    return handleError(error);
  }
}
