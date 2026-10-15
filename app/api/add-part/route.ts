import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

// إضافة قطعة جديدة للمخزن مع تحديد القسم
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { part_name, make, model, year, vin, price, image_url, category } = body;

    await pool.query(
      "INSERT INTO parts (part_name, make, model, year, vin, price, image_url, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        part_name,
        make,
        model,
        year || null,
        vin || null,
        price,
        image_url || null,
        category || "parts",
      ]
    );

    return NextResponse.json({ message: "تمت إضافة القطعة بنجاح" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// تعديل قطعة في المخزن
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, part_name, make, model, year, vin, price, image_url, category } = body;

    await pool.query(
      "UPDATE parts SET part_name = ?, make = ?, model = ?, year = ?, vin = ?, price = ?, image_url = ?, category = ? WHERE id = ?",
      [
        part_name,
        make,
        model,
        year || null,
        vin || null,
        price,
        image_url || null,
        category || "parts",
        id,
      ]
    );

    return NextResponse.json({ message: "تم تعديل القطعة بنجاح" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}