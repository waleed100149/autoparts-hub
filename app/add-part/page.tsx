"use client";

import { useState } from "react";

export default function AddPartPage() {
  const [partName, setPartName] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [vin, setVin] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error" | ""; message: string }>({
    type: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      const response = await fetch("/api/add-part", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          part_name: partName,
          make: make,
          model: model,
          year: year,
          vin: vin,
          price: parseFloat(price) || 0,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setStatus({
          type: "error",
          message: result.error || "حدث خطأ أثناء الإضافة",
        });
      } else {
        setStatus({
          type: "success",
          message: "تمت إضافة قطعة الغيار بنجاح!",
        });
        setPartName("");
        setMake("");
        setModel("");
        setYear("");
        setVin("");
        setPrice("");
      }
    } catch {
      setStatus({
        type: "error",
        message: "تعذر الاتصال بالسيرفر",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "40px 20px", direction: "rtl" }}>
      <div style={{ background: "#fff", padding: "30px", borderRadius: "12px", width: "100%", maxWidth: "500px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", color: "#333" }}>
        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>إضافة قطعة غيار جديدة</h2>

        {status.message && (
          <div style={{ padding: "10px", marginBottom: "15px", borderRadius: "6px", textAlign: "center", backgroundColor: status.type === "success" ? "#d4edda" : "#f8d7da", color: status.type === "success" ? "#155724" : "#721c24" }}>
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label>اسم القطعة</label>
            <input type="text" value={partName} onChange={(e) => setPartName(e.target.value)} required style={inputStyle} />
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <div style={{ flex: 1 }}>
              <label>شركة السيارة (Make)</label>
              <input type="text" value={make} onChange={(e) => setMake(e.target.value)} required style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label> الفئة (Model)</label>
              <input type="text" value={model} onChange={(e) => setModel(e.target.value)} required style={inputStyle} />
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <div style={{ flex: 1 }}>
              <label>سنة التصنيع</label>
              <input type="text" value={year} onChange={(e) => setYear(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label>السعر (ريال)</label>
              <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required style={inputStyle} />
            </div>
          </div>

          <div>
            <label>رقم الهيكل (VIN)</label>
            <input type="text" value={vin} onChange={(e) => setVin(e.target.value)} style={inputStyle} />
          </div>

          <button type="submit" disabled={loading} style={{ padding: "12px", backgroundColor: "#0070f3", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", marginTop: "10px" }}>
            {loading ? "جاري الإضافة..." : "إضافة القطعة"}
          </button>
        </form>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "10px",
  marginTop: "4px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  boxSizing: "border-box" as const,
};