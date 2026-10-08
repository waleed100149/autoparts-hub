import { NextResponse } from "next/server";
import { pool } from "../../../lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const make = searchParams.get("make") || "";
    const model = searchParams.get("model") || "";
    const year = searchParams.get("year") || "";

    let query = "SELECT * FROM parts WHERE 1=1";
    const queryParams: any[] = [];

    if (search) {
      query += " AND (part_name LIKE ? OR vin LIKE ?)";
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    if (make) {
      query += " AND make = ?";
      queryParams.push(make);
    }

    if (model) {
      query += " AND model = ?";
      queryParams.push(model);
    }

    if (year) {
      query += " AND year = ?";
      queryParams.push(year);
    }

    query += " ORDER BY id DESC";

    const [rows] = await pool.execute(query, queryParams);

    return NextResponse.json(rows);
  } catch (error: any) {
    console.error("خطأ في جلب قطع الغيار:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب قطع الغيار" },
      { status: 500 }
    );
  }
}