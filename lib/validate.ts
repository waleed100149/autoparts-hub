import { HttpError } from "./auth";

export type Category = "parts" | "salvage";

const str = (v: unknown) => {
  const s = v === undefined || v === null ? "" : String(v).trim();
  return s === "" ? null : s;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** الاسم والبريد وكلمة المرور لأي حساب جديد */
export function parseAccount(name: unknown, email: unknown, password: unknown) {
  const cleanName = String(name ?? "").trim();
  const cleanEmail = String(email ?? "").trim().toLowerCase();
  const cleanPassword = String(password ?? "");
  if (!cleanName || !cleanEmail || !cleanPassword) throw new HttpError(400, "جميع الحقول مطلوبة");
  if (!EMAIL_RE.test(cleanEmail)) throw new HttpError(400, "البريد الإلكتروني غير صالح");
  if (cleanPassword.length < 6) throw new HttpError(400, "كلمة المرور يجب أن تكون 6 أحرف على الأقل");
  return { name: cleanName, email: cleanEmail, password: cleanPassword };
}

export function parseCategory(v: unknown): Category {
  return v === "salvage" ? "salvage" : "parts";
}

export function parseYear(v: unknown): number | null {
  const s = str(v);
  if (s === null) return null;
  const year = Number(s);
  const max = new Date().getFullYear() + 1;
  if (!Number.isInteger(year) || year < 1950 || year > max) {
    throw new HttpError(400, `سنة الصنع يجب أن تكون بين 1950 و ${max}`);
  }
  return year;
}

export function parseId(v: unknown, label = "المعرف"): number {
  const id = Number(v);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, `${label} غير صحيح`);
  return id;
}

/** بيانات قطعة الغيار القادمة من نموذج الإدارة */
export function parsePart(body: any) {
  const part_name = str(body.part_name);
  const make = str(body.make);
  const model = str(body.model);
  if (!part_name || !make || !model) throw new HttpError(400, "اسم القطعة والشركة والموديل مطلوبة");

  const price = Number(body.price);
  if (!Number.isFinite(price) || price <= 0) throw new HttpError(400, "السعر يجب أن يكون رقماً أكبر من صفر");

  const image_url = str(body.image_url);
  if (image_url && !/^(https?:\/\/|\/uploads\/)/i.test(image_url)) throw new HttpError(400, "رابط الصورة يجب أن يبدأ بـ http أو https");

  return {
    part_name,
    make,
    model,
    year: parseYear(body.year),
    vin: str(body.vin),
    price: Math.round(price * 100) / 100,
    image_url,
    category: parseCategory(body.category),
  };
}

/** بيانات الطلب الخاص من العميل */
export function parseCustomRequest(body: any) {
  const part_name = str(body.part_name);
  const make = str(body.make);
  const model = str(body.model);
  if (!part_name || !make || !model) throw new HttpError(400, "اسم القطعة والشركة والموديل مطلوبة");
  return {
    part_name,
    make,
    model,
    year: parseYear(body.year),
    vin: str(body.vin),
    notes: str(body.notes),
    category: parseCategory(body.category),
  };
}

/** بيانات تسجيل التاجر (من FormData) */
export function parseMerchantSignup(form: FormData) {
  const get = (k: string) => str(form.get(k));

  const store_name = get("store_name");
  const phone = get("phone")?.replace(/[\s-]/g, "") ?? null;
  const city = get("city");
  const tax_number = get("tax_number")?.replace(/\s/g, "") ?? null;
  const commercial_register = get("commercial_register")?.replace(/\s/g, "") ?? null;
  const iban = get("iban")?.replace(/\s/g, "").toUpperCase() ?? null;

  if (!store_name || !phone || !city || !tax_number || !commercial_register) {
    throw new HttpError(400, "اسم المحل والجوال والمدينة والرقم الضريبي والسجل التجاري مطلوبة");
  }
  if (store_name.length > 120) throw new HttpError(400, "اسم المحل طويل جداً");
  if (!/^(\+?966|0)?5\d{8}$/.test(phone)) throw new HttpError(400, "رقم الجوال غير صحيح (مثال: 05xxxxxxxx)");
  // الرقم الضريبي في السعودية 15 رقم يبدأ وينتهي بـ 3
  if (!/^3\d{13}3$/.test(tax_number)) throw new HttpError(400, "الرقم الضريبي لازم يكون 15 رقم يبدأ وينتهي بـ 3");
  // السجل التجاري 10 أرقام
  if (!/^\d{10}$/.test(commercial_register)) throw new HttpError(400, "رقم السجل التجاري لازم يكون 10 أرقام");
  if (iban && !/^SA\d{22}$/.test(iban)) throw new HttpError(400, "رقم الآيبان غير صحيح (يبدأ بـ SA ثم 22 رقم)");

  return { store_name, phone, city, address: get("address"), tax_number, commercial_register, iban };
}

/** نسبة عمولة بين 0 و 100 */
export function parseCommissionRate(v: unknown) {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0 || n > 100) throw new HttpError(400, "نسبة العمولة لازم تكون بين 0 و 100");
  return Math.round(n * 100) / 100;
}

/** حساب العمولة: تنخصم من سعر التاجر */
export function splitCommission(unitPrice: number, quantity: number, rate: number) {
  const gross = Math.round(unitPrice * quantity * 100) / 100;
  const commission = Math.round(gross * rate) / 100;
  return { gross, commission, net: Math.round((gross - commission) * 100) / 100 };
}
