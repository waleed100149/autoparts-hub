import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { HttpError, handleError, requireAdmin, requireUser } from "@/lib/auth";
import { parseCustomRequest, parseId } from "@/lib/validate";

const REQUEST_STATUSES = ["قيد النظر", "تم الرد", "متوفرة", "غير متوفرة"];

// الإدارة تشوف كل الطلبات الخاصة، والعميل يشوف طلباته فقط
export async function GET() {
  try {
    const user = await requireUser();

    const [rows] =
      user.role === "admin"
        ? await pool.query("SELECT * FROM custom_requests ORDER BY id DESC")
        : await pool.query("SELECT * FROM custom_requests WHERE user_id = ? ORDER BY id DESC", [user.id]);

    return NextResponse.json(rows);
  } catch (error) {
    return handleError(error);
  }
}

// العميل يطلب قطعة غير متوفرة — بياناته تؤخذ من الجلسة مو من الطلب
export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const r = parseCustomRequest(await request.json());

    await pool.execute(
      "INSERT INTO custom_requests (user_id, user_name, user_email, part_name, make, model, year, vin, notes, category, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'قيد النظر')",
      [user.id, user.name, user.email, r.part_name, r.make, r.model, r.year, r.vin, r.notes, r.category]
    );

    return NextResponse.json({ message: "تم إرسال طلبك الخاص بنجاح!" }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

// رد الإدارة وتحديث الحالة — للأدمن فقط
export async function PUT(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const requestId = parseId(body.request_id, "معرف الطلب");
    const adminReply = body.admin_reply ? String(body.admin_reply).trim() : "";

    let status = body.status ? String(body.status) : "قيد النظر";
    if (!REQUEST_STATUSES.includes(status)) throw new HttpError(400, "حالة الطلب غير صالحة");
    if (status === "قيد النظر" && adminReply) status = "تم الرد";

    const [result]: any = await pool.execute("UPDATE custom_requests SET status = ?, admin_reply = ? WHERE id = ?", [
      status,
      adminReply || null,
      requestId,
    ]);
    if (result.affectedRows === 0) throw new HttpError(404, "الطلب غير موجود");

    return NextResponse.json({ message: "تم تحديث حالة الطلب والرد بنجاح!" });
  } catch (error) {
    return handleError(error);
  }
}
