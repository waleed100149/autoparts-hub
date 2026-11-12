import { NextResponse } from "next/server";
import { HttpError, handleError, requireMerchant, requireUser } from "@/lib/auth";
import { asFile, saveUpload } from "@/lib/storage";

// رفع صورة قطعة — للإدارة وللتجار المعتمدين فقط
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    if (user.role === "merchant") await requireMerchant(true);
    else if (user.role !== "admin") throw new HttpError(403, "غير مصرح لك برفع الملفات");

    const file = asFile((await req.formData()).get("file"));
    if (!file) throw new HttpError(400, "اختر صورة");

    const url = await saveUpload(file, "image", { folder: "parts", ownerId: user.id });
    return NextResponse.json({ url }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
