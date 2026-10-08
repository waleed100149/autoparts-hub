import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

// دالة تضمن أن العمود image_url يتسع للروابط الطويلة جداً
async function ensurePartsSchema() {
  try {
    await pool.execute(`ALTER TABLE parts MODIFY COLUMN image_url TEXT`);
  } catch (e) {
    // تم التعديل سابقاً
  }
}

export async function POST(req: Request) {
  return handleSave(req);
}

export async function PUT(req: Request) {
  return handleSave(req);
}

async function handleSave(req: Request) {
  try {
    await ensurePartsSchema();

    const body = await req.json();

    const id = body.id ? Number(body.id) : null;
    const part_name = body.part_name ? String(body.part_name).trim() : null;
    const make = body.make ? String(body.make).trim() : null;
    const model = body.model ? String(body.model).trim() : null;
    const year = body.year !== "" && body.year !== undefined && body.year !== null ? Number(body.year) : null;
    const vin = body.vin && String(body.vin).trim() !== "" ? String(body.vin).trim() : null;
    const price = body.price !== "" && body.price !== undefined && body.price !== null ? Number(body.price) : null;
    const image_url = body.image_url && String(body.image_url).trim() !== "" ? String(body.image_url).trim() : null;

    if (!part_name || !make || !model || price === null) {
      return NextResponse.json(
        { error: "اسم القطعة، الماركة، الموديل والسعر حقول مطلوبة" },
        { status: 400 }
      );
    }

    if (id && id > 0) {
      await pool.execute(
        `UPDATE parts 
         SET part_name = ?, make = ?, model = ?, year = ?, vin = ?, price = ?, image_url = ? 
         WHERE id = ?`,
        [part_name, make, model, year, vin, price, image_url, id]
      );
      return NextResponse.json({ message: "تم تحديث القطعة بنجاح" });
    } else {
      await pool.execute(
        `INSERT INTO parts (part_name, make, model, year, vin, price, image_url) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [part_name, make, model, year, vin, price, image_url]
      );
      return NextResponse.json({ message: "تمت إضافة القطعة بنجاح" });
    }
  } catch (error: any) {
    console.error("Error saving part:", error);
    return NextResponse.json(
      { error: error.message || "حدث خطأ أثناء حفظ البيانات" },
      { status: 500 }
    );
  }
}