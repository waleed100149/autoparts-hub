"use client";

import { useState, useEffect } from "react";

interface Part {
  id: number;
  part_name: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  price: number;
  image_url?: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: "client" | "admin";
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<"client_login" | "client_register" | "admin_login">("client_login");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [authError, setAuthError] = useState("");

  const [activeTab, setActiveTab] = useState<"store" | "inventory" | "staff" | "orders">("store");
  const [parts, setParts] = useState<Part[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // حالة إضافة/تعديل قطعة
  const [partForm, setPartForm] = useState({
    id: 0,
    part_name: "",
    make: "",
    model: "",
    year: "",
    vin: "",
    price: "",
    image_url: "",
  });
  const [isEditing, setIsEditing] = useState(false);

  // حالة إضافة موظف جديد من داخل اللوحة
  const [employeeForm, setEmployeeForm] = useState({ name: "", email: "", password: "" });
  const [employeeMsg, setEmployeeMsg] = useState("");

  useEffect(() => {
    const savedUser = localStorage.getItem("autoparts_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchParts();
    }
  }, [user]);

  const fetchParts = async () => {
    try {
      const res = await fetch("/api/parts");
      if (res.ok) {
        const data = await res.json();
        setParts(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    try {
      const action = authMode === "client_register" ? "register" : "login";
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...authForm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "حدث خطأ أثناء تسجيل الدخول");

      setUser(data.user);
      localStorage.setItem("autoparts_user", JSON.stringify(data.user));
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmployeeMsg("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_employee", ...employeeForm }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "حدث خطأ");

      setEmployeeMsg("تمت إضافة الموظف/الإداري بنجاح!");
      setEmployeeForm({ name: "", email: "", password: "" });
    } catch (err: any) {
      setEmployeeMsg(`خطأ: ${err.message}`);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("autoparts_user");
  };

  const handleSavePart = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const endpoint = isEditing ? `/api/parts/${partForm.id}` : "/api/add-part";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partForm),
      });

      if (res.ok) {
        alert(isEditing ? "تم تعديل القطعة بنجاح" : "تمت إضافة القطعة للمخزن");
        setPartForm({ id: 0, part_name: "", make: "", model: "", year: "", vin: "", price: "", image_url: "" });
        setIsEditing(false);
        fetchParts();
      } else {
        const err = await res.json();
        alert(err.error || "حدث خطأ");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePart = async (id: number) => {
    if (!confirm("هل أنت تأكد من حذف هذه القطعة من المخزن؟")) return;
    try {
      const res = await fetch(`/api/parts/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchParts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // -------------------------------------------------------------
  // 1️⃣ واجهات تسجيل الدخول والخروج
  // -------------------------------------------------------------
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4" dir="rtl">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
              AutoParts Hub
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              {authMode === "admin_login"
                ? "بوابة تسجيل دخول الإدارة"
                : authMode === "client_login"
                ? "تسجيل دخول العملاء"
                : "إنشاء حساب عميل جديد"}
            </p>
          </div>

          {/* أزرار التحويل بين دخول العملاء ودخول الإدارة */}
          <div className="flex bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => {
                setAuthMode("client_login");
                setAuthError("");
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                authMode !== "admin_login" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              دخول العملاء
            </button>
            <button
              onClick={() => {
                setAuthMode("admin_login");
                setAuthError("");
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                authMode === "admin_login" ? "bg-amber-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              دخول الإدارة
            </button>
          </div>

          {authError && (
            <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded-lg text-sm text-center">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {authMode === "client_register" && (
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-300">الاسم الكامل</label>
                <input
                  type="text"
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                  value={authForm.name}
                  onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1 text-slate-300">البريد الإلكتروني</label>
              <input
                type="email"
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                value={authForm.email}
                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-slate-300">كلمة المرور</label>
              <input
                type="password"
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                value={authForm.password}
                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
              />
            </div>

            <button
              type="submit"
              className={`w-full py-3 rounded-lg font-semibold transition ${
                authMode === "admin_login" ? "bg-amber-600 hover:bg-amber-700" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {authMode === "admin_login"
                ? "دخول لوحة الإدارة"
                : authMode === "client_login"
                ? "تسجيل الدخول"
                : "إنشاء حساب"}
            </button>
          </form>

          {authMode !== "admin_login" && (
            <div className="text-center text-sm text-slate-400">
              {authMode === "client_login" ? (
                <p>
                  ليس لديك حساب؟{" "}
                  <button onClick={() => setAuthMode("client_register")} className="text-blue-400 hover:underline">
                    سجل الآن
                  </button>
                </p>
              ) : (
                <p>
                  لديك حساب بالفعل؟{" "}
                  <button onClick={() => setAuthMode("client_login")} className="text-blue-400 hover:underline">
                    سجل دخولك
                  </button>
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 2️⃣ الواجهة الرئيسية بعد الدخول
  // -------------------------------------------------------------
  const filteredParts = parts.filter(
    (p) =>
      p.part_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6" dir="rtl">
      {/* الهيدر العلوي */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
            منصة AutoParts Hub
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            مرحباً {user.name} —{" "}
            <span className={user.role === "admin" ? "text-amber-400 font-bold" : "text-blue-400"}>
              {user.role === "admin" ? "حساب الإدارة" : "حساب عميل"}
            </span>
          </p>
        </div>

        {/* أزرار التحكم والتبويب */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab("store")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === "store" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            تصفح القطع
          </button>

          {/* تبويبات الإدارة الحصرية */}
          {user.role === "admin" && (
            <>
              <button
                onClick={() => setActiveTab("inventory")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  activeTab === "inventory" ? "bg-amber-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                المخزن وإضافة قطع
              </button>
              <button
                onClick={() => setActiveTab("staff")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  activeTab === "staff" ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                إضافة موظفين/إداريين
              </button>
              <button
                onClick={() => setActiveTab("orders")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  activeTab === "orders" ? "bg-purple-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                إدارة الطلبات
              </button>
            </>
          )}

          <button onClick={handleLogout} className="text-red-400 hover:bg-red-500/10 px-4 py-2 rounded-lg text-sm border border-red-500/20 mr-2">
            خروج
          </button>
        </div>
      </header>

      {/* المحتوى الرئيسي */}
      <main className="max-w-7xl mx-auto">
        {/* TAB 1: تصفح المتجر */}
        {activeTab === "store" && (
          <div className="space-y-6">
            <input
              type="text"
              placeholder="ابحث باسم القطعة، الماركة، أو الموديل..."
              className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-sm w-full md:w-96 focus:outline-none focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredParts.map((part) => (
                <div key={part.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between p-4">
                  <div className="space-y-3">
                    <div className="h-40 bg-slate-800 rounded-lg overflow-hidden flex items-center justify-center">
                      {part.image_url ? (
                        <img src={part.image_url} alt={part.part_name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-slate-500 text-xs">لا توجد صورة</span>
                      )}
                    </div>
                    <h3 className="font-bold text-lg text-blue-400">{part.part_name}</h3>
                    <p className="text-xs text-slate-400">{part.make} - {part.model} ({part.year})</p>
                    <p className="text-xs text-slate-500">VIN: {part.vin || "غير محدد"}</p>
                    <p className="text-lg font-bold text-emerald-400">{part.price} ريال</p>
                  </div>
                  <button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 py-2 rounded-lg text-sm font-semibold transition">
                    طلب القطعة
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: إدارة المخزن والقطع */}
        {activeTab === "inventory" && user.role === "admin" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4 h-fit">
              <h2 className="text-xl font-bold text-amber-400">
                {isEditing ? "تعديل قطعة" : "إضافة قطعة جديدة للمخزن"}
              </h2>

              <form onSubmit={handleSavePart} className="space-y-3">
                <input
                  type="text"
                  placeholder="اسم القطعة"
                  required
                  className="w-full bg-slate-800 border border-slate-700 p-2.5 rounded-lg text-sm"
                  value={partForm.part_name}
                  onChange={(e) => setPartForm({ ...partForm, part_name: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="الشركة (Make)"
                    required
                    className="bg-slate-800 border border-slate-700 p-2.5 rounded-lg text-sm"
                    value={partForm.make}
                    onChange={(e) => setPartForm({ ...partForm, make: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="الموديل (Model)"
                    required
                    className="bg-slate-800 border border-slate-700 p-2.5 rounded-lg text-sm"
                    value={partForm.model}
                    onChange={(e) => setPartForm({ ...partForm, model: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="السنة (Year)"
                    className="bg-slate-800 border border-slate-700 p-2.5 rounded-lg text-sm"
                    value={partForm.year}
                    onChange={(e) => setPartForm({ ...partForm, year: e.target.value })}
                  />
                  <input
                    type="number"
                    placeholder="السعر (ريال)"
                    required
                    className="bg-slate-800 border border-slate-700 p-2.5 rounded-lg text-sm"
                    value={partForm.price}
                    onChange={(e) => setPartForm({ ...partForm, price: e.target.value })}
                  />
                </div>
                <input
                  type="text"
                  placeholder="رقم الهيكل (VIN)"
                  className="w-full bg-slate-800 border border-slate-700 p-2.5 rounded-lg text-sm"
                  value={partForm.vin}
                  onChange={(e) => setPartForm({ ...partForm, vin: e.target.value })}
                />
                <input
                  type="url"
                  placeholder="رابط الصورة (Image URL)"
                  className="w-full bg-slate-800 border border-slate-700 p-2.5 rounded-lg text-sm"
                  value={partForm.image_url}
                  onChange={(e) => setPartForm({ ...partForm, image_url: e.target.value })}
                />

                <div className="flex gap-2 pt-2">
                  <button type="submit" className="flex-1 bg-amber-600 hover:bg-amber-700 py-2.5 rounded-lg font-bold text-sm">
                    {isEditing ? "تحديث القطعة" : "إضافة للمخزن"}
                  </button>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setPartForm({ id: 0, part_name: "", make: "", model: "", year: "", vin: "", price: "", image_url: "" });
                      }}
                      className="bg-slate-700 px-4 py-2.5 rounded-lg text-sm"
                    >
                      إلغاء
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-xl">
              <h2 className="text-xl font-bold mb-4">قائمة القطع في المخزن</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead className="bg-slate-800 text-slate-400">
                    <tr>
                      <th className="p-3">اسم القطعة</th>
                      <th className="p-3">السيارة</th>
                      <th className="p-3">السعر</th>
                      <th className="p-3">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parts.map((p) => (
                      <tr key={p.id} className="border-b border-slate-800">
                        <td className="p-3 font-semibold text-blue-400">{p.part_name}</td>
                        <td className="p-3">{p.make} {p.model} ({p.year})</td>
                        <td className="p-3 text-emerald-400 font-bold">{p.price} ريال</td>
                        <td className="p-3 flex gap-2">
                          <button
                            onClick={() => {
                              setIsEditing(true);
                              setPartForm({
                                id: p.id,
                                part_name: p.part_name,
                                make: p.make,
                                model: p.model,
                                year: p.year?.toString() || "",
                                vin: p.vin || "",
                                price: p.price.toString(),
                                image_url: p.image_url || "",
                              });
                            }}
                            className="bg-blue-600/20 text-blue-400 px-3 py-1 rounded hover:bg-blue-600/30 text-xs"
                          >
                            تعديل
                          </button>
                          <button
                            onClick={() => handleDeletePart(p.id)}
                            className="bg-red-600/20 text-red-400 px-3 py-1 rounded hover:bg-red-600/30 text-xs"
                          >
                            حذف
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: إضافة حسابات موظفين/إداريين جدد (خاص بالأدمن) */}
        {activeTab === "staff" && user.role === "admin" && (
          <div className="max-w-xl mx-auto bg-slate-900 border border-slate-800 p-8 rounded-xl space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-emerald-400">إضافة موظف/إداري جديد</h2>
              <p className="text-slate-400 text-xs mt-1">يمكنك إضافة حسابات للموظفين مع اختيار البريد وكلمة المرور الخاصة بهم للوصول للوحة التحكم.</p>
            </div>

            {employeeMsg && (
              <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg text-sm text-center text-emerald-400">
                {employeeMsg}
              </div>
            )}

            <form onSubmit={handleAddEmployee} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-300">اسم الموظف</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: أحمد علي"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  value={employeeForm.name}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-slate-300">البريد الإلكتروني للموظف</label>
                <input
                  type="email"
                  required
                  placeholder="employee@autoparts.com"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  value={employeeForm.email}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-slate-300">كلمة المرور المحددة له</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  value={employeeForm.password}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, password: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 py-3 rounded-lg font-bold text-white transition"
              >
                إنشاء حساب الموظف
              </button>
            </form>
          </div>
        )}

        {/* TAB 4: إدارة الطلبات */}
        {activeTab === "orders" && user.role === "admin" && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
            <h2 className="text-xl font-bold text-purple-400">طلبات العملاء الواردة</h2>
            <div className="p-8 text-center text-slate-500 bg-slate-950/50 rounded-lg border border-slate-800">
              لا توجد طلبات معلقة حالياً.
            </div>
          </div>
        )}
      </main>
    </div>
  );
}