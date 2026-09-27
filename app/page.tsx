"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Part {
  id: number;
  part_name: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  price: number;
  created_at: string;
}

export default function HomePage() {
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchParts();
  }, []);

  const fetchParts = async () => {
    try {
      const res = await fetch("/api/parts");
      const data = await res.json();
      if (Array.isArray(data)) {
        setParts(data);
      }
    } catch (err) {
      console.error("خطأ في جلب القطع:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "40px 20px", maxWidth: "1000px", margin: "0 auto", direction: "rtl", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h1 style={{ fontSize: "28px", color: "#111" }}>منصة AutoParts Hub (قطع الغيار)</h1>
        <Link
          href="/add-part"
          style={{
            backgroundColor: "#0070f3",
            color: "#fff",
            padding: "10px 20px",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          + إضافة قطعة جديدة
        </Link>
      </div>

      {loading ? (
        <p style={{ textAlign: "center", color: "#666" }}>جاري تحميل القطع...</p>
      ) : parts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", backgroundColor: "#f9f9f9", borderRadius: "12px" }}>
          <p style={{ color: "#666", fontSize: "18px" }}>لا توجد قطع غيار مسجلة حالياً.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
          {parts.map((part) => (
            <div
              key={part.id}
              style={{
                border: "1px solid #e1e1e1",
                borderRadius: "12px",
                padding: "20px",
                backgroundColor: "#fff",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              }}
            >
              <h3 style={{ marginTop: 0, color: "#0070f3", fontSize: "20px" }}>{part.part_name}</h3>
              <p style={{ margin: "6px 0", color: "#444" }}>
                <strong>الشركة / الفئة:</strong> {part.make} - {part.model}
              </p>
              <p style={{ margin: "6px 0", color: "#444" }}>
                <strong>سنة التصنيع:</strong> {part.year || "غير محدد"}
              </p>
              {part.vin && (
                <p style={{ margin: "6px 0", color: "#666", fontSize: "14px" }}>
                  <strong>رقم الهيكل:</strong> {part.vin}
                </p>
              )}
              <div style={{ marginTop: "15px", paddingTop: "10px", borderTop: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "18px", fontWeight: "bold", color: "#28a745" }}>
                  {part.price} ريال
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}