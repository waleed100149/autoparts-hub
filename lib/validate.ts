import { HttpError } from "./auth";

export type Category = "parts" | "salvage";

const str = (v: unknown) => {
  const s = v === undefined || v === null ? "" : String(v).trim();
  return s === "" ? null : s;
};

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
  if (image_url && !/^https?:\/\//i.test(image_url)) throw new HttpError(400, "رابط الصورة يجب أن يبدأ بـ http أو https");

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
