import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

export const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "autoparts_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: "utf8mb4",
  ssl: sslOptions(),
});

// في الإنتاج نتحقق من شهادة قاعدة البيانات.
// لو مزوّد القاعدة يستخدم شهادة CA خاصة (مثل Aiven) حط محتوى ملف ca.pem في DB_SSL_CA.
// DB_SSL_REJECT_UNAUTHORIZED=false يعطّل التحقق — حل مؤقت فقط وغير مستحسن.
function sslOptions() {
  if (process.env.NODE_ENV !== "production") return undefined;
  const ca = process.env.DB_SSL_CA?.replace(/\\n/g, "\n");
  return {
    ca: ca || undefined,
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false",
  };
}

const TABLE_OPTS = "ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

// تعديلات للجداول القديمة — الخطأ متوقع إذا كان التعديل مطبّق سابقاً
async function tryQuery(sql: string) {
  try {
    await pool.query(sql);
  } catch {
    /* already applied */
  }
}

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role ENUM('client', 'admin', 'merchant') NOT NULL DEFAULT 'client',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ${TABLE_OPTS}
  `);
  // bcrypt يحتاج 60 حرف على الأقل
  await tryQuery("ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NOT NULL");
  await tryQuery("ALTER TABLE users MODIFY COLUMN role ENUM('client', 'admin', 'merchant') NOT NULL DEFAULT 'client'");

  // بيانات التاجر: المحل والسجل التجاري والعقد ونسبة العمولة
  await pool.query(`
    CREATE TABLE IF NOT EXISTS merchants (
      user_id INT PRIMARY KEY,
      store_name VARCHAR(255) NOT NULL,
      logo_url TEXT,
      phone VARCHAR(30) NOT NULL,
      city VARCHAR(100) NOT NULL,
      address TEXT,
      tax_number VARCHAR(20) NOT NULL,
      commercial_register VARCHAR(20) NOT NULL,
      cr_document_url TEXT NOT NULL,
      iban VARCHAR(34),
      commission_rate DECIMAL(5, 2) NOT NULL DEFAULT 10.00,
      status ENUM('pending', 'approved', 'rejected', 'suspended') NOT NULL DEFAULT 'pending',
      admin_note TEXT,
      contract_version VARCHAR(20) NOT NULL,
      contract_accepted_at TIMESTAMP NOT NULL,
      reviewed_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_tax_number (tax_number),
      UNIQUE KEY uq_commercial_register (commercial_register),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ${TABLE_OPTS}
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS parts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      part_name VARCHAR(255) NOT NULL,
      make VARCHAR(100),
      model VARCHAR(100),
      year INT,
      vin VARCHAR(100),
      price DECIMAL(10, 2) NOT NULL,
      category ENUM('parts', 'salvage') DEFAULT 'parts',
      image_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ${TABLE_OPTS}
  `);
  await tryQuery("ALTER TABLE parts ADD COLUMN category ENUM('parts', 'salvage') DEFAULT 'parts'");
  // القطعة اللي merchant_id حقها NULL ملك للمتجر نفسه (الإدارة)
  await tryQuery("ALTER TABLE parts ADD COLUMN merchant_id INT NULL");
  await tryQuery("ALTER TABLE parts ADD INDEX idx_parts_merchant (merchant_id)");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      user_name VARCHAR(255) NOT NULL,
      user_email VARCHAR(255) NOT NULL,
      total_price DECIMAL(10, 2) NOT NULL,
      items_summary TEXT NOT NULL,
      payment_method VARCHAR(255) DEFAULT 'دفع إلكتروني',
      status VARCHAR(50) DEFAULT 'معلق',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ${TABLE_OPTS}
  `);
  await tryQuery("ALTER TABLE orders ADD COLUMN payment_method VARCHAR(255) DEFAULT 'دفع إلكتروني'");
  // الجداول القديمة انعملت بترميز غير utf8mb4 — نحوّلها مرة واحدة
  await tryQuery("ALTER TABLE orders CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

  // عناصر الطلب: كل قطعة في صف مستقل بسعرها وقت الشراء
  await migrateLegacyOrderItems();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      part_id INT NULL,
      part_name VARCHAR(255) NOT NULL,
      image_url TEXT,
      quantity INT NOT NULL,
      unit_price DECIMAL(10, 2) NOT NULL,
      merchant_id INT NULL,
      commission_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,
      commission_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
      merchant_net DECIMAL(10, 2) NOT NULL DEFAULT 0,
      INDEX idx_order_items_merchant (merchant_id),
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (part_id) REFERENCES parts(id) ON DELETE SET NULL
    ) ${TABLE_OPTS}
  `);

  // أعمدة العمولة لجدول order_items لو كان منشأ قبل نظام التجار
  await tryQuery("ALTER TABLE order_items ADD COLUMN merchant_id INT NULL");
  await tryQuery("ALTER TABLE order_items ADD COLUMN commission_rate DECIMAL(5, 2) NOT NULL DEFAULT 0");
  await tryQuery("ALTER TABLE order_items ADD COLUMN commission_amount DECIMAL(10, 2) NOT NULL DEFAULT 0");
  await tryQuery("ALTER TABLE order_items ADD COLUMN merchant_net DECIMAL(10, 2) NOT NULL DEFAULT 0");
  await tryQuery("ALTER TABLE order_items ADD INDEX idx_order_items_merchant (merchant_id)");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS custom_requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      user_name VARCHAR(255),
      user_email VARCHAR(255),
      part_name VARCHAR(255),
      make VARCHAR(100),
      model VARCHAR(100),
      year INT,
      vin VARCHAR(100),
      notes TEXT,
      category ENUM('parts', 'salvage') DEFAULT 'parts',
      status VARCHAR(100) DEFAULT 'قيد النظر',
      admin_reply TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ${TABLE_OPTS}
  `);
  await tryQuery("ALTER TABLE custom_requests ADD COLUMN category ENUM('parts', 'salvage') DEFAULT 'parts'");

  await seedAdmin();
}

// لو فيه جدول order_items قديم بأعمدة مختلفة، نعيد تسميته كنسخة احتياطية (بدون حذف بيانات)
// عشان ينشأ الجدول الجديد بالأعمدة الصحيحة
/** نسبة العمولة الافتراضية للتاجر الجديد (٪) — الأدمن يقدر يغيّرها لكل تاجر */
export const DEFAULT_COMMISSION_RATE = (() => {
  const n = Number(process.env.DEFAULT_COMMISSION_RATE);
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : 10;
})();

const ORDER_ITEMS_COLUMNS = ["order_id", "part_id", "part_name", "image_url", "quantity", "unit_price"];
async function migrateLegacyOrderItems() {
  const [cols]: any = await pool.query(
    "SELECT COLUMN_NAME AS name FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_items'"
  );
  if (cols.length === 0) return;
  const existing = new Set(cols.map((c: any) => String(c.name).toLowerCase()));
  if (ORDER_ITEMS_COLUMNS.every((c) => existing.has(c))) return;

  const backup = `order_items_legacy_${Date.now()}`;
  await pool.query(`RENAME TABLE order_items TO \`${backup}\``);
  console.log(`جدول order_items القديم انحفظ باسم ${backup}`);
}

// إنشاء حساب الأدمن الرئيسي من متغيرات البيئة (بدل كتابته داخل الكود)
async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;

  const [rows]: any = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
  if (rows.length > 0) return;

  const hash = await bcrypt.hash(password, 10);
  await pool.query("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'admin')", [
    process.env.ADMIN_NAME || "الإدارة",
    email,
    hash,
  ]);
  console.log(`تم إنشاء حساب الأدمن الرئيسي: ${email}`);
}

// تُنفَّذ مرة واحدة فقط لكل تشغيل للسيرفر — كل API ينتظرها قبل استخدام قاعدة البيانات
let initPromise: Promise<void> | null = null;
export function ensureDB() {
  if (!initPromise) {
    initPromise = initDB().catch((err) => {
      initPromise = null; // نسمح بإعادة المحاولة في الطلب القادم
      console.error("خطأ تهيئة قاعدة البيانات:", err);
      throw err;
    });
  }
  return initPromise;
}
