import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { pool, ensureDB, DEFAULT_COMMISSION_RATE } from "@/lib/db";
import { HttpError, createSession, getMerchantProfile, handleError, requireAdmin } from "@/lib/auth";
import { parseAccount, parseMerchantSignup } from "@/lib/validate";
import { asFile, saveUpload } from "@/lib/storage";
import { CONTRACT_VERSION } from "@/lib/contract";

// تسجيل تاجر جديد — الحساب يبقى "قيد المراجعة" لين توافق عليه الإدارة
export async function POST(req: Request) {
  const conn = await pool.getConnection();
  try {
    await ensureDB();
    const form = await req.formData();

    const account = parseAccount(form.get("name"), form.get("email"), form.get("password"));
    const store = parseMerchantSignup(form);

    if (form.get("accept_contract") !== "true") throw new HttpError(400, "لازم توافق على اتفاقية التاجر");
    if (form.get("contract_version") !== CONTRACT_VERSION) {
      throw new HttpError(400, "تم تحديث الاتفاقية، حدّث الصفحة واقرأها من جديد");
    }

    const crFile = asFile(form.get("cr_document"));
    if (!crFile) throw new HttpError(400, "ارفع صورة أو ملف PDF للسجل التجاري");
    const logoFile = asFile(form.get("logo"));

    // نتأكد من التكرار قبل رفع الملفات
    const [dupEmail]: any = await conn.query("SELECT id FROM users WHERE email = ?", [account.email]);
    if (dupEmail.length) throw new HttpError(400, "البريد الإلكتروني مستخدم بالفعل");
    const [dupStore]: any = await conn.query(
      "SELECT tax_number, commercial_register FROM merchants WHERE tax_number = ? OR commercial_register = ?",
      [store.tax_number, store.commercial_register]
    );
    if (dupStore.length) {
      throw new HttpError(
        400,
        dupStore[0].tax_number === store.tax_number ? "الرقم الضريبي مسجّل لتاجر آخر" : "السجل التجاري مسجّل لتاجر آخر"
      );
    }

    const cr_document_url = await saveUpload(crFile, "merchants/documents", "document");
    const logo_url = logoFile ? await saveUpload(logoFile, "merchants/logos", "image") : null;

    const hash = await bcrypt.hash(account.password, 10);
    await conn.beginTransaction();
    const [result]: any = await conn.execute("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'merchant')", [
      account.name,
      account.email,
      hash,
    ]);
    const userId = result.insertId as number;
    await conn.execute(
      `INSERT INTO merchants
        (user_id, store_name, logo_url, phone, city, address, tax_number, commercial_register, cr_document_url, iban,
         commission_rate, status, contract_version, contract_accepted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, NOW())`,
      [
        userId,
        store.store_name,
        logo_url,
        store.phone,
        store.city,
        store.address,
        store.tax_number,
        store.commercial_register,
        cr_document_url,
        store.iban,
        DEFAULT_COMMISSION_RATE,
        CONTRACT_VERSION,
      ]
    );
    await conn.commit();

    await createSession(userId);
    return NextResponse.json(
      {
        user: { id: userId, name: account.name, email: account.email, role: "merchant" },
        merchant: await getMerchantProfile(userId),
      },
      { status: 201 }
    );
  } catch (error) {
    await conn.rollback().catch(() => {});
    return handleError(error);
  } finally {
    conn.release();
  }
}

// قائمة التجار مع ملخص مبيعاتهم — للإدارة فقط
export async function GET() {
  try {
    await requireAdmin();
    const [rows]: any = await pool.query(`
      SELECT m.*, u.name AS owner_name, u.email,
        (SELECT COUNT(*) FROM parts p WHERE p.merchant_id = m.user_id) AS parts_count,
        COALESCE(s.sales_total, 0) AS sales_total,
        COALESCE(s.commission_total, 0) AS commission_total,
        COALESCE(s.net_total, 0) AS net_total
      FROM merchants m
      JOIN users u ON u.id = m.user_id
      LEFT JOIN (
        SELECT oi.merchant_id,
          SUM(oi.unit_price * oi.quantity) AS sales_total,
          SUM(oi.commission_amount) AS commission_total,
          SUM(oi.merchant_net) AS net_total
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE o.status <> 'ملغي'
        GROUP BY oi.merchant_id
      ) s ON s.merchant_id = m.user_id
      ORDER BY FIELD(m.status, 'pending', 'approved', 'suspended', 'rejected'), m.created_at DESC
    `);
    return NextResponse.json(
      rows.map((r: any) => ({
        ...r,
        commission_rate: Number(r.commission_rate),
        parts_count: Number(r.parts_count),
        sales_total: Number(r.sales_total),
        commission_total: Number(r.commission_total),
        net_total: Number(r.net_total),
      }))
    );
  } catch (error) {
    return handleError(error);
  }
}
