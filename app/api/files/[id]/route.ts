import { NextResponse } from "next/server";
import { pool, ensureDB } from "@/lib/db";
import { HttpError, getSessionUser, handleError } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

// عرض ملف مرفوع من قاعدة البيانات
// الصور العامة (شعارات وصور قطع) للجميع، والملفات الخاصة (السجل التجاري) لصاحبها والإدارة فقط
export async function GET(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new HttpError(404, "الملف غير موجود");

    await ensureDB();
    const [rows]: any = await pool.query("SELECT owner_id, mime, size, is_private, data FROM uploads WHERE id = ?", [id]);
    const file = rows[0];
    if (!file) throw new HttpError(404, "الملف غير موجود");

    if (file.is_private) {
      const user = await getSessionUser();
      if (!user || (user.role !== "admin" && user.id !== file.owner_id)) {
        throw new HttpError(404, "الملف غير موجود");
      }
    }

    return new NextResponse(new Uint8Array(file.data), {
      headers: {
        "Content-Type": file.mime,
        "Content-Length": String(file.size),
        "Content-Disposition": "inline",
        "X-Content-Type-Options": "nosniff",
        // الملف ما يتغير أبداً (كل رفع له id جديد) — المتصفح يحتفظ فيه
        "Cache-Control": file.is_private ? "private, no-store" : "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
