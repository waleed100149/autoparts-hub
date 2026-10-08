import mysql from "mysql2/promise";

export const pool = mysql.createPool({
  host: "localhost",
  user: "root",            // اسم المستخدم الخاص بك
  password: "",            // كلمة المرور (اتركها فارغة إذا لم تكن مجهزة)
  database: "autoparts_db", // اسم قاعدة البيانات المكتشفة
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});