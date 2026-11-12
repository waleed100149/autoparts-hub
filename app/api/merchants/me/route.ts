import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { HttpError, getMerchantProfile, handleError, requireMerchant } from "@/lib/auth";
import { asFile, saveUpload } from "@/lib/storage";

// ملف المحل الخاص بالتاجر المسجّل
export async function GET() {
  try {
    const { merchant } = await requireMerchant(false);
    return NextResponse.json({ merchant });
  } catch (error) {
    return handleError(error);
  }
}

// تعديل بيانات التواصل والشعار — السجل والرقم الضريبي ما يتعدلون إلا من الإدارة
export async function PUT(req: Request) {
  try {
    const { user } = await requireMerchant(false);
    const form = await req.formData();

    const store_name = String(form.get("store_name") ?? "").trim();
    const phone = String(form.get("phone") ?? "").replace(/[\s-]/g, "");
    const city = String(form.get("city") ?? "").trim();
    const address = String(form.get("address") ?? "").trim() || null;
    const iban = String(form.get("iban") ?? "").replace(/\s/g, "").toUpperCase() || null;

    if (!store_name || !phone || !city) throw new HttpError(400, "اسم المحل والجوال والمدينة مطلوبة");
    if (!/^(\+?966|0)?5\d{8}$/.test(phone)) throw new HttpError(400, "رقم الجوال غير صحيح");
    if (iban && !/^SA\d{22}$/.test(iban)) throw new HttpError(400, "رقم الآيبان غير صحيح");

    const logo = asFile(form.get("logo"));
    const logo_url = logo ? await saveUpload(logo, "merchants/logos", "image") : undefined;

    await pool.execute(
      `UPDATE merchants SET store_name = ?, phone = ?, city = ?, address = ?, iban = ?${logo_url ? ", logo_url = ?" : ""}
       WHERE user_id = ?`,
      [store_name, phone, city, address, iban, ...(logo_url ? [logo_url] : []), user.id]
    );
    return NextResponse.json({ merchant: await getMerchantProfile(user.id) });
  } catch (error) {
    return handleError(error);
  }
}
