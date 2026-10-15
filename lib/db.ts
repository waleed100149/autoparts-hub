import mysql from "mysql2/promise";

export const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "autoparts_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
});

async function initDB() {
  try {
    const connection = await pool.getConnection();

    await connection.query(`
      CREATE TABLE IF NOT EXISTS parts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        part_name VARCHAR(255) NOT NULL,
        make VARCHAR(100),
        model VARCHAR(100),
        year INT,
        vin VARCHAR(100),
        price DECIMAL(10, 2),
        category ENUM('parts', 'salvage') DEFAULT 'parts',
        image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    try {
      await connection.query(`
        ALTER TABLE parts ADD COLUMN category ENUM('parts', 'salvage') DEFAULT 'parts';
      `);
    } catch (err: any) {}

    await connection.query(`
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    try {
      await connection.query(`
        ALTER TABLE custom_requests ADD COLUMN category ENUM('parts', 'salvage') DEFAULT 'parts';
      `);
    } catch (err: any) {}

    connection.release();
  } catch (error) {
    console.error("خطأ تهيئة قاعدة البيانات:", error);
  }
}

initDB();