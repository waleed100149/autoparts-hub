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
  category: "parts" | "salvage";
  image_url?: string;
}

interface CartItem extends Part {
  quantity: number;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: "client" | "admin";
}

interface Order {
  id: number;
  user_name: string;
  user_email: string;
  total_price: number;
  items_summary: string;
  payment_method?: string;
  status: string;
  created_at: string;
}

interface CustomRequest {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  part_name: string;
  make: string;
  model: string;
  year?: number;
  vin?: string;
  notes?: string;
  category?: "parts" | "salvage";
  status: string;
  admin_reply?: string;
  created_at: string;
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<"client_login" | "client_register" | "admin_login">("client_login");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [authError, setAuthError] = useState("");

  const [selectedCategory, setSelectedCategory] = useState<"parts" | "salvage" | null>(null);
  const [activeTab, setActiveTab] = useState<"store" | "cart" | "my_orders" | "custom_request" | "inventory" | "staff" | "orders" | "custom_admin">("store");
  const [parts, setParts] = useState<Part[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customRequests, setCustomRequests] = useState<CustomRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // حالات نافذة الدفع المتعددة
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "reservation" | "bank_transfer">("card");

  const [cardForm, setCardForm] = useState({
    cardNumber: "4000 1234 5678 9010",
    cardHolder: "",
    expiry: "12/28",
    cvc: "123",
  });

  const [partForm, setPartForm] = useState({
    id: 0,
    part_name: "",
    make: "",
    model: "",
    year: "",
    vin: "",
    price: "",
    category: "parts" as "parts" | "salvage",
    image_url: "",
  });
  const [isEditing, setIsEditing] = useState(false);

  const [employeeForm, setEmployeeForm] = useState({ name: "", email: "", password: "" });
  const [employeeMsg, setEmployeeMsg] = useState("");

  const [customForm, setCustomForm] = useState({
    part_name: "",
    make: "",
    model: "",
    year: "",
    vin: "",
    category: "parts" as "parts" | "salvage",
    notes: "",
  });

  const [replyInputs, setReplyInputs] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    const savedUser = localStorage.getItem("autoparts_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    if (user) {
      if (selectedCategory) {
        fetchParts(selectedCategory);
      } else {
        fetchAllParts();
      }

      if (user.role === "admin") {
        fetchOrdersAdmin();
        fetchCustomRequestsAdmin();
      } else {
        fetchMyOrders(user.id);
        fetchCustomRequestsClient(user.id);
      }
    }
  }, [user, selectedCategory]);

  const fetchAllParts = async () => {
    try {
      const res = await fetch("/api/parts");
      if (res.ok) {
        const data = await res.json();
        setParts(data);
      }
    } catch (err) {
      console.error("خطأ جلب القطع:", err);
    }
  };

  const fetchParts = async (category: "parts" | "salvage") => {
    try {
      const res = await fetch(`/api/parts?category=${category}`);
      if (res.ok) {
        const data = await res.json();
        setParts(data);
      }
    } catch (err) {
      console.error("خطأ جلب القطع حسب القسم:", err);
    }
  };

  const fetchOrdersAdmin = async () => {
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error("خطأ جلب الطلبات:", err);
    }
  };

  const fetchMyOrders = async (userId: number) => {
    try {
      const res = await fetch(`/api/orders?user_id=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error("خطأ جلب طلبات العميل:", err);
    }
  };

  const fetchCustomRequestsAdmin = async () => {
    try {
      const res = await fetch("/api/custom-requests");
      if (res.ok) {
        const data = await res.json();
        setCustomRequests(data);
      }
    } catch (err) {
      console.error("خطأ جلب الطلبات الخاصة للإدارة:", err);
    }
  };

  const fetchCustomRequestsClient = async (userId: number) => {
    try {
      const res = await fetch(`/api/custom-requests?user_id=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setCustomRequests(data);
      }
    } catch (err) {
      console.error("خطأ جلب الطلبات الخاصة للعميل:", err);
    }
  };

  const handleUpdateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      const res = await fetch("/api/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId, status: newStatus }),
      });

      if (res.ok) {
        fetchOrdersAdmin();
      } else {
        const data = await res.json();
        alert(data.error || "فشل تغيير حالة الطلب");
      }
    } catch (err) {
      console.error("خطأ تحديث حالة الطلب:", err);
    }
  };

  const handleSendCustomRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const res = await fetch("/api/custom-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          user_name: user.name,
          user_email: user.email,
          part_name: customForm.part_name,
          make: customForm.make,
          model: customForm.model,
          year: customForm.year,
          vin: customForm.vin,
          category: customForm.category,
          notes: customForm.notes,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message || "تم إرسال الطلب بنجاح!");
        setCustomForm({ part_name: "", make: "", model: "", year: "", vin: "", category: "parts", notes: "" });
        fetchCustomRequestsClient(user.id);
      } else {
        alert(data.error || "حدث خطأ أثناء إرسال الطلب");
      }
    } catch (err) {
      console.error(err);
      alert("حدث خطأ في الاتصال بالخادم");
    }
  };

  const handleReplyCustomRequest = async (requestId: number, newStatus: string) => {
    const adminReply = replyInputs[requestId] || "";
    if (!adminReply && !confirm("هل تريد إرسال الحالة بدون كتابة ملاحظة؟")) {
      return;
    }

    try {
      const res = await fetch("/api/custom-requests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_id: requestId,
          status: newStatus,
          admin_reply: adminReply,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("تم حفظ الرد وتحديث حالة الطلب بنجاح!");
        fetchCustomRequestsAdmin();
      } else {
        alert(data.error || "حدث خطأ أثناء الرد");
      }
    } catch (err) {
      console.error(err);
      alert("حدث خطأ في الاتصال بالخادم");
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    try {
      const action = authMode === "client_register" ? "register" : "login";
      const role = authMode === "admin_login" ? "admin" : "client";

      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, role, ...authForm }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "حدث خطأ أثناء الدخول");

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
      if (!res.ok) throw new Error(data.error || "حدث خطأ أثناء إضافة الموظف");

      setEmployeeMsg("تمت إضافة الموظف/الإداري بنجاح!");
      setEmployeeForm({ name: "", email: "", password: "" });
    } catch (err: any) {
      setEmployeeMsg(`خطأ: ${err.message}`);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCart([]);
    setSelectedCategory(null);
    localStorage.removeItem("autoparts_user");
  };

  const addToCart = (part: Part) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === part.id);
      if (existing) {
        return prevCart.map((item) =>
          item.id === part.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...part, quantity: 1 }];
    });
    alert(`تمت إضافة "${part.part_name}" إلى السلة بنجاح!`);
  };

  const updateCartQuantity = (id: number, delta: number) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (id: number) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const calculateFinalTotal = () => {
    const base = calculateSubtotal();
    return paymentMethod === "reservation" ? base + 150 : base;
  };

  const handleOpenCheckoutModal = () => {
    if (cart.length === 0 || !user) return;
    setCardForm((prev) => ({ ...prev, cardHolder: user.name }));
    setShowPaymentModal(true);
  };

  // إرسال الطلب وحفظ طريقة الدفع المحددة
  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentLoading(true);

    const paymentText =
      paymentMethod === "bank_transfer"
        ? "تحويل بنكي"
        : paymentMethod === "reservation"
        ? "نظام حجز (+150)"
        : "دفع إلكتروني";

    setTimeout(async () => {
      try {
        const finalPrice = calculateFinalTotal();
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: user!.id,
            user_name: user!.name,
            user_email: user!.email,
            total_price: finalPrice,
            items: cart,
            payment_method: paymentText,
          }),
        });

        setPaymentLoading(false);
        setShowPaymentModal(false);

        if (res.ok) {
          alert(`✅ تم طلبك بنجاح وطريقة الدفع المحددة: (${paymentText})`);
          setCart([]);
          fetchMyOrders(user!.id);
          setActiveTab("my_orders");
        } else {
          const data = await res.json();
          alert(data.error || "فشل إرسال الطلب");
        }
      } catch (err) {
        setPaymentLoading(false);
        setShowPaymentModal(false);
        console.error(err);
        alert("حدث خطأ أثناء الاتصال الخادمي");
      }
    }, 1800);
  };

  const handleSavePart = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const endpoint = "/api/add-part";
      const method = isEditing ? "PUT" : "POST";

      const cleanedData = {
        id: isEditing ? Number(partForm.id) : null,
        part_name: partForm.part_name || null,
        make: partForm.make || null,
        model: partForm.model || null,
        year: partForm.year ? Number(partForm.year) : null,
        vin: partForm.vin || null,
        price: partForm.price ? Number(partForm.price) : null,
        category: partForm.category,
        image_url: partForm.image_url || null,
      };

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanedData),
      });

      const data = await res.json();

      if (res.ok) {
        alert(isEditing ? "تم تعديل القطعة بنجاح" : "تمت إضافة القطعة للمخزن");
        setPartForm({ id: 0, part_name: "", make: "", model: "", year: "", vin: "", price: "", category: "parts", image_url: "" });
        setIsEditing(false);
        if (selectedCategory) fetchParts(selectedCategory);
        else fetchAllParts();
      } else {
        alert(data.error || "حدث خطأ عند حفظ البيانات");
      }
    } catch (err: any) {
      console.error(err);
      alert("حدث خطأ في الاتصال بالخادم");
    }
  };

  const handleDeletePart = async (id: number) => {
    if (!confirm("هل أنت تأكد من حذف هذه القطعة من المخزن؟")) return;
    try {
      const res = await fetch(`/api/parts/${id}`, { method: "DELETE" });
      if (res.ok) {
        if (selectedCategory) fetchParts(selectedCategory);
        else fetchAllParts();
      } else {
        const data = await res.json().catch(() => ({ error: "تعذر الحذف" }));
        alert(data.error || "فشل عملية الحذف");
      }
    } catch (err) {
      console.error(err);
      alert("حدث خطأ في الاتصال بالخادم");
    }
  };

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
                ? "بوابة دخول الإدارة والموظفين"
                : authMode === "client_login"
                ? "تسجيل دخول العملاء"
                : "إنشاء حساب عميل جديد"}
            </p>
          </div>

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

  const filteredParts = parts.filter(
    (p) =>
      p.part_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.model?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6" dir="rtl">
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

        <div className="flex gap-2 flex-wrap items-center">
          <button
            onClick={() => {
              setSelectedCategory(null);
              setActiveTab("store");
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === "store" && !selectedCategory ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            الرئيسية (الأقسام)
          </button>

          {user.role === "client" && (
            <>
              <button
                onClick={() => setActiveTab("cart")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition relative flex items-center gap-2 ${
                  activeTab === "cart" ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                🛒 السلة
                {totalCartCount > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                    {totalCartCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  fetchMyOrders(user.id);
                  setActiveTab("my_orders");
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  activeTab === "my_orders" ? "bg-purple-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                📦 سجل طلباتي
              </button>

              <button
                onClick={() => {
                  fetchCustomRequestsClient(user.id);
                  setActiveTab("custom_request");
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  activeTab === "custom_request" ? "bg-cyan-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                🔍 طلب قطعة غير متوفرة
              </button>
            </>
          )}

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
                onClick={() => {
                  fetchOrdersAdmin();
                  setActiveTab("orders");
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  activeTab === "orders" ? "bg-purple-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                إدارة الطلبات
              </button>
              <button
                onClick={() => {
                  fetchCustomRequestsAdmin();
                  setActiveTab("custom_admin");
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  activeTab === "custom_admin" ? "bg-cyan-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                📋 طلبات القطع الخاصة
              </button>
            </>
          )}

          <button onClick={handleLogout} className="text-red-400 hover:bg-red-500/10 px-4 py-2 rounded-lg text-sm border border-red-500/20 mr-2">
            خروج
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        {/* 1. اختيار القسم عند الدخول */}
        {activeTab === "store" && !selectedCategory && (
          <div className="max-w-4xl mx-auto text-center py-12 space-y-8">
            <div>
              <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                مرحباً بك في منصة AutoParts Hub
              </h1>
              <p className="text-slate-400 mt-2 text-lg">اختر القسم الذي تريد تصفحه للشراء</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
              <button
                onClick={() => setSelectedCategory("parts")}
                className="bg-slate-900 border-2 border-slate-800 hover:border-blue-500 rounded-2xl p-8 space-y-4 text-right transition transform hover:-translate-y-1 shadow-xl group"
              >
                <div className="w-16 h-16 bg-blue-500/10 rounded-xl flex items-center justify-center text-3xl text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition">
                  ⚙️
                </div>
                <h2 className="text-2xl font-bold text-white">قسم قطع الغيار (جديد / وكالة)</h2>
                <p className="text-sm text-slate-400">تصفح القطع الاستهلاكية المعتمدة والأصلية المتاحة في المخزن.</p>
                <span className="inline-block text-sm font-semibold text-blue-400 group-hover:underline">
                  تصفح القطع ←
                </span>
              </button>

              <button
                onClick={() => setSelectedCategory("salvage")}
                className="bg-slate-900 border-2 border-slate-800 hover:border-amber-500 rounded-2xl p-8 space-y-4 text-right transition transform hover:-translate-y-1 shadow-xl group"
              >
                <div className="w-16 h-16 bg-amber-500/10 rounded-xl flex items-center justify-center text-3xl text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition">
                  🚘
                </div>
                <h2 className="text-2xl font-bold text-white">قسم قطع التشاليح (مستعمل)</h2>
                <p className="text-sm text-slate-400">قطع تشاليح أصلية مفكوكة ومفحوصة بأسعار مناسبة.</p>
                <span className="inline-block text-sm font-semibold text-amber-400 group-hover:underline">
                  تصفح قسم التشاليح ←
                </span>
              </button>
            </div>
          </div>
        )}

        {/* 2. تصفح المتجر بالقسم المختار */}
        {activeTab === "store" && selectedCategory && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300"
                >
                  ↩ تغيير القسم
                </button>
                <h2 className="text-xl font-bold text-white">
                  أنت تتصفح الآن:{" "}
                  <span className={selectedCategory === "parts" ? "text-blue-400" : "text-amber-400"}>
                    {selectedCategory === "parts" ? "قسم قطع الغيار" : "قسم التشاليح"}
                  </span>
                </h2>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedCategory("parts")}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                    selectedCategory === "parts" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  ⚙️ قطع الغيار
                </button>
                <button
                  onClick={() => setSelectedCategory("salvage")}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                    selectedCategory === "salvage" ? "bg-amber-600 text-white" : "bg-slate-800 text-slate-400"
                  }`}
                >
                  🚘 التشاليح
                </button>
              </div>
            </div>

            <input
              type="text"
              placeholder="ابحث باسم القطعة، الماركة، أو الموديل..."
              className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 text-sm w-full md:w-96 focus:outline-none focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredParts.map((part) => (
                <div key={part.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between p-4 shadow-lg hover:border-slate-700 transition">
                  <div className="space-y-3">
                    <div className="h-40 bg-slate-800 rounded-lg overflow-hidden flex items-center justify-center">
                      {part.image_url ? (
                        <img src={part.image_url} alt={part.part_name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-slate-500 text-xs">لا توجد صورة</span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-lg text-blue-400">{part.part_name}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${part.category === 'salvage' ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'}`}>
                        {part.category === 'salvage' ? 'تشاليح' : 'قطع غيار'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{part.make} {part.model} ({part.year})</p>
                    <p className="text-xs text-slate-500">
                      {part.category === "salvage" ? "الحالة:" : "VIN:"} {part.vin || "غير محدد"}
                    </p>
                    <p className="text-lg font-bold text-emerald-400">{part.price} ريال</p>
                  </div>
                  {user.role === "client" ? (
                    <button
                      onClick={() => addToCart(part)}
                      className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 py-2 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2"
                    >
                      🛒 إضافة للسلة
                    </button>
                  ) : (
                    <div className="mt-4 p-2 text-center text-xs text-slate-500 bg-slate-800/50 rounded-lg">
                      معاينة كإدارة
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. واجهة عرض السلة والشراء */}
        {activeTab === "cart" && user.role === "client" && (
          <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
            <h2 className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
              🛒 سلة المشتريات
            </h2>

            {cart.length === 0 ? (
              <div className="text-center py-12 text-slate-500 bg-slate-950/40 rounded-lg border border-slate-800">
                السلة فارغة حالياً. اضف بعض القطع من المتجر!
              </div>
            ) : (
              <div className="space-y-4">
                <div className="divide-y divide-slate-800">
                  {cart.map((item) => (
                    <div key={item.id} className="py-4 flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-slate-800 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.part_name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-slate-500 text-[10px]">لا توجد صورة</span>
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-blue-400">{item.part_name}</h4>
                          <p className="text-xs text-slate-400">{item.make} {item.model} ({item.year})</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${item.category === 'salvage' ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'}`}>
                            {item.category === 'salvage' ? 'تشاليح' : 'قطع غيار'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                          <button
                            onClick={() => updateCartQuantity(item.id, -1)}
                            className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white font-bold"
                          >
                            -
                          </button>
                          <span className="px-4 py-1 text-sm font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(item.id, 1)}
                            className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white font-bold"
                          >
                            +
                          </button>
                        </div>

                        <p className="font-bold text-amber-400 w-24 text-left">
                          {item.price * item.quantity} ريال
                        </p>

                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-400 hover:text-red-300 text-sm font-semibold"
                        >
                          إزالة
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center mt-6">
                  <div>
                    <p className="text-xs text-slate-400">الإجمالي الكلي:</p>
                    <p className="text-2xl font-bold text-emerald-400">{calculateSubtotal()} ريال</p>
                  </div>
                  <button
                    onClick={handleOpenCheckoutModal}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-lg font-bold transition shadow-lg flex items-center gap-2"
                  >
                    💳 الانتقال للدفع والتعميد
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 💳 نافذة طرق الدفع المتقدمة */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50" dir="rtl">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="text-xl font-bold text-emerald-400 flex items-center gap-2">
                  💳 اختيار طريقة الدفع والتعميد
                </h3>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-slate-400 hover:text-white font-bold text-lg"
                >
                  ✕
                </button>
              </div>

              {/* أزرار اختيار طريقة الدفع */}
              <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("card")}
                  className={`py-2 text-xs font-bold rounded-lg transition ${
                    paymentMethod === "card" ? "bg-emerald-600 text-white shadow" : "text-slate-400 hover:text-white"
                  }`}
                >
                  💳 دفع إلكتروني
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("reservation")}
                  className={`py-2 text-xs font-bold rounded-lg transition ${
                    paymentMethod === "reservation" ? "bg-amber-600 text-white shadow" : "text-slate-400 hover:text-white"
                  }`}
                >
                  📌 نظام حجز (+150)
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("bank_transfer")}
                  className={`py-2 text-xs font-bold rounded-lg transition ${
                    paymentMethod === "bank_transfer" ? "bg-purple-600 text-white shadow" : "text-slate-400 hover:text-white"
                  }`}
                >
                  🏦 تحويل بنكي
                </button>
              </div>

              {/* ملخص المبلغ */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>المبلغ الأساسي للقطع:</span>
                  <span>{calculateSubtotal()} ريال</span>
                </div>

                {paymentMethod === "reservation" && (
                  <div className="flex justify-between text-xs text-amber-400 font-semibold">
                    <span>رسوم خدمة نظام الحجز والتثبيت:</span>
                    <span>+ 150 ريال</span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                  <span className="text-slate-200 font-bold text-sm">المبلغ الإجمالي النهائي:</span>
                  <span className="text-2xl font-bold text-emerald-400">{calculateFinalTotal()} ريال</span>
                </div>
              </div>

              <form onSubmit={handleProcessPayment} className="space-y-4">
                {/* 1. خيار الدفع بالبطاقة */}
                {paymentMethod === "card" && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-slate-300 font-semibold mb-1">اسم حامل البطاقة</label>
                      <input
                        type="text"
                        required
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                        value={cardForm.cardHolder}
                        onChange={(e) => setCardForm({ ...cardForm, cardHolder: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-300 font-semibold mb-1">رقم البطاقة (مدى / فيزا)</label>
                      <input
                        type="text"
                        required
                        maxLength={19}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white tracking-widest text-left"
                        value={cardForm.cardNumber}
                        onChange={(e) => setCardForm({ ...cardForm, cardNumber: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-slate-300 font-semibold mb-1">تاريخ الانتهاء</label>
                        <input
                          type="text"
                          required
                          placeholder="MM/YY"
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white text-center"
                          value={cardForm.expiry}
                          onChange={(e) => setCardForm({ ...cardForm, expiry: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-300 font-semibold mb-1">CVC</label>
                        <input
                          type="password"
                          required
                          maxLength={4}
                          placeholder="•••"
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white text-center"
                          value={cardForm.cvc}
                          onChange={(e) => setCardForm({ ...cardForm, cvc: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. خيار نظام الحجز (+150 ريال) */}
                {paymentMethod === "reservation" && (
                  <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl space-y-3 text-xs text-slate-200">
                    <p className="font-bold text-amber-400 text-sm">📌 نظام حجز القطعة وتأكيدها:</p>
                    <p>
                      يتيح لك هذا النظام حجز القطعة في المستودع لمدة 48 ساعة لمنع بيعها، وتضاف **150 ريال** كرسوم حجز إداري وتأكيد.
                    </p>
                    <div className="space-y-2 pt-1">
                      <label className="block text-xs text-slate-300 font-semibold">رقم التواصل للتأكيد مع المستودع</label>
                      <input
                        type="tel"
                        required
                        placeholder="05xxxxxxxx"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white text-left"
                      />
                    </div>
                  </div>
                )}

                {/* 3. خيار التحويل البنكي */}
                {paymentMethod === "bank_transfer" && (
                  <div className="bg-purple-500/10 border border-purple-500/30 p-4 rounded-xl space-y-3 text-xs text-slate-200">
                    <p className="font-bold text-purple-400 text-sm">🏦 بيانات الحساب البنكي الرسمي:</p>
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1 text-slate-300 text-[11px]">
                      <p><strong className="text-slate-100">اسم البنك:</strong> مصرف الراجحي</p>
                      <p><strong className="text-slate-100">اسم الحساب:</strong> شركة AutoParts Hub المحدودة</p>
                      <p><strong className="text-slate-100">الآيبان (IBAN):</strong> <span className="font-mono text-emerald-400">SA44 8000 0000 6080 1010 9999</span></p>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-300 font-semibold mb-1">اسم المحوّل (كما هو في الحساب البنكي)</label>
                      <input
                        type="text"
                        required
                        placeholder="أدخل اسم المحوّل"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-white"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={paymentLoading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 text-white py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-lg"
                  >
                    {paymentLoading ? (
                      <>
                        <span className="animate-spin text-lg">⏳</span> جاري الاتصال وتأكيد العملية...
                      </>
                    ) : (
                      `تأكيد وإكمال الطلب (${calculateFinalTotal()} ريال)`
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 4. سجل طلباتي */}
        {activeTab === "my_orders" && user.role === "client" && (
          <div className="max-w-5xl mx-auto bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-6">
            <h2 className="text-2xl font-bold text-purple-400 flex items-center gap-2">
              📦 سجل طلباتي المشتراة
            </h2>

            {orders.length === 0 ? (
              <div className="p-12 text-center text-slate-500 bg-slate-950/50 rounded-lg border border-slate-800">
                لم تقم بطلب أي قطع بعد عبر السلة.
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((ord) => (
                  <div key={ord.id} className="bg-slate-950 p-5 rounded-xl border border-slate-800 flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-lg text-blue-400">طلب #{ord.id}</span>
                        <span
                          className={`px-3 py-0.5 rounded-full text-xs font-bold ${
                            ord.status === "مكتمل"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : ord.status === "ملغي"
                              ? "bg-red-500/10 text-red-400 border border-red-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}
                        >
                          {ord.status}
                        </span>
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded text-xs font-bold">
                          {ord.payment_method || "دفع إلكتروني"}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-300">القطع: {ord.items_summary}</p>
                      <p className="text-xs text-slate-500">تاريخ الطلب: {new Date(ord.created_at).toLocaleString("ar-SA")}</p>
                    </div>

                    <div className="text-left bg-slate-900 p-3 rounded-lg border border-slate-800/80">
                      <span className="text-xs text-slate-400 block">إجمالي المبلغ المدفوع:</span>
                      <span className="text-xl font-bold text-emerald-400">{ord.total_price} ريال</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 5. طلب قطعة غير متوفرة */}
        {activeTab === "custom_request" && user.role === "client" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4 h-fit">
              <div>
                <h2 className="text-xl font-bold text-cyan-400">طلب قطعة غير متوفرة</h2>
                <p className="text-xs text-slate-400 mt-1">أدخل مواصفات القطعة وحدد القسم المطلوبة فيه وسنرد عليك فوراً.</p>
              </div>

              <form onSubmit={handleSendCustomRequest} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">توجيه الطلب الخاص إلى قسم:</label>
                  <select
                    className="w-full bg-slate-800 border border-slate-700 p-2.5 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
                    value={customForm.category}
                    onChange={(e) => setCustomForm({ ...customForm, category: e.target.value as "parts" | "salvage" })}
                  >
                    <option value="parts">⚙️ قسم قطع الغيار (جديدة/وكالة)</option>
                    <option value="salvage">🚘 قسم التشاليح (مستعملة/تشليح)</option>
                  </select>
                </div>

                <input
                  type="text"
                  placeholder="اسم القطعة المطلوبة"
                  required
                  className="w-full bg-slate-800 border border-slate-700 p-2.5 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
                  value={customForm.part_name}
                  onChange={(e) => setCustomForm({ ...customForm, part_name: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="الشركة (Make)"
                    required
                    className="bg-slate-800 border border-slate-700 p-2.5 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
                    value={customForm.make}
                    onChange={(e) => setCustomForm({ ...customForm, make: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="الموديل (Model)"
                    required
                    className="bg-slate-800 border border-slate-700 p-2.5 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
                    value={customForm.model}
                    onChange={(e) => setCustomForm({ ...customForm, model: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="سنة الصنع"
                    className="bg-slate-800 border border-slate-700 p-2.5 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
                    value={customForm.year}
                    onChange={(e) => setCustomForm({ ...customForm, year: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder={customForm.category === "salvage" ? "حالة القطعة المطلوبة" : "رقم الهيكل (VIN)"}
                    className="bg-slate-800 border border-slate-700 p-2.5 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
                    value={customForm.vin}
                    onChange={(e) => setCustomForm({ ...customForm, vin: e.target.value })}
                  />
                </div>
                <textarea
                  placeholder="ملاحظات أو تفاصيل إضافية عن القطعة..."
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-700 p-2.5 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500"
                  value={customForm.notes}
                  onChange={(e) => setCustomForm({ ...customForm, notes: e.target.value })}
                />

                <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 py-2.5 rounded-lg font-bold text-sm transition">
                  إرسال الاستفسار
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
              <h2 className="text-xl font-bold text-slate-200">متابعة طلباتك الخاصة السابقة</h2>

              {customRequests.length === 0 ? (
                <div className="p-8 text-center text-slate-500 bg-slate-950/50 rounded-lg border border-slate-800">
                  لم تقم بتقديم أي طلب خاص بعد.
                </div>
              ) : (
                <div className="space-y-4">
                  {customRequests.map((req) => {
                    const isReplied = req.admin_reply && req.admin_reply.trim() !== "";
                    const displayStatus = isReplied && req.status === "قيد النظر" ? "تم الرد" : req.status;

                    return (
                      <div key={req.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-lg text-cyan-400">{req.part_name}</h3>
                              <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${req.category === 'salvage' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                                {req.category === 'salvage' ? 'قسم التشاليح' : 'قسم قطع الغيار'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400">{req.make} {req.model} ({req.year || "غير محدد"})</p>
                            {req.vin && (
                              <p className="text-xs text-slate-500">
                                {req.category === "salvage" ? "الحالة:" : "VIN:"} {req.vin}
                              </p>
                            )}
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              displayStatus === "متوفرة"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : displayStatus === "غير متوفرة"
                                ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                : displayStatus === "تم الرد"
                                ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            }`}
                          >
                            {displayStatus}
                          </span>
                        </div>

                        {req.notes && <p className="text-xs text-slate-300 bg-slate-900 p-2 rounded">ملاحظاتك: {req.notes}</p>}

                        {req.admin_reply && (
                          <div className="bg-slate-900 border-l-4 border-cyan-500 p-3 rounded text-xs space-y-1 mt-2">
                            <p className="font-bold text-cyan-400">رد الإدارة والموظفين:</p>
                            <p className="text-slate-200">{req.admin_reply}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 6. إدارة طلبات القطع الخاصة للإدارة */}
        {activeTab === "custom_admin" && user.role === "admin" && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-6">
            <h2 className="text-2xl font-bold text-cyan-400">إدارة طلبات القطع الخاصة الواردة</h2>

            {customRequests.length === 0 ? (
              <div className="p-8 text-center text-slate-500 bg-slate-950/50 rounded-lg border border-slate-800">
                لا توجد طلبات خاصة واردة من العملاء.
              </div>
            ) : (
              <div className="space-y-4">
                {customRequests.map((req) => (
                  <div key={req.id} className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-2 border-b border-slate-800 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-500">طلب #{req.id}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${req.category === 'salvage' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                            مكتوب لـ: {req.category === 'salvage' ? 'قسم التشاليح' : 'قطع الغيار'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              req.status === "متوفرة"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : req.status === "غير متوفرة"
                                ? "bg-red-500/10 text-red-400"
                                : req.status === "تم الرد"
                                ? "bg-blue-500/10 text-blue-400"
                                : "bg-amber-500/10 text-amber-400"
                            }`}
                          >
                            الحالة الحالية: {req.status}
                          </span>
                        </div>
                        <h3 className="font-bold text-lg text-cyan-400 mt-1">{req.part_name}</h3>
                        <p className="text-xs text-slate-300">العميل: {req.user_name} ({req.user_email})</p>
                      </div>
                      <div className="text-xs text-slate-400">
                        <p>السيارة: {req.make} {req.model} ({req.year || "السنة غير محددة"})</p>
                        <p>{req.category === "salvage" ? "حالة القطعة المطلوبة:" : "رقم الهيكل:"} {req.vin || "غير مدخل"}</p>
                      </div>
                    </div>

                    {req.notes && (
                      <div className="bg-slate-900 p-3 rounded text-xs text-slate-300">
                        <span className="font-semibold text-slate-400 block mb-1">تفاصيل العميل:</span>
                        {req.notes}
                      </div>
                    )}

                    <div className="space-y-2 pt-2">
                      <label className="block text-xs font-semibold text-slate-300">نص الرد للعميل (مثال: بتتوفر قريباً / متوفرة بسعر 450 ريال):</label>
                      <input
                        type="text"
                        placeholder="اكتب ردك هنا..."
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
                        value={replyInputs[req.id] !== undefined ? replyInputs[req.id] : req.admin_reply || ""}
                        onChange={(e) => setReplyInputs({ ...replyInputs, [req.id]: e.target.value })}
                      />

                      <div className="flex gap-2 pt-1 flex-wrap">
                        <button
                          onClick={() => handleReplyCustomRequest(req.id, "تم الرد")}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-xs font-bold transition"
                        >
                          💬 إرسال الرد وتغيير الحالة إلى (تم الرد)
                        </button>
                        <button
                          onClick={() => handleReplyCustomRequest(req.id, "متوفرة")}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded text-xs font-bold transition"
                        >
                          ✅ تأكيد (متوفرة)
                        </button>
                        <button
                          onClick={() => handleReplyCustomRequest(req.id, "غير متوفرة")}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-xs font-bold transition"
                        >
                          ❌ اعتذار (غير متوفرة)
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 7. إدارة المخزن وإضافة قطع */}
        {activeTab === "inventory" && user.role === "admin" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4 h-fit">
              <h2 className="text-xl font-bold text-amber-400">
                {isEditing ? "تعديل قطعة" : "إضافة قطعة جديدة للمخزن"}
              </h2>

              <form onSubmit={handleSavePart} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">حدد قسم القطعة:</label>
                  <select
                    className="w-full bg-slate-800 border border-slate-700 p-2.5 rounded-lg text-sm text-white"
                    value={partForm.category}
                    onChange={(e) => setPartForm({ ...partForm, category: e.target.value as "parts" | "salvage" })}
                  >
                    <option value="parts">⚙️ قسم قطع الغيار (جديدة/وكالة)</option>
                    <option value="salvage">🚘 قسم التشاليح (مستعملة/مفحوصة)</option>
                  </select>
                </div>

                <input
                  type="text"
                  placeholder="اسم القطعة"
                  required
                  className="w-full bg-slate-800 border border-slate-700 p-2.5 rounded-lg text-sm text-white"
                  value={partForm.part_name}
                  onChange={(e) => setPartForm({ ...partForm, part_name: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="الشركة (Make)"
                    required
                    className="bg-slate-800 border border-slate-700 p-2.5 rounded-lg text-sm text-white"
                    value={partForm.make}
                    onChange={(e) => setPartForm({ ...partForm, make: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="الموديل (Model)"
                    required
                    className="bg-slate-800 border border-slate-700 p-2.5 rounded-lg text-sm text-white"
                    value={partForm.model}
                    onChange={(e) => setPartForm({ ...partForm, model: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="السنة (Year)"
                    className="bg-slate-800 border border-slate-700 p-2.5 rounded-lg text-sm text-white"
                    value={partForm.year}
                    onChange={(e) => setPartForm({ ...partForm, year: e.target.value })}
                  />
                  <input
                    type="number"
                    placeholder="السعر (ريال)"
                    required
                    className="bg-slate-800 border border-slate-700 p-2.5 rounded-lg text-sm text-white"
                    value={partForm.price}
                    onChange={(e) => setPartForm({ ...partForm, price: e.target.value })}
                  />
                </div>

                <input
                  type="text"
                  placeholder={
                    partForm.category === "salvage"
                      ? "حالة القطعة (مثل: ممتازة، بها خدش بسيط، شبه جديدة...)"
                      : "رقم الهيكل (VIN)"
                  }
                  className="w-full bg-slate-800 border border-slate-700 p-2.5 rounded-lg text-sm text-white"
                  value={partForm.vin}
                  onChange={(e) => setPartForm({ ...partForm, vin: e.target.value })}
                />

                <input
                  type="url"
                  placeholder="رابط الصورة (Image URL)"
                  className="w-full bg-slate-800 border border-slate-700 p-2.5 rounded-lg text-sm text-white"
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
                        setPartForm({ id: 0, part_name: "", make: "", model: "", year: "", vin: "", price: "", category: "parts", image_url: "" });
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
                      <th className="p-3">القسم</th>
                      <th className="p-3">السيارة</th>
                      <th className="p-3">الحالة / VIN</th>
                      <th className="p-3">السعر</th>
                      <th className="p-3">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parts.map((p) => (
                      <tr key={p.id} className="border-b border-slate-800">
                        <td className="p-3 font-semibold text-blue-400">{p.part_name}</td>
                        <td className="p-3">
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${p.category === 'salvage' ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'}`}>
                            {p.category === 'salvage' ? 'تشاليح' : 'قطع غيار'}
                          </span>
                        </td>
                        <td className="p-3">{p.make} {p.model} ({p.year})</td>
                        <td className="p-3 text-xs text-slate-300">{p.vin || "-"}</td>
                        <td className="p-3 text-emerald-400 font-bold">{p.price} ريال</td>
                        <td className="p-3 flex gap-2">
                          <button
                            onClick={() => {
                              setIsEditing(true);
                              setPartForm({
                                id: p.id,
                                part_name: p.part_name || "",
                                make: p.make || "",
                                model: p.model || "",
                                year: p.year ? p.year.toString() : "",
                                vin: p.vin || "",
                                price: p.price ? p.price.toString() : "",
                                category: p.category || "parts",
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

        {/* 8. إضافة موظفين */}
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

        {/* 9. إدارة طلبات الشراء للإدارة (يعرض نوع الدفع ديناميكياً) */}
        {activeTab === "orders" && user.role === "admin" && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
            <h2 className="text-xl font-bold text-purple-400">طلبات العملاء الواردة</h2>

            {orders.length === 0 ? (
              <div className="p-8 text-center text-slate-500 bg-slate-950/50 rounded-lg border border-slate-800">
                لا توجد طلبات معلقة حالياً.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead className="bg-slate-800 text-slate-400">
                    <tr>
                      <th className="p-3">رقم الطلب</th>
                      <th className="p-3">اسم العميل</th>
                      <th className="p-3">البريد</th>
                      <th className="p-3">القطع المشتراة</th>
                      <th className="p-3">الإجمالي</th>
                      <th className="p-3">حالة ونوع الدفع</th>
                      <th className="p-3">حالة الطلب (التحكم)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((ord) => {
                      const method = ord.payment_method || "دفع إلكتروني";
                      let badgeStyle = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                      let icon = "💳";

                      if (method.includes("تحويل")) {
                        badgeStyle = "bg-purple-500/10 text-purple-400 border-purple-500/20";
                        icon = "🏦";
                      } else if (method.includes("حجز")) {
                        badgeStyle = "bg-amber-500/10 text-amber-400 border-amber-500/20";
                        icon = "📌";
                      }

                      return (
                        <tr key={ord.id} className="border-b border-slate-800">
                          <td className="p-3 font-bold text-blue-400">#{ord.id}</td>
                          <td className="p-3">{ord.user_name}</td>
                          <td className="p-3 text-slate-400">{ord.user_email}</td>
                          <td className="p-3 font-medium text-slate-200">{ord.items_summary}</td>
                          <td className="p-3 font-bold text-emerald-400">{ord.total_price} ريال</td>
                          <td className="p-3">
                            <span
                              className={`border px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${badgeStyle}`}
                            >
                              {icon} {method}
                            </span>
                          </td>
                          <td className="p-3">
                            <select
                              value={ord.status}
                              onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                              className="bg-slate-800 border border-slate-700 text-white rounded px-2 py-1 text-xs focus:outline-none focus:border-purple-500"
                            >
                              <option value="معلق">⏳ معلق</option>
                              <option value="قيد التوصيل">🚚 قيد التوصيل</option>
                              <option value="مكتمل">✅ مكتمل</option>
                              <option value="ملغي">❌ ملغي</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}