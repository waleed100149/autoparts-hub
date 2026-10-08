import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

// 1️⃣ دالة الحذف (DELETE)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // فك كائن الـ params إذا كان Promise
    const resolvedParams = await params;
    const idParam = resolvedParams?.id;

    const id = idParam ? Number(idParam) : null;

    if (!id || isNaN(id)) {
      return NextResponse.json({ error: "معرف القطعة غير صحيح" }, { status: 400 });
    }

    await pool.execute("DELETE FROM parts WHERE id = ?", [id]);

    return NextResponse.json({ message: "تم حذف القطعة بنجاح" });
  } catch (error: any) {
    console.error("Error deleting part:", error);
    return NextResponse.json(
      { error: error.message || "حدث خطأ أثناء الحذف" },
      { status: 500 }
    );
  }
}

// 2️⃣ دالة التحديث (PUT)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    const idParam = resolvedParams?.id;
    const id = idParam ? Number(idParam) : null;

    if (!id || isNaN(id)) {
      return NextResponse.json({ error: "معرف القطعة غير صحيح" }, { status: 400 });
    }

    const body = await req.json();

    const part_name = body.part_name ? String(body.part_name).trim() : null;
    const make = body.make ? String(body.make).trim() : null;
    const model = body.model ? String(body.model).trim() : null;
    const year = body.year !== "" && body.year !== undefined && body.year !== null ? Number(body.year) : null;
    const vin = body.vin && String(body.vin).trim() !== "" ? String(body.vin).trim() : null;
    const price = body.price !== "" && body.price !== undefined && body.price !== null ? Number(body.price) : null;
    const image_url = body.image_url && String(body.image_url).trim() !== "" ? String(body.image_url).trim() : null;

    await pool.execute(
      `UPDATE parts 
       SET part_name = ?, make = ?, model = ?, year = ?, vin = ?, price = ?, image_url = ? 
       WHERE id = ?`,
      [part_name, make, model, year, vin, price, image_url, id]
    );

    return NextResponse.json({ message: "تم تحديث القطعة بنجاح" });
  } catch (error: any) {
    console.error("Error updating part:", error);
    return NextResponse.json(
      { error: error.message || "حدث خطأ أثناء التحديث" },
      { status: 500 }
    );
  }
}