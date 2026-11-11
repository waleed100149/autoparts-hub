import { NextResponse } from "next/server";
import { pool, ensureDB } from "@/lib/db";
import { handleError, requireAdmin } from "@/lib/auth";
import { parsePart } from "@/lib/validate";

// عرض القطع — متاح للجميع (المتجر)
export async function GET(request: Request) {
  try {
    await ensureDB();
    const category = new URL(request.url).searchParams.get("category");

    let query = "SELECT * FROM parts";
    const params: any[] = [];
    if (category === "parts" || category === "salvage") {
      query += " WHERE category = ?";
      params.push(category);
    }
    query += " ORDER BY id DESC";

    const [rows] = await pool.query(query, params);
    return NextResponse.json(rows);
  } catch (error) {
    return handleError(error);
  }
}

// إضافة قطعة جديدة — للأدمن فقط
export async function POST(request: Request) {
  try {
    await requireAdmin();
    const p = parsePart(await request.json());

    const [result]: any = await pool.execute(
      "INSERT INTO parts (part_name, make, model, year, vin, price, image_url, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [p.part_name, p.make, p.model, p.year, p.vin, p.price, p.image_url, p.category]
    );

    return NextResponse.json({ message: "تمت إضافة القطعة بنجاح", id: result.insertId }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
