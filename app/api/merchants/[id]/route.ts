import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { HttpError, handleError, requireAdmin } from "@/lib/auth";
import { parseCommissionRate, parseId } from "@/lib/validate";

type Ctx = { params: Promise<{ id: string }> };
const STATUSES = ["pending", "approved", "rejected", "suspended"];

// الإدارة: قبول/رفض/تعليق التاجر وتحديد نسبة عمولته
export async function PUT(req: Request, { params }: Ctx) {
  try {
    await requireAdmin();
    const id = parseId((await params).id, "معرف التاجر");
    const body = await req.json();

    const sets: string[] = [];
    const values: (string | number | null)[] = [];

    if (body.status !== undefined) {
      if (!STATUSES.includes(body.status)) throw new HttpError(400, "حالة التاجر غير صالحة");
      sets.push("status = ?", "reviewed_at = NOW()");
      values.push(body.status);
    }
    if (body.commission_rate !== undefined) {
      sets.push("commission_rate = ?");
      values.push(parseCommissionRate(body.commission_rate));
    }
    if (body.admin_note !== undefined) {
      const note = String(body.admin_note ?? "").trim();
      sets.push("admin_note = ?");
      values.push(note || null);
    }
    if (sets.length === 0) throw new HttpError(400, "ما فيه تعديلات");

    const [result]: any = await pool.execute(`UPDATE merchants SET ${sets.join(", ")} WHERE user_id = ?`, [...values, id]);
    if (result.affectedRows === 0) throw new HttpError(404, "التاجر غير موجود");

    return NextResponse.json({ message: "تم تحديث بيانات التاجر" });
  } catch (error) {
    return handleError(error);
  }
}
