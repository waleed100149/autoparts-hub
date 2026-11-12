import { randomUUID } from "crypto";
import type { Pool, PoolConnection } from "mysql2/promise";
import { pool } from "./db";
import { HttpError } from "./auth";

// حدود الحجم — مجموع الطلب الواحد على Vercel لازم يكون أقل من 4.5MB
export const MAX_IMAGE_BYTES = 1.5 * 1024 * 1024;
export const MAX_DOCUMENT_BYTES = 2.5 * 1024 * 1024;

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const DOCUMENT_TYPES = [...IMAGE_TYPES, "application/pdf"];

/** يتحقق إن القيمة ملف حقيقي (مو نص) */
export function asFile(value: FormDataEntryValue | null): File | null {
  if (!value || typeof value === "string" || value.size === 0) return null;
  return value;
}

/** يتأكد من نوع الملف الحقيقي من أول بايتات (مو من اللي يقوله المتصفح) */
function sniffType(buf: Buffer): string | null {
  if (buf.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return "image/jpeg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  if (buf.subarray(0, 5).toString("ascii") === "%PDF-") return "application/pdf";
  return null;
}

/**
 * يحفظ الملف داخل قاعدة البيانات (جدول uploads) ويرجّع رابطه: /api/files/<id>
 * - الملفات الخاصة (مثل السجل التجاري) ما يفتحها إلا صاحبها والإدارة
 * - تقدر تمرر conn عشان الحفظ يصير داخل نفس الـ transaction
 */
export async function saveUpload(
  file: File,
  kind: "image" | "document",
  opts: { ownerId?: number | null; isPrivate?: boolean; folder: string; conn?: PoolConnection | Pool }
): Promise<string> {
  const max = kind === "image" ? MAX_IMAGE_BYTES : MAX_DOCUMENT_BYTES;
  if (file.size > max) {
    throw new HttpError(400, `حجم الملف أكبر من المسموح (${(max / 1024 / 1024).toFixed(1)} ميجا)`);
  }

  const data = Buffer.from(await file.arrayBuffer());
  const mime = sniffType(data);
  const allowed = kind === "image" ? IMAGE_TYPES : DOCUMENT_TYPES;
  if (!mime || !allowed.includes(mime)) {
    throw new HttpError(400, kind === "image" ? "الصورة لازم تكون JPG أو PNG أو WEBP" : "الملف لازم يكون PDF أو صورة");
  }

  const id = randomUUID();
  await (opts.conn ?? pool).execute(
    "INSERT INTO uploads (id, owner_id, folder, mime, size, is_private, data) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [id, opts.ownerId ?? null, opts.folder, mime, data.length, opts.isPrivate ? 1 : 0, data]
  );
  return `/api/files/${id}`;
}
