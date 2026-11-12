import { put } from "@vercel/blob";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { HttpError } from "./auth";

// حدود الحجم — مجموع الطلب الواحد على Vercel لازم يكون أقل من 4.5MB
export const MAX_IMAGE_BYTES = 1.5 * 1024 * 1024;
export const MAX_DOCUMENT_BYTES = 2.5 * 1024 * 1024;

const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const DOCUMENT_TYPES: Record<string, string> = {
  ...IMAGE_TYPES,
  "application/pdf": "pdf",
};

/** يتحقق إن القيمة ملف حقيقي (مو نص) */
export function asFile(value: FormDataEntryValue | null): File | null {
  if (!value || typeof value === "string" || value.size === 0) return null;
  return value;
}

/**
 * يحفظ الملف ويرجّع رابطه.
 * - في الإنتاج: Vercel Blob (يحتاج BLOB_READ_WRITE_TOKEN — ينضاف تلقائياً لما تربط Blob Store بالمشروع)
 * - في التطوير بدون توكن: يُحفظ في public/uploads
 */
export async function saveUpload(file: File, folder: string, kind: "image" | "document"): Promise<string> {
  const allowed = kind === "image" ? IMAGE_TYPES : DOCUMENT_TYPES;
  const ext = allowed[file.type];
  if (!ext) {
    throw new HttpError(400, kind === "image" ? "الصورة لازم تكون JPG أو PNG أو WEBP" : "الملف لازم يكون PDF أو صورة");
  }
  const max = kind === "image" ? MAX_IMAGE_BYTES : MAX_DOCUMENT_BYTES;
  if (file.size > max) {
    throw new HttpError(400, `حجم الملف أكبر من المسموح (${(max / 1024 / 1024).toFixed(1)} ميجا)`);
  }

  // اسم عشوائي — ما نستخدم اسم الملف اللي جاي من المستخدم
  const name = `${folder}/${randomUUID()}.${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(name, file, { access: "public", contentType: file.type });
    return blob.url;
  }

  if (process.env.NODE_ENV === "production") {
    throw new HttpError(503, "رفع الملفات غير مفعّل على الخادم حالياً");
  }

  const dest = path.join(process.cwd(), "public", "uploads", name);
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, Buffer.from(await file.arrayBuffer()));
  return `/uploads/${name}`;
}
