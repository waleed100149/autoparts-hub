"use client";

import { useState, useEffect } from "react";

/* =========================================================
   Types
   ========================================================= */
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

interface OrderItem {
  id?: number;
  part_name?: string;
  image_url?: string | null;
  quantity?: number;
  price?: number;
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
  // حقول اختيارية لصورة الطلب — تُقرأ إن أرجعها الـ API
  image_url?: string | null;
  items?: OrderItem[] | string | null;
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

type Tab = "store" | "cart" | "my_orders" | "custom_request" | "inventory" | "staff" | "orders" | "custom_admin";
type ToastType = "success" | "error" | "info";
interface Toast {
  id: number;
  msg: string;
  type: ToastType;
}

/* =========================================================
   Icons (inline SVG — no external dependency)
   ========================================================= */
const ICONS: Record<string, React.ReactNode> = {
  logo: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" />
    </>
  ),
  wrench: <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />,
  car: (
    <>
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
      <circle cx="7" cy="17" r="2" />
      <path d="M9 17h6" />
      <circle cx="17" cy="17" r="2" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  cart: (
    <>
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </>
  ),
  box: (
    <>
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5M12 22V12" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </>
  ),
  plus: <path d="M5 12h14M12 5v14" />,
  minus: <path d="M5 12h14" />,
  trash: <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />,
  edit: <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />,
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  clipboard: (
    <>
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M9 12h6M9 16h4" />
    </>
  ),
  logout: <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />,
  x: <path d="M18 6 6 18M6 6l12 12" />,
  image: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21" />
    </>
  ),
  card: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20M6 15h4" />
    </>
  ),
  bank: <path d="M3 22h18M6 18v-7M10 18v-7M14 18v-7M18 18v-7M12 2l9 5H3z" />,
  lock: (
    <>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </>
  ),
  check: <path d="M20 6 9 17l-5-5" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </>
  ),
  truck: (
    <>
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2M15 18H9M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
      <circle cx="17" cy="18" r="2" />
      <circle cx="7" cy="18" r="2" />
    </>
  ),
  ban: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="m4.9 4.9 14.2 14.2" />
    </>
  ),
  mail: (
    <>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 6L2 7" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="5" />
      <path d="M20 21a8 8 0 0 0-16 0" />
    </>
  ),
  arrowLeft: <path d="M19 12H5M12 19l-7-7 7-7" />,
  chevronLeft: <path d="m15 18-6-6 6-6" />,
  chevronRight: <path d="m9 18 6-6-6-6" />,
  message: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  wallet: (
    <>
      <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
      <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
    </>
  ),
  phone: <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />,
  shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4" />,
  send: <path d="m22 2-7 20-4-9-9-4ZM22 2 11 13" />,
  refresh: <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M8 16H3v5" />,
  zoom: (
    <>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3M11 8v6M8 11h6" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </>
  ),
  spinner: <path d="M21 12a9 9 0 1 1-6.22-8.56" />,
};

function Icon({ name, className = "w-5 h-5", strokeWidth = 1.8 }: { name: string; className?: string; strokeWidth?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  );
}

/* =========================================================
   Design helpers
   ========================================================= */
const inputCls =
  "w-full h-11 rounded-xl bg-[#0D1014] border border-white/10 px-3.5 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition focus:border-orange-500/70 focus:ring-4 focus:ring-orange-500/10";
const textareaCls =
  "w-full rounded-xl bg-[#0D1014] border border-white/10 px-3.5 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition focus:border-orange-500/70 focus:ring-4 focus:ring-orange-500/10 resize-none";
const labelCls = "block text-xs font-semibold text-zinc-400 mb-1.5";
const panelCls = "rounded-2xl bg-[#12151B] border border-white/[0.07]";
const btnPrimary =
  "inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-orange-500 hover:bg-orange-400 active:bg-orange-600 text-white text-sm font-bold transition shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed";
const btnGhost =
  "inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-zinc-200 text-sm font-semibold transition";

const fmt = (n: number | string | null | undefined) => Number(n || 0).toLocaleString("en-US");

const formatDate = (d: string) => {
  try {
    return new Date(d).toLocaleString("ar-SA-u-ca-gregory-nu-latn", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return d;
  }
};

const STATUS_META: Record<string, { cls: string; dot: string; icon: string }> = {
  "معلق": { cls: "bg-amber-500/10 text-amber-300 ring-amber-500/25", dot: "bg-amber-400", icon: "clock" },
  "قيد النظر": { cls: "bg-amber-500/10 text-amber-300 ring-amber-500/25", dot: "bg-amber-400", icon: "clock" },
  "قيد التوصيل": { cls: "bg-sky-500/10 text-sky-300 ring-sky-500/25", dot: "bg-sky-400", icon: "truck" },
  "تم الرد": { cls: "bg-sky-500/10 text-sky-300 ring-sky-500/25", dot: "bg-sky-400", icon: "message" },
  "مكتمل": { cls: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/25", dot: "bg-emerald-400", icon: "check" },
  "متوفرة": { cls: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/25", dot: "bg-emerald-400", icon: "check" },
  "ملغي": { cls: "bg-red-500/10 text-red-300 ring-red-500/25", dot: "bg-red-400", icon: "ban" },
  "غير متوفرة": { cls: "bg-red-500/10 text-red-300 ring-red-500/25", dot: "bg-red-400", icon: "ban" },
};

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] || STATUS_META["معلق"];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${m.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {status}
    </span>
  );
}

function CategoryBadge({ category, long = false }: { category?: "parts" | "salvage"; long?: boolean }) {
  const salvage = category === "salvage";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset backdrop-blur ${
        salvage ? "bg-lime-500/10 text-lime-300 ring-lime-500/25" : "bg-sky-500/10 text-sky-300 ring-sky-500/25"
      }`}
    >
      <Icon name={salvage ? "car" : "wrench"} className="w-3 h-3" strokeWidth={2.2} />
      {salvage ? (long ? "قسم التشاليح" : "تشاليح") : long ? "قسم قطع الغيار" : "قطع غيار"}
    </span>
  );
}

function paymentMeta(method?: string) {
  const m = method || "دفع إلكتروني";
  if (m.includes("تحويل")) return { label: m, icon: "bank", cls: "bg-violet-500/10 text-violet-300 ring-violet-500/25" };
  if (m.includes("حجز")) return { label: m, icon: "lock", cls: "bg-amber-500/10 text-amber-300 ring-amber-500/25" };
  return { label: m, icon: "card", cls: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/25" };
}

function PaymentBadge({ method }: { method?: string }) {
  const p = paymentMeta(method);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${p.cls}`}>
      <Icon name={p.icon} className="w-3.5 h-3.5" strokeWidth={2} />
      {p.label}
    </span>
  );
}

function EmptyState({ icon, title, hint, action }: { icon: string; title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-2xl border border-dashed border-white/10 bg-white/[0.015]">
      <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-zinc-400 mb-4">
        <Icon name={icon} className="w-6 h-6" />
      </div>
      <p className="font-bold text-zinc-200">{title}</p>
      {hint && <p className="text-sm text-zinc-500 mt-1 max-w-sm">{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function SectionHeader({ icon, title, subtitle, actions }: { icon: string; title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-xl bg-orange-500/10 ring-1 ring-inset ring-orange-500/25 text-orange-400 flex items-center justify-center shrink-0">
          <Icon name={icon} className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">{title}</h2>
          {subtitle && <p className="text-sm text-zinc-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

function Logo({ size = "md" }: { size?: "md" | "lg" }) {
  const box = size === "lg" ? "w-12 h-12 rounded-2xl" : "w-10 h-10 rounded-xl";
  return (
    <div className="flex items-center gap-3">
      <div className={`${box} bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/30`}>
        <Icon name="logo" className={size === "lg" ? "w-6 h-6" : "w-5 h-5"} strokeWidth={2.2} />
      </div>
      <div className="leading-tight">
        <p className={`${size === "lg" ? "text-xl" : "text-base"} font-black text-white tracking-tight`} dir="ltr">
          AutoParts<span className="text-orange-500">Hub</span>
        </p>
        <p className="text-[11px] text-zinc-500 font-medium">قطع غيار · تشاليح</p>
      </div>
    </div>
  );
}

const gridBg: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
  backgroundSize: "44px 44px",
};

const FONT_CSS = `@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Cairo:wght@800;900&display=swap');
.aph-root{font-family:'IBM Plex Sans Arabic',system-ui,sans-serif}
.aph-root .font-black,.aph-root .font-extrabold{font-family:'Cairo','IBM Plex Sans Arabic',sans-serif}
.aph-scroll::-webkit-scrollbar{height:0;width:0}
@keyframes aphIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.aph-in{animation:aphIn .35s ease both}
.aph-root input[type=number]::-webkit-inner-spin-button{opacity:.3}
.aph-root select option{background:#12151B}`;

/* =========================================================
   Page
   ========================================================= */
export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<"client_login" | "client_register" | "admin_login">("client_login");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<"parts" | "salvage" | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("store");
  const [parts, setParts] = useState<Part[]>([]);
  const [catalog, setCatalog] = useState<Part[]>([]); // كل القطع — يُستخدم لاستخراج صور الطلبات
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customRequests, setCustomRequests] = useState<CustomRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // لوحة الطلبات
  const [orderFilter, setOrderFilter] = useState<string>("الكل");
  const [orderSearch, setOrderSearch] = useState("");
  const [inventorySearch, setInventorySearch] = useState("");
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number; title: string } | null>(null);

  // تنبيهات
  const [toasts, setToasts] = useState<Toast[]>([]);

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

  const notify = (msg: string, type: ToastType = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedCategory]);

  useEffect(() => {
    if (user) fetchCatalog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // إغلاق النوافذ بزر Esc والتنقل بين الصور بالأسهم
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLightbox(null);
        if (!paymentLoading) setShowPaymentModal(false);
      }
      if (lightbox && lightbox.images.length > 1) {
        if (e.key === "ArrowLeft") setLightbox((l) => (l ? { ...l, index: (l.index + 1) % l.images.length } : l));
        if (e.key === "ArrowRight")
          setLightbox((l) => (l ? { ...l, index: (l.index - 1 + l.images.length) % l.images.length } : l));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, paymentLoading]);

  const fetchCatalog = async () => {
    try {
      const res = await fetch("/api/parts");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setCatalog(data);
      }
    } catch (err) {
      console.error("خطأ جلب الكتالوج:", err);
    }
  };

  const fetchAllParts = async () => {
    try {
      const res = await fetch("/api/parts");
      if (res.ok) {
        const data = await res.json();
        setParts(data);
        if (Array.isArray(data)) setCatalog(data);
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

  /**
   * صور الطلب — تُجمع بالترتيب:
   * 1) order.image_url إن وُجد
   * 2) صور العناصر داخل order.items (مصفوفة أو JSON نصي)
   * 3) احتياطياً: مطابقة أسماء القطع في items_summary مع الكتالوج
   */
  const getOrderImages = (ord: Order): string[] => {
    const imgs: string[] = [];
    const push = (u?: string | null) => {
      if (u && typeof u === "string" && u.trim() && !imgs.includes(u)) imgs.push(u);
    };
    push(ord.image_url);

    let items: unknown = ord.items;
    if (typeof items === "string") {
      try {
        items = JSON.parse(items);
      } catch {
        items = null;
      }
    }
    if (Array.isArray(items)) {
      (items as OrderItem[]).forEach((it) => push(it?.image_url));
    }

    if (imgs.length === 0 && ord.items_summary) {
      catalog.forEach((p) => {
        if (p.image_url && p.part_name && ord.items_summary.includes(p.part_name)) push(p.image_url);
      });
    }
    return imgs;
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
        notify(`تم تحديث الطلب #${orderId} إلى (${newStatus})`);
      } else {
        const data = await res.json();
        notify(data.error || "فشل تغيير حالة الطلب", "error");
      }
    } catch (err) {
      console.error("خطأ تحديث حالة الطلب:", err);
      notify("حدث خطأ في الاتصال بالخادم", "error");
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
        notify(data.message || "تم إرسال الطلب بنجاح!");
        setCustomForm({ part_name: "", make: "", model: "", year: "", vin: "", category: "parts", notes: "" });
        fetchCustomRequestsClient(user.id);
      } else {
        notify(data.error || "حدث خطأ أثناء إرسال الطلب", "error");
      }
    } catch (err) {
      console.error(err);
      notify("حدث خطأ في الاتصال بالخادم", "error");
    }
  };

  const handleReplyCustomRequest = async (requestId: number, newStatus: string) => {
    const adminReply = replyInputs[requestId] ?? customRequests.find((r) => r.id === requestId)?.admin_reply ?? "";
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
        notify("تم حفظ الرد وتحديث حالة الطلب بنجاح!");
        fetchCustomRequestsAdmin();
      } else {
        notify(data.error || "حدث خطأ أثناء الرد", "error");
      }
    } catch (err) {
      console.error(err);
      notify("حدث خطأ في الاتصال بالخادم", "error");
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);
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
      setActiveTab("store");
      localStorage.setItem("autoparts_user", JSON.stringify(data.user));
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
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
      notify("تمت إضافة الموظف بنجاح");
      setEmployeeForm({ name: "", email: "", password: "" });
    } catch (err: any) {
      setEmployeeMsg(`خطأ: ${err.message}`);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCart([]);
    setSelectedCategory(null);
    setActiveTab("store");
    localStorage.removeItem("autoparts_user");
  };

  const addToCart = (part: Part) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === part.id);
      if (existing) {
        return prevCart.map((item) => (item.id === part.id ? { ...item, quantity: item.quantity + 1 } : item));
      }
      return [...prevCart, { ...part, quantity: 1 }];
    });
    notify(`تمت إضافة "${part.part_name}" إلى السلة`);
  };

  const updateCartQuantity = (id: number, delta: number) => {
    setCart(
      (prevCart) =>
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
      paymentMethod === "bank_transfer" ? "تحويل بنكي" : paymentMethod === "reservation" ? "نظام حجز (+150)" : "دفع إلكتروني";

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
            image_url: cart.find((c) => c.image_url)?.image_url || null,
            payment_method: paymentText,
          }),
        });

        setPaymentLoading(false);
        setShowPaymentModal(false);

        if (res.ok) {
          notify(`تم تأكيد طلبك بنجاح — طريقة الدفع: ${paymentText}`);
          setCart([]);
          fetchMyOrders(user!.id);
          setActiveTab("my_orders");
        } else {
          const data = await res.json();
          notify(data.error || "فشل إرسال الطلب", "error");
        }
      } catch (err) {
        setPaymentLoading(false);
        setShowPaymentModal(false);
        console.error(err);
        notify("حدث خطأ أثناء الاتصال بالخادم", "error");
      }
    }, 1800);
  };

  const resetPartForm = () =>
    setPartForm({ id: 0, part_name: "", make: "", model: "", year: "", vin: "", price: "", category: "parts", image_url: "" });

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
        notify(isEditing ? "تم تعديل القطعة بنجاح" : "تمت إضافة القطعة للمخزن");
        resetPartForm();
        setIsEditing(false);
        if (selectedCategory) fetchParts(selectedCategory);
        else fetchAllParts();
      } else {
        notify(data.error || "حدث خطأ عند حفظ البيانات", "error");
      }
    } catch (err: any) {
      console.error(err);
      notify("حدث خطأ في الاتصال بالخادم", "error");
    }
  };

  const handleDeletePart = async (id: number) => {
    if (!confirm("هل أنت متأكد من حذف هذه القطعة من المخزن؟")) return;
    try {
      const res = await fetch(`/api/parts/${id}`, { method: "DELETE" });
      if (res.ok) {
        notify("تم حذف القطعة", "info");
        if (selectedCategory) fetchParts(selectedCategory);
        else fetchAllParts();
      } else {
        const data = await res.json().catch(() => ({ error: "تعذر الحذف" }));
        notify(data.error || "فشل عملية الحذف", "error");
      }
    } catch (err) {
      console.error(err);
      notify("حدث خطأ في الاتصال بالخادم", "error");
    }
  };

  /* ---------- Toasts (shared) ---------- */
  const toastLayer = (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[70] flex flex-col gap-2 w-[min(92vw,420px)] pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`aph-in pointer-events-auto flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold shadow-2xl backdrop-blur-xl ${
            t.type === "error"
              ? "bg-red-950/90 border-red-500/30 text-red-200"
              : t.type === "info"
              ? "bg-zinc-900/95 border-white/10 text-zinc-200"
              : "bg-emerald-950/90 border-emerald-500/30 text-emerald-200"
          }`}
        >
          <Icon name={t.type === "error" ? "ban" : t.type === "info" ? "info" : "check"} className="w-4 h-4 shrink-0" strokeWidth={2.4} />
          <span className="flex-1">{t.msg}</span>
        </div>
      ))}
    </div>
  );

  /* =========================================================
     Auth screen
     ========================================================= */
  if (!user) {
    const isAdmin = authMode === "admin_login";
    return (
      <div className="aph-root min-h-screen bg-[#0A0C0F] text-zinc-100 flex" dir="rtl">
        <style dangerouslySetInnerHTML={{ __html: FONT_CSS }} />

        {/* Brand panel */}
        <aside className="hidden lg:flex relative w-[46%] overflow-hidden border-l border-white/[0.06] bg-[#0E1116]">
          <div className="absolute inset-0" style={gridBg} />
          <div className="absolute -top-40 -right-40 w-[520px] h-[520px] rounded-full bg-orange-500/20 blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-[380px] h-[380px] rounded-full bg-sky-500/10 blur-[120px]" />
          <div className="relative z-10 flex flex-col justify-between p-12 w-full">
            <Logo size="lg" />

            <div className="space-y-6 max-w-md">
              <span className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-300">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                منصة موثوقة لقطع السيارات
              </span>
              <h1 className="text-4xl xl:text-5xl font-black leading-[1.25] text-white">
                كل قطعة تحتاجها سيارتك
                <span className="block text-orange-500">في مكان واحد.</span>
              </h1>
              <p className="text-zinc-400 leading-relaxed">
                قطع غيار جديدة ووكالة، وقطع تشاليح أصلية مفحوصة — مع طلب خاص لأي قطعة غير متوفرة ومتابعة لحظية لطلباتك.
              </p>

              <div className="grid grid-cols-3 gap-3 pt-2">
                {[
                  { icon: "shield", t: "قطع مفحوصة" },
                  { icon: "truck", t: "توصيل سريع" },
                  { icon: "lock", t: "دفع آمن" },
                ].map((f) => (
                  <div key={f.t} className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3.5">
                    <Icon name={f.icon} className="w-5 h-5 text-orange-400" />
                    <p className="text-xs font-bold text-zinc-300 mt-2">{f.t}</p>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs text-zinc-600">© {new Date().getFullYear()} AutoParts Hub — جميع الحقوق محفوظة</p>
          </div>
        </aside>

        {/* Form */}
        <main className="flex-1 flex items-center justify-center p-5 sm:p-10 relative">
          <div className="absolute inset-0 lg:hidden" style={gridBg} />
          <div className="relative w-full max-w-[420px] aph-in">
            <div className="lg:hidden mb-8 flex justify-center">
              <Logo size="lg" />
            </div>

            <div className="mb-7">
              <h2 className="text-2xl font-extrabold text-white">
                {isAdmin ? "بوابة الإدارة" : authMode === "client_login" ? "أهلاً بعودتك" : "إنشاء حساب جديد"}
              </h2>
              <p className="text-sm text-zinc-500 mt-1.5">
                {isAdmin
                  ? "دخول مخصص للإدارة والموظفين فقط."
                  : authMode === "client_login"
                  ? "سجّل دخولك لتصفح القطع ومتابعة طلباتك."
                  : "أنشئ حسابك خلال ثوانٍ وابدأ الطلب."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.07] mb-6">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("client_login");
                  setAuthError("");
                }}
                className={`h-10 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 ${
                  !isAdmin ? "bg-white text-zinc-900 shadow" : "text-zinc-400 hover:text-white"
                }`}
              >
                <Icon name="user" className="w-4 h-4" />
                العملاء
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode("admin_login");
                  setAuthError("");
                }}
                className={`h-10 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 ${
                  isAdmin ? "bg-white text-zinc-900 shadow" : "text-zinc-400 hover:text-white"
                }`}
              >
                <Icon name="shield" className="w-4 h-4" />
                الإدارة
              </button>
            </div>

            {authError && (
              <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-sm text-red-300">
                <Icon name="info" className="w-4 h-4 mt-0.5 shrink-0" />
                {authError}
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
              {authMode === "client_register" && (
                <div>
                  <label className={labelCls}>الاسم الكامل</label>
                  <div className="relative">
                    <Icon name="user" className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      required
                      placeholder="محمد عبدالله"
                      className={`${inputCls} pr-10`}
                      value={authForm.name}
                      onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className={labelCls}>البريد الإلكتروني</label>
                <div className="relative">
                  <Icon name="mail" className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    dir="ltr"
                    className={`${inputCls} pr-10 text-right`}
                    value={authForm.email}
                    onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>كلمة المرور</label>
                <div className="relative">
                  <Icon name="lock" className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    className={`${inputCls} pr-10`}
                    value={authForm.password}
                    onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  />
                </div>
              </div>

              <button type="submit" disabled={authLoading} className={`${btnPrimary} w-full h-12 text-base mt-2`}>
                {authLoading ? (
                  <Icon name="spinner" className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {isAdmin ? "دخول لوحة الإدارة" : authMode === "client_login" ? "تسجيل الدخول" : "إنشاء الحساب"}
                    <Icon name="arrowLeft" className="w-4 h-4" strokeWidth={2.2} />
                  </>
                )}
              </button>
            </form>

            {!isAdmin && (
              <p className="text-center text-sm text-zinc-500 mt-6">
                {authMode === "client_login" ? (
                  <>
                    ليس لديك حساب؟{" "}
                    <button onClick={() => setAuthMode("client_register")} className="font-bold text-orange-400 hover:text-orange-300">
                      سجّل الآن
                    </button>
                  </>
                ) : (
                  <>
                    لديك حساب بالفعل؟{" "}
                    <button onClick={() => setAuthMode("client_login")} className="font-bold text-orange-400 hover:text-orange-300">
                      سجّل دخولك
                    </button>
                  </>
                )}
              </p>
            )}
          </div>
        </main>
        {toastLayer}
      </div>
    );
  }

  /* =========================================================
     Derived data
     ========================================================= */
  const filteredParts = parts.filter(
    (p) =>
      p.part_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.model?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const inventoryParts = parts.filter((p) => {
    const q = inventorySearch.trim().toLowerCase();
    if (!q) return true;
    return [p.part_name, p.make, p.model, p.vin, String(p.year ?? "")].some((v) => v?.toString().toLowerCase().includes(q));
  });

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const ORDER_STATUSES = ["معلق", "قيد التوصيل", "مكتمل", "ملغي"];
  const orderCounts = ORDER_STATUSES.reduce<Record<string, number>>((acc, s) => {
    acc[s] = orders.filter((o) => o.status === s).length;
    return acc;
  }, {});
  const revenue = orders.filter((o) => o.status !== "ملغي").reduce((s, o) => s + Number(o.total_price || 0), 0);

  const visibleOrders = orders.filter((o) => {
    if (orderFilter !== "الكل" && o.status !== orderFilter) return false;
    const q = orderSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      String(o.id).includes(q) ||
      o.user_name?.toLowerCase().includes(q) ||
      o.user_email?.toLowerCase().includes(q) ||
      o.items_summary?.toLowerCase().includes(q)
    );
  });

  const pendingCustom = customRequests.filter((r) => r.status === "قيد النظر" || !r.admin_reply).length;

  const navItems: { key: Tab; label: string; icon: string; badge?: number; onClick?: () => void }[] =
    user.role === "client"
      ? [
          { key: "store", label: "المتجر", icon: "grid", onClick: () => setSelectedCategory(null) },
          { key: "cart", label: "السلة", icon: "cart", badge: totalCartCount },
          { key: "my_orders", label: "طلباتي", icon: "box", onClick: () => fetchMyOrders(user.id) },
          { key: "custom_request", label: "طلب قطعة خاصة", icon: "search", onClick: () => fetchCustomRequestsClient(user.id) },
        ]
      : [
          { key: "store", label: "المتجر", icon: "grid", onClick: () => setSelectedCategory(null) },
          { key: "orders", label: "إدارة الطلبات", icon: "clipboard", badge: orderCounts["معلق"], onClick: fetchOrdersAdmin },
          { key: "custom_admin", label: "الطلبات الخاصة", icon: "message", badge: pendingCustom, onClick: fetchCustomRequestsAdmin },
          { key: "inventory", label: "المخزن", icon: "box" },
          { key: "staff", label: "الموظفين", icon: "users" },
        ];

  /* ---------- Order thumbnail (used in admin + client) ---------- */
  const orderThumb = (ord: Order, size: "lg" | "md" = "lg") => {
    const imgs = getOrderImages(ord);
    const dim = size === "lg" ? "w-24 h-24 sm:w-28 sm:h-28" : "w-20 h-20";
    if (imgs.length === 0) {
      return (
        <div
          className={`${dim} shrink-0 rounded-xl bg-[#0D1014] border border-white/[0.07] flex flex-col items-center justify-center text-zinc-600 gap-1`}
        >
          <Icon name="box" className="w-6 h-6" />
          <span className="text-[10px] font-medium">بدون صورة</span>
        </div>
      );
    }
    return (
      <button
        type="button"
        onClick={() => setLightbox({ images: imgs, index: 0, title: `طلب #${ord.id}` })}
        className={`${dim} group relative shrink-0 rounded-xl overflow-hidden border border-white/10 bg-[#0D1014] focus:outline-none focus:ring-4 focus:ring-orange-500/20`}
        title="عرض صور الطلب"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imgs[0]} alt={`صورة الطلب #${ord.id}`} className="w-full h-full object-cover transition duration-300 group-hover:scale-110" />
        <span className="absolute inset-0 bg-black/0 group-hover:bg-black/45 transition flex items-center justify-center">
          <Icon name="zoom" className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition" />
        </span>
        {imgs.length > 1 && (
          <span dir="ltr" className="absolute bottom-1.5 left-1.5 rounded-md bg-black/75 backdrop-blur px-1.5 py-0.5 text-[10px] font-bold text-white">
            +{imgs.length - 1}
          </span>
        )}
      </button>
    );
  };

  /* =========================================================
     App shell
     ========================================================= */
  return (
    <div className="aph-root min-h-screen bg-[#0A0C0F] text-zinc-100" dir="rtl">
      <style dangerouslySetInnerHTML={{ __html: FONT_CSS }} />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0A0C0F]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="h-16 flex items-center justify-between gap-4">
            <button onClick={() => { setSelectedCategory(null); setActiveTab("store"); }} className="shrink-0">
              <Logo />
            </button>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:flex items-center gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.03] pl-3 pr-1.5 py-1.5">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black ${
                    user.role === "admin" ? "bg-orange-500/15 text-orange-300" : "bg-sky-500/15 text-sky-300"
                  }`}
                >
                  {user.name?.trim()?.charAt(0) || "؟"}
                </div>
                <div className="leading-tight">
                  <p className="text-xs font-bold text-zinc-200 max-w-[140px] truncate">{user.name}</p>
                  <p className={`text-[10px] font-semibold ${user.role === "admin" ? "text-orange-400" : "text-sky-400"}`}>
                    {user.role === "admin" ? "حساب الإدارة" : "حساب عميل"}
                  </p>
                </div>
              </div>
              {user.role === "client" && (
                <button
                  onClick={() => setActiveTab("cart")}
                  className="relative w-10 h-10 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-zinc-200 transition"
                  title="السلة"
                >
                  <Icon name="cart" className="w-5 h-5" />
                  {totalCartCount > 0 && (
                    <span className="absolute -top-1.5 -left-1.5 min-w-[20px] h-5 px-1 rounded-full bg-orange-500 text-white text-[11px] font-bold flex items-center justify-center ring-2 ring-[#0A0C0F]">
                      {totalCartCount}
                    </span>
                  )}
                </button>
              )}
              <button
                onClick={handleLogout}
                className="h-10 px-3 rounded-xl text-red-300 hover:bg-red-500/10 border border-red-500/20 text-sm font-semibold flex items-center gap-2 transition"
                title="تسجيل الخروج"
              >
                <Icon name="logout" className="w-4 h-4" />
                <span className="hidden sm:inline">خروج</span>
              </button>
            </div>
          </div>

          {/* Nav */}
          <nav className="aph-scroll -mb-px flex gap-1 overflow-x-auto">
            {navItems.map((n) => {
              const active = activeTab === n.key;
              return (
                <button
                  key={n.key}
                  onClick={() => {
                    n.onClick?.();
                    setActiveTab(n.key);
                  }}
                  className={`relative shrink-0 flex items-center gap-2 px-3.5 h-11 text-sm font-semibold transition border-b-2 ${
                    active ? "text-white border-orange-500" : "text-zinc-500 border-transparent hover:text-zinc-200"
                  }`}
                >
                  <Icon name={n.icon} className="w-4 h-4" />
                  {n.label}
                  {!!n.badge && n.badge > 0 && (
                    <span
                      className={`min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center ${
                        active ? "bg-orange-500 text-white" : "bg-white/10 text-zinc-300"
                      }`}
                    >
                      {n.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* =================== 1. Category picker =================== */}
        {activeTab === "store" && !selectedCategory && (
          <div className="aph-in">
            <section className={`relative overflow-hidden ${panelCls} p-8 md:p-12 mb-8`}>
              <div className="absolute inset-0" style={gridBg} />
              <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-orange-500/15 blur-[100px]" />
              <div className="relative max-w-2xl">
                <p className="text-sm font-bold text-orange-400 mb-3">مرحباً {user.name} 👋</p>
                <h1 className="text-3xl md:text-5xl font-black text-white leading-[1.3]">
                  ابحث عن القطعة المناسبة
                  <span className="text-zinc-500"> لسيارتك بسهولة.</span>
                </h1>
                <p className="text-zinc-400 mt-4 md:text-lg">اختر القسم الذي تريد تصفحه — قطع جديدة ووكالة، أو تشاليح أصلية مفحوصة.</p>
              </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                {
                  key: "parts" as const,
                  icon: "wrench",
                  title: "قطع الغيار",
                  tag: "جديد · وكالة",
                  desc: "قطع استهلاكية معتمدة وأصلية متاحة في المخزن مع رقم الهيكل للتأكد من التوافق.",
                  accent: "sky",
                },
                {
                  key: "salvage" as const,
                  icon: "car",
                  title: "قطع التشاليح",
                  tag: "مستعمل · مفحوص",
                  desc: "قطع تشاليح أصلية مفكوكة ومفحوصة بحالة موضحة لكل قطعة وبأسعار مناسبة.",
                  accent: "lime",
                },
              ].map((c) => (
                <button
                  key={c.key}
                  onClick={() => setSelectedCategory(c.key)}
                  className={`group relative overflow-hidden text-right ${panelCls} p-7 md:p-8 transition duration-300 hover:-translate-y-1 ${
                    c.accent === "sky" ? "hover:border-sky-500/40" : "hover:border-lime-500/40"
                  }`}
                >
                  <div
                    className={`absolute -bottom-20 -left-20 w-64 h-64 rounded-full blur-[90px] opacity-0 group-hover:opacity-100 transition duration-500 ${
                      c.accent === "sky" ? "bg-sky-500/20" : "bg-lime-500/15"
                    }`}
                  />
                  <Icon
                    name={c.icon}
                    className={`absolute left-6 bottom-6 w-28 h-28 opacity-[0.05] group-hover:opacity-[0.1] transition ${
                      c.accent === "sky" ? "text-sky-300" : "text-lime-300"
                    }`}
                    strokeWidth={1.2}
                  />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-8">
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center ring-1 ring-inset transition ${
                          c.accent === "sky"
                            ? "bg-sky-500/10 text-sky-300 ring-sky-500/25 group-hover:bg-sky-500 group-hover:text-white"
                            : "bg-lime-500/10 text-lime-300 ring-lime-500/25 group-hover:bg-lime-500 group-hover:text-zinc-900"
                        }`}
                      >
                        <Icon name={c.icon} className="w-7 h-7" />
                      </div>
                      <span className="text-xs font-bold text-zinc-500 border border-white/10 rounded-full px-3 py-1">{c.tag}</span>
                    </div>
                    <h2 className="text-2xl font-extrabold text-white">{c.title}</h2>
                    <p className="text-sm text-zinc-400 mt-2 leading-relaxed max-w-sm">{c.desc}</p>
                    <span
                      className={`inline-flex items-center gap-2 mt-6 text-sm font-bold ${
                        c.accent === "sky" ? "text-sky-300" : "text-lime-300"
                      }`}
                    >
                      تصفح القسم
                      <Icon name="arrowLeft" className="w-4 h-4 transition group-hover:-translate-x-1" strokeWidth={2.2} />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* =================== 2. Store listing =================== */}
        {activeTab === "store" && selectedCategory && (
          <div className="aph-in space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-200 mb-2 transition"
                >
                  <Icon name="chevronRight" className="w-3.5 h-3.5" />
                  كل الأقسام
                </button>
                <h2 className="text-2xl md:text-3xl font-black text-white">
                  {selectedCategory === "parts" ? "قطع الغيار" : "قطع التشاليح"}
                  <span className="text-base font-semibold text-zinc-500 mr-3">{filteredParts.length} قطعة</span>
                </h2>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative sm:w-80">
                  <Icon name="search" className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="ابحث باسم القطعة، الماركة، أو الموديل..."
                    className={`${inputCls} pr-10`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.07]">
                  <button
                    onClick={() => setSelectedCategory("parts")}
                    className={`h-9 px-4 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      selectedCategory === "parts" ? "bg-sky-500 text-white" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <Icon name="wrench" className="w-3.5 h-3.5" />
                    قطع الغيار
                  </button>
                  <button
                    onClick={() => setSelectedCategory("salvage")}
                    className={`h-9 px-4 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      selectedCategory === "salvage" ? "bg-lime-500 text-zinc-900" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <Icon name="car" className="w-3.5 h-3.5" />
                    التشاليح
                  </button>
                </div>
              </div>
            </div>

            {filteredParts.length === 0 ? (
              <EmptyState
                icon="search"
                title="لا توجد قطع مطابقة"
                hint="جرّب كلمة بحث مختلفة، أو أرسل طلباً خاصاً وسنوفر لك القطعة."
                action={
                  user.role === "client" ? (
                    <button onClick={() => setActiveTab("custom_request")} className={btnPrimary}>
                      <Icon name="send" className="w-4 h-4" />
                      طلب قطعة غير متوفرة
                    </button>
                  ) : undefined
                }
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredParts.map((part) => (
                  <article
                    key={part.id}
                    className={`group ${panelCls} overflow-hidden flex flex-col transition duration-300 hover:border-white/15 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/40`}
                  >
                    <div className="relative aspect-[4/3] bg-[#0D1014] overflow-hidden">
                      {part.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={part.image_url}
                          alt={part.part_name}
                          className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-zinc-700 gap-2" style={gridBg}>
                          <Icon name={part.category === "salvage" ? "car" : "wrench"} className="w-10 h-10" strokeWidth={1.4} />
                          <span className="text-[11px] font-medium text-zinc-600">لا توجد صورة</span>
                        </div>
                      )}
                      <div className="absolute top-3 right-3">
                        <CategoryBadge category={part.category} />
                      </div>
                    </div>

                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="font-bold text-zinc-100 text-[15px] leading-snug line-clamp-2">{part.part_name}</h3>
                      <p className="flex items-center gap-1.5 text-xs text-zinc-400 mt-2">
                        <Icon name="car" className="w-3.5 h-3.5 text-zinc-500" />
                        {part.make} {part.model} {part.year ? `· ${part.year}` : ""}
                      </p>
                      <p className="text-[11px] text-zinc-500 mt-1.5 truncate">
                        <span className="text-zinc-600">{part.category === "salvage" ? "الحالة: " : "VIN: "}</span>
                        <span className={part.category === "salvage" || !part.vin ? "" : "font-mono"}>{part.vin || "غير محدد"}</span>
                      </p>

                      <div className="mt-auto pt-4 flex items-end justify-between gap-3">
                        <div>
                          <p className="text-[10px] text-zinc-500 font-medium">السعر</p>
                          <p className="text-xl font-black text-white">
                            {fmt(part.price)} <span className="text-xs font-bold text-zinc-500">ر.س</span>
                          </p>
                        </div>
                        {user.role === "client" ? (
                          <button
                            onClick={() => addToCart(part)}
                            className="h-10 px-3.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-orange-500/20"
                          >
                            <Icon name="plus" className="w-4 h-4" strokeWidth={2.4} />
                            أضف للسلة
                          </button>
                        ) : (
                          <span className="text-[11px] font-semibold text-zinc-500 bg-white/[0.04] border border-white/[0.07] rounded-lg px-2.5 py-1.5 flex items-center gap-1">
                            <Icon name="shield" className="w-3.5 h-3.5" />
                            معاينة إدارية
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =================== 3. Cart =================== */}
        {activeTab === "cart" && user.role === "client" && (
          <div className="aph-in">
            <SectionHeader icon="cart" title="سلة المشتريات" subtitle={`${totalCartCount} قطعة في السلة`} />

            {cart.length === 0 ? (
              <EmptyState
                icon="cart"
                title="السلة فارغة حالياً"
                hint="أضف بعض القطع من المتجر لتبدأ طلبك."
                action={
                  <button onClick={() => setActiveTab("store")} className={btnPrimary}>
                    تصفح المتجر
                  </button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className={`lg:col-span-2 ${panelCls} divide-y divide-white/[0.06]`}>
                  {cart.map((item) => (
                    <div key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-20 h-20 rounded-xl bg-[#0D1014] border border-white/[0.07] overflow-hidden flex items-center justify-center shrink-0">
                          {item.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.image_url} alt={item.part_name} className="w-full h-full object-cover" />
                          ) : (
                            <Icon name="image" className="w-6 h-6 text-zinc-700" />
                          )}
                        </div>
                        <div className="min-w-0 space-y-1.5">
                          <h4 className="font-bold text-zinc-100 truncate">{item.part_name}</h4>
                          <p className="text-xs text-zinc-500">
                            {item.make} {item.model} {item.year ? `· ${item.year}` : ""}
                          </p>
                          <CategoryBadge category={item.category} />
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-5">
                        <div className="flex items-center h-10 rounded-xl border border-white/10 bg-[#0D1014] overflow-hidden">
                          <button
                            onClick={() => updateCartQuantity(item.id, 1)}
                            className="w-10 h-full flex items-center justify-center text-zinc-300 hover:bg-white/[0.06] transition"
                          >
                            <Icon name="plus" className="w-4 h-4" strokeWidth={2.2} />
                          </button>
                          <span className="w-9 text-center text-sm font-bold">{item.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(item.id, -1)}
                            className="w-10 h-full flex items-center justify-center text-zinc-300 hover:bg-white/[0.06] transition"
                          >
                            <Icon name="minus" className="w-4 h-4" strokeWidth={2.2} />
                          </button>
                        </div>

                        <p className="font-black text-white w-28 text-left">
                          {fmt(item.price * item.quantity)} <span className="text-xs font-bold text-zinc-500">ر.س</span>
                        </p>

                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="w-10 h-10 rounded-xl text-zinc-500 hover:text-red-300 hover:bg-red-500/10 flex items-center justify-center transition"
                          title="إزالة"
                        >
                          <Icon name="trash" className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <aside className={`${panelCls} p-6 lg:sticky lg:top-36 space-y-5`}>
                  <h3 className="font-extrabold text-white text-lg">ملخص الطلب</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-zinc-400">
                      <span>عدد القطع</span>
                      <span className="font-semibold text-zinc-200">{totalCartCount}</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>المجموع الفرعي</span>
                      <span className="font-semibold text-zinc-200">{fmt(calculateSubtotal())} ر.س</span>
                    </div>
                  </div>
                  <div className="border-t border-white/[0.07] pt-4 flex justify-between items-end">
                    <span className="text-sm font-bold text-zinc-300">الإجمالي</span>
                    <span className="text-3xl font-black text-white">
                      {fmt(calculateSubtotal())} <span className="text-sm text-zinc-500">ر.س</span>
                    </span>
                  </div>
                  <button onClick={handleOpenCheckoutModal} className={`${btnPrimary} w-full h-12 text-base`}>
                    <Icon name="lock" className="w-4 h-4" />
                    المتابعة للدفع والتعميد
                  </button>
                  <p className="text-[11px] text-zinc-500 text-center flex items-center justify-center gap-1.5">
                    <Icon name="shield" className="w-3.5 h-3.5" />
                    مدفوعات مشفرة وآمنة — مدى · فيزا · تحويل بنكي
                  </p>
                </aside>
              </div>
            )}
          </div>
        )}

        {/* =================== Payment modal =================== */}
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" dir="rtl">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => !paymentLoading && setShowPaymentModal(false)} />
            <div className="aph-in relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-[#12151B] border border-white/10 shadow-2xl">
              <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-5 border-b border-white/[0.07] bg-[#12151B]/95 backdrop-blur">
                <div>
                  <h3 className="text-lg font-extrabold text-white">إتمام الطلب</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">اختر طريقة الدفع المناسبة لك</p>
                </div>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  disabled={paymentLoading}
                  className="w-9 h-9 rounded-xl hover:bg-white/[0.06] text-zinc-400 hover:text-white flex items-center justify-center transition"
                >
                  <Icon name="x" className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Payment methods */}
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { key: "card" as const, icon: "card", t: "دفع إلكتروني", s: "مدى / فيزا" },
                    { key: "reservation" as const, icon: "lock", t: "نظام الحجز", s: "+150 ر.س" },
                    { key: "bank_transfer" as const, icon: "bank", t: "تحويل بنكي", s: "الراجحي" },
                  ].map((m) => {
                    const on = paymentMethod === m.key;
                    return (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => setPaymentMethod(m.key)}
                        className={`relative rounded-2xl border p-3.5 text-right transition ${
                          on
                            ? "border-orange-500/70 bg-orange-500/[0.08] ring-4 ring-orange-500/10"
                            : "border-white/10 bg-white/[0.02] hover:border-white/20"
                        }`}
                      >
                        {on && (
                          <span className="absolute top-2.5 left-2.5 w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center">
                            <Icon name="check" className="w-3 h-3" strokeWidth={3} />
                          </span>
                        )}
                        <Icon name={m.icon} className={`w-6 h-6 ${on ? "text-orange-400" : "text-zinc-400"}`} />
                        <p className="text-xs font-bold text-zinc-100 mt-3">{m.t}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">{m.s}</p>
                      </button>
                    );
                  })}
                </div>

                {/* Summary */}
                <div className="rounded-2xl bg-[#0D1014] border border-white/[0.07] p-4 space-y-2.5">
                  <div className="flex justify-between text-sm text-zinc-400">
                    <span>قيمة القطع</span>
                    <span className="text-zinc-200 font-semibold">{fmt(calculateSubtotal())} ر.س</span>
                  </div>
                  {paymentMethod === "reservation" && (
                    <div className="flex justify-between text-sm text-amber-300">
                      <span>رسوم الحجز والتثبيت</span>
                      <span className="font-semibold">+ 150 ر.س</span>
                    </div>
                  )}
                  <div className="flex justify-between items-end pt-3 border-t border-white/[0.07]">
                    <span className="text-sm font-bold text-zinc-200">الإجمالي النهائي</span>
                    <span className="text-2xl font-black text-white">
                      {fmt(calculateFinalTotal())} <span className="text-xs text-zinc-500">ر.س</span>
                    </span>
                  </div>
                </div>

                <form onSubmit={handleProcessPayment} className="space-y-4">
                  {paymentMethod === "card" && (
                    <div className="space-y-4">
                      {/* Card preview */}
                      <div className="relative h-44 rounded-2xl overflow-hidden p-5 flex flex-col justify-between bg-gradient-to-br from-zinc-800 via-zinc-900 to-black border border-white/10">
                        <div className="absolute -top-16 -left-16 w-48 h-48 rounded-full bg-orange-500/25 blur-3xl" />
                        <div className="relative flex justify-between items-start">
                          <div className="w-11 h-8 rounded-md bg-gradient-to-br from-amber-200 to-amber-500 opacity-90" />
                          <span className="text-xs font-black text-white/80" dir="ltr">
                            AutoParts<span className="text-orange-400">Hub</span>
                          </span>
                        </div>
                        <p className="relative text-lg sm:text-xl font-mono tracking-[0.18em] text-white text-left" dir="ltr">
                          {cardForm.cardNumber || "•••• •••• •••• ••••"}
                        </p>
                        <div className="relative flex justify-between text-[11px] text-white/70" dir="ltr">
                          <span className="uppercase truncate max-w-[60%]">{cardForm.cardHolder || "CARD HOLDER"}</span>
                          <span className="font-mono">{cardForm.expiry}</span>
                        </div>
                      </div>

                      <div>
                        <label className={labelCls}>اسم حامل البطاقة</label>
                        <input
                          type="text"
                          required
                          className={inputCls}
                          value={cardForm.cardHolder}
                          onChange={(e) => setCardForm({ ...cardForm, cardHolder: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>رقم البطاقة (مدى / فيزا)</label>
                        <input
                          type="text"
                          required
                          maxLength={19}
                          dir="ltr"
                          className={`${inputCls} font-mono tracking-widest text-left`}
                          value={cardForm.cardNumber}
                          onChange={(e) => setCardForm({ ...cardForm, cardNumber: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={labelCls}>تاريخ الانتهاء</label>
                          <input
                            type="text"
                            required
                            placeholder="MM/YY"
                            dir="ltr"
                            className={`${inputCls} text-center font-mono`}
                            value={cardForm.expiry}
                            onChange={(e) => setCardForm({ ...cardForm, expiry: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>CVC</label>
                          <input
                            type="password"
                            required
                            maxLength={4}
                            placeholder="•••"
                            className={`${inputCls} text-center font-mono`}
                            value={cardForm.cvc}
                            onChange={(e) => setCardForm({ ...cardForm, cvc: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === "reservation" && (
                    <div className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] p-4 space-y-4">
                      <div className="flex gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-300 flex items-center justify-center shrink-0">
                          <Icon name="lock" className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-amber-200 text-sm">حجز القطعة لمدة 48 ساعة</p>
                          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                            نحجز القطعة في المستودع ونمنع بيعها لغيرك خلال 48 ساعة، وتضاف <b className="text-amber-200">150 ر.س</b> كرسوم حجز
                            وتأكيد إداري.
                          </p>
                        </div>
                      </div>
                      <div>
                        <label className={labelCls}>رقم التواصل للتأكيد مع المستودع</label>
                        <div className="relative">
                          <Icon name="phone" className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                          <input type="tel" required placeholder="05xxxxxxxx" dir="ltr" className={`${inputCls} pr-10 text-right`} />
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === "bank_transfer" && (
                    <div className="rounded-2xl border border-violet-500/25 bg-violet-500/[0.06] p-4 space-y-4">
                      <p className="font-bold text-violet-200 text-sm flex items-center gap-2">
                        <Icon name="bank" className="w-4 h-4" />
                        بيانات الحساب البنكي الرسمي
                      </p>
                      <dl className="rounded-xl bg-[#0D1014] border border-white/[0.07] divide-y divide-white/[0.06] text-xs">
                        <div className="flex justify-between p-3">
                          <dt className="text-zinc-500">اسم البنك</dt>
                          <dd className="font-semibold text-zinc-200">مصرف الراجحي</dd>
                        </div>
                        <div className="flex justify-between p-3">
                          <dt className="text-zinc-500">اسم الحساب</dt>
                          <dd className="font-semibold text-zinc-200">شركة AutoParts Hub المحدودة</dd>
                        </div>
                        <div className="flex justify-between items-center p-3 gap-3">
                          <dt className="text-zinc-500 shrink-0">الآيبان</dt>
                          <dd className="font-mono font-semibold text-emerald-300 text-[11px] sm:text-xs" dir="ltr">
                            SA44 8000 0000 6080 1010 9999
                          </dd>
                        </div>
                      </dl>
                      <div>
                        <label className={labelCls}>اسم المحوّل (كما هو في الحساب البنكي)</label>
                        <input type="text" required placeholder="أدخل اسم المحوّل" className={inputCls} />
                      </div>
                    </div>
                  )}

                  <button type="submit" disabled={paymentLoading} className={`${btnPrimary} w-full h-12 text-base`}>
                    {paymentLoading ? (
                      <>
                        <Icon name="spinner" className="w-5 h-5 animate-spin" />
                        جاري تأكيد العملية...
                      </>
                    ) : (
                      <>
                        تأكيد الطلب — {fmt(calculateFinalTotal())} ر.س
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* =================== 4. Client orders =================== */}
        {activeTab === "my_orders" && user.role === "client" && (
          <div className="aph-in">
            <SectionHeader
              icon="box"
              title="طلباتي"
              subtitle="تابع حالة طلباتك المشتراة"
              actions={
                <button onClick={() => fetchMyOrders(user.id)} className={btnGhost}>
                  <Icon name="refresh" className="w-4 h-4" />
                  تحديث
                </button>
              }
            />

            {orders.length === 0 ? (
              <EmptyState
                icon="box"
                title="لا توجد طلبات بعد"
                hint="عند إتمام أول طلب من السلة سيظهر هنا مع حالته."
                action={
                  <button onClick={() => setActiveTab("store")} className={btnPrimary}>
                    ابدأ التسوق
                  </button>
                }
              />
            ) : (
              <div className="space-y-3">
                {orders.map((ord) => (
                  <div key={ord.id} className={`${panelCls} p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:items-center`}>
                    {orderThumb(ord, "md")}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-black text-white">طلب #{ord.id}</span>
                        <StatusBadge status={ord.status} />
                        <PaymentBadge method={ord.payment_method} />
                      </div>
                      <p className="text-sm text-zinc-300 line-clamp-2">{ord.items_summary}</p>
                      <p className="text-xs text-zinc-500 flex items-center gap-1.5">
                        <Icon name="calendar" className="w-3.5 h-3.5" />
                        {formatDate(ord.created_at)}
                      </p>
                    </div>
                    <div className="sm:text-left sm:border-r sm:border-white/[0.07] sm:pr-5">
                      <p className="text-[11px] text-zinc-500">إجمالي المبلغ</p>
                      <p className="text-2xl font-black text-white">
                        {fmt(ord.total_price)} <span className="text-xs text-zinc-500">ر.س</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =================== 5. Client custom request =================== */}
        {activeTab === "custom_request" && user.role === "client" && (
          <div className="aph-in">
            <SectionHeader icon="search" title="طلب قطعة غير متوفرة" subtitle="أرسل مواصفات القطعة وفريقنا يبحث لك عنها ويرد عليك" />
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
              <div className={`lg:col-span-2 ${panelCls} p-6 lg:sticky lg:top-36`}>
                <form onSubmit={handleSendCustomRequest} className="space-y-4">
                  <div>
                    <label className={labelCls}>القسم المطلوب</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(["parts", "salvage"] as const).map((c) => (
                        <button
                          type="button"
                          key={c}
                          onClick={() => setCustomForm({ ...customForm, category: c })}
                          className={`h-11 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                            customForm.category === c
                              ? c === "parts"
                                ? "border-sky-500/60 bg-sky-500/10 text-sky-200"
                                : "border-lime-500/60 bg-lime-500/10 text-lime-200"
                              : "border-white/10 text-zinc-400 hover:border-white/20"
                          }`}
                        >
                          <Icon name={c === "parts" ? "wrench" : "car"} className="w-4 h-4" />
                          {c === "parts" ? "قطع غيار (جديدة)" : "تشاليح (مستعملة)"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>اسم القطعة</label>
                    <input
                      type="text"
                      placeholder="مثال: كمبروسر مكيف"
                      required
                      className={inputCls}
                      value={customForm.part_name}
                      onChange={(e) => setCustomForm({ ...customForm, part_name: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>الشركة</label>
                      <input
                        type="text"
                        placeholder="تويوتا"
                        required
                        className={inputCls}
                        value={customForm.make}
                        onChange={(e) => setCustomForm({ ...customForm, make: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>الموديل</label>
                      <input
                        type="text"
                        placeholder="كامري"
                        required
                        className={inputCls}
                        value={customForm.model}
                        onChange={(e) => setCustomForm({ ...customForm, model: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>سنة الصنع</label>
                      <input
                        type="number"
                        placeholder="2020"
                        className={inputCls}
                        value={customForm.year}
                        onChange={(e) => setCustomForm({ ...customForm, year: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>{customForm.category === "salvage" ? "الحالة المطلوبة" : "رقم الهيكل (VIN)"}</label>
                      <input
                        type="text"
                        placeholder={customForm.category === "salvage" ? "نظيفة" : "اختياري"}
                        className={inputCls}
                        value={customForm.vin}
                        onChange={(e) => setCustomForm({ ...customForm, vin: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>ملاحظات إضافية</label>
                    <textarea
                      placeholder="أي تفاصيل تساعدنا في إيجاد القطعة..."
                      rows={3}
                      className={textareaCls}
                      value={customForm.notes}
                      onChange={(e) => setCustomForm({ ...customForm, notes: e.target.value })}
                    />
                  </div>

                  <button type="submit" className={`${btnPrimary} w-full`}>
                    <Icon name="send" className="w-4 h-4" />
                    إرسال الطلب
                  </button>
                </form>
              </div>

              <div className="lg:col-span-3 space-y-3">
                <h3 className="text-sm font-bold text-zinc-400 mb-1">طلباتك السابقة ({customRequests.length})</h3>
                {customRequests.length === 0 ? (
                  <EmptyState icon="message" title="لم تقدم أي طلب خاص بعد" hint="أرسل طلبك من النموذج وسيظهر هنا مع رد الإدارة." />
                ) : (
                  customRequests.map((req) => {
                    const isReplied = req.admin_reply && req.admin_reply.trim() !== "";
                    const displayStatus = isReplied && req.status === "قيد النظر" ? "تم الرد" : req.status;
                    return (
                      <div key={req.id} className={`${panelCls} p-5 space-y-3`}>
                        <div className="flex justify-between items-start gap-3">
                          <div className="space-y-1.5 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-bold text-white">{req.part_name}</h4>
                              <CategoryBadge category={req.category} long />
                            </div>
                            <p className="text-xs text-zinc-500 flex items-center gap-1.5">
                              <Icon name="car" className="w-3.5 h-3.5" />
                              {req.make} {req.model} · {req.year || "سنة غير محددة"}
                              {req.vin && (
                                <span className="text-zinc-600">
                                  {" "}
                                  — {req.category === "salvage" ? "الحالة:" : "VIN:"} {req.vin}
                                </span>
                              )}
                            </p>
                          </div>
                          <StatusBadge status={displayStatus} />
                        </div>

                        {req.notes && (
                          <p className="text-xs text-zinc-400 bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 leading-relaxed">
                            <span className="text-zinc-500 font-semibold">ملاحظاتك: </span>
                            {req.notes}
                          </p>
                        )}

                        {req.admin_reply && (
                          <div className="rounded-xl border border-orange-500/20 bg-orange-500/[0.06] p-3.5 flex gap-3">
                            <div className="w-8 h-8 rounded-lg bg-orange-500/15 text-orange-300 flex items-center justify-center shrink-0">
                              <Icon name="message" className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-[11px] font-bold text-orange-300">رد فريق AutoParts Hub</p>
                              <p className="text-sm text-zinc-200 mt-0.5 leading-relaxed">{req.admin_reply}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* =================== 6. Admin custom requests =================== */}
        {activeTab === "custom_admin" && user.role === "admin" && (
          <div className="aph-in">
            <SectionHeader
              icon="message"
              title="الطلبات الخاصة الواردة"
              subtitle={`${customRequests.length} طلب — ${pendingCustom} بانتظار الرد`}
              actions={
                <button onClick={fetchCustomRequestsAdmin} className={btnGhost}>
                  <Icon name="refresh" className="w-4 h-4" />
                  تحديث
                </button>
              }
            />

            {customRequests.length === 0 ? (
              <EmptyState icon="message" title="لا توجد طلبات خاصة" hint="ستظهر هنا طلبات العملاء للقطع غير المتوفرة." />
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {customRequests.map((req) => (
                  <div key={req.id} className={`${panelCls} overflow-hidden flex flex-col`}>
                    <div className="p-5 space-y-4 flex-1">
                      <div className="flex justify-between items-start gap-3">
                        <div className="space-y-2 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-zinc-500">#{req.id}</span>
                            <CategoryBadge category={req.category} long />
                          </div>
                          <h3 className="font-extrabold text-lg text-white">{req.part_name}</h3>
                        </div>
                        <StatusBadge status={req.status} />
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-3">
                          <p className="text-zinc-500 mb-1">العميل</p>
                          <p className="font-semibold text-zinc-200 truncate">{req.user_name}</p>
                          <p className="text-zinc-500 truncate" dir="ltr">
                            {req.user_email}
                          </p>
                        </div>
                        <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-3">
                          <p className="text-zinc-500 mb-1">السيارة</p>
                          <p className="font-semibold text-zinc-200 truncate">
                            {req.make} {req.model}
                          </p>
                          <p className="text-zinc-500 truncate">
                            {req.year || "السنة غير محددة"} · {req.category === "salvage" ? "الحالة" : "VIN"}: {req.vin || "—"}
                          </p>
                        </div>
                      </div>

                      {req.notes && (
                        <p className="text-xs text-zinc-300 bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 leading-relaxed">
                          <span className="text-zinc-500 font-semibold block mb-1">تفاصيل العميل</span>
                          {req.notes}
                        </p>
                      )}

                      <div>
                        <label className={labelCls}>الرد للعميل</label>
                        <textarea
                          rows={2}
                          placeholder="مثال: متوفرة بسعر 450 ريال / ستتوفر خلال أسبوع"
                          className={textareaCls}
                          value={replyInputs[req.id] !== undefined ? replyInputs[req.id] : req.admin_reply || ""}
                          onChange={(e) => setReplyInputs({ ...replyInputs, [req.id]: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 border-t border-white/[0.07] divide-x divide-x-reverse divide-white/[0.07]">
                      <button
                        onClick={() => handleReplyCustomRequest(req.id, "تم الرد")}
                        className="h-12 text-xs font-bold text-sky-300 hover:bg-sky-500/10 flex items-center justify-center gap-1.5 transition"
                      >
                        <Icon name="send" className="w-4 h-4" />
                        إرسال الرد
                      </button>
                      <button
                        onClick={() => handleReplyCustomRequest(req.id, "متوفرة")}
                        className="h-12 text-xs font-bold text-emerald-300 hover:bg-emerald-500/10 flex items-center justify-center gap-1.5 transition"
                      >
                        <Icon name="check" className="w-4 h-4" strokeWidth={2.4} />
                        متوفرة
                      </button>
                      <button
                        onClick={() => handleReplyCustomRequest(req.id, "غير متوفرة")}
                        className="h-12 text-xs font-bold text-red-300 hover:bg-red-500/10 flex items-center justify-center gap-1.5 transition"
                      >
                        <Icon name="ban" className="w-4 h-4" />
                        غير متوفرة
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =================== 7. Inventory =================== */}
        {activeTab === "inventory" && user.role === "admin" && (
          <div className="aph-in">
            <SectionHeader icon="box" title="إدارة المخزن" subtitle={`${parts.length} قطعة مسجلة`} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              <div className={`${panelCls} p-6 lg:sticky lg:top-36`}>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-extrabold text-white">{isEditing ? "تعديل القطعة" : "إضافة قطعة جديدة"}</h3>
                  {isEditing && (
                    <span className="text-[11px] font-bold text-orange-300 bg-orange-500/10 rounded-full px-2.5 py-1">#{partForm.id}</span>
                  )}
                </div>

                <form onSubmit={handleSavePart} className="space-y-4">
                  <div>
                    <label className={labelCls}>القسم</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(["parts", "salvage"] as const).map((c) => (
                        <button
                          type="button"
                          key={c}
                          onClick={() => setPartForm({ ...partForm, category: c })}
                          className={`h-11 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                            partForm.category === c
                              ? c === "parts"
                                ? "border-sky-500/60 bg-sky-500/10 text-sky-200"
                                : "border-lime-500/60 bg-lime-500/10 text-lime-200"
                              : "border-white/10 text-zinc-400 hover:border-white/20"
                          }`}
                        >
                          <Icon name={c === "parts" ? "wrench" : "car"} className="w-4 h-4" />
                          {c === "parts" ? "قطع غيار" : "تشاليح"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>اسم القطعة</label>
                    <input
                      type="text"
                      required
                      className={inputCls}
                      value={partForm.part_name}
                      onChange={(e) => setPartForm({ ...partForm, part_name: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>الشركة</label>
                      <input
                        type="text"
                        required
                        className={inputCls}
                        value={partForm.make}
                        onChange={(e) => setPartForm({ ...partForm, make: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>الموديل</label>
                      <input
                        type="text"
                        required
                        className={inputCls}
                        value={partForm.model}
                        onChange={(e) => setPartForm({ ...partForm, model: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>السنة</label>
                      <input
                        type="number"
                        className={inputCls}
                        value={partForm.year}
                        onChange={(e) => setPartForm({ ...partForm, year: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>السعر (ر.س)</label>
                      <input
                        type="number"
                        required
                        className={inputCls}
                        value={partForm.price}
                        onChange={(e) => setPartForm({ ...partForm, price: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>{partForm.category === "salvage" ? "حالة القطعة" : "رقم الهيكل (VIN)"}</label>
                    <input
                      type="text"
                      placeholder={partForm.category === "salvage" ? "ممتازة، بها خدش بسيط، شبه جديدة..." : ""}
                      className={inputCls}
                      value={partForm.vin}
                      onChange={(e) => setPartForm({ ...partForm, vin: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>رابط الصورة</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      dir="ltr"
                      className={`${inputCls} text-left`}
                      value={partForm.image_url}
                      onChange={(e) => setPartForm({ ...partForm, image_url: e.target.value })}
                    />
                    {partForm.image_url && (
                      <div className="mt-3 aspect-[16/9] rounded-xl overflow-hidden border border-white/10 bg-[#0D1014]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={partForm.image_url} alt="معاينة" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button type="submit" className={`${btnPrimary} flex-1`}>
                      <Icon name={isEditing ? "check" : "plus"} className="w-4 h-4" strokeWidth={2.4} />
                      {isEditing ? "حفظ التعديلات" : "إضافة للمخزن"}
                    </button>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          resetPartForm();
                        }}
                        className={`${btnGhost} h-11`}
                      >
                        إلغاء
                      </button>
                    )}
                  </div>
                </form>
              </div>

              <div className={`lg:col-span-2 ${panelCls} overflow-hidden`}>
                <div className="p-4 border-b border-white/[0.07]">
                  <div className="relative">
                    <Icon name="search" className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="ابحث في المخزن..."
                      className={`${inputCls} pr-10`}
                      value={inventorySearch}
                      onChange={(e) => setInventorySearch(e.target.value)}
                    />
                  </div>
                </div>
                {inventoryParts.length === 0 ? (
                  <div className="p-6">
                    <EmptyState icon="box" title="لا توجد قطع" hint="أضف أول قطعة من النموذج." />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-sm">
                      <thead>
                        <tr className="text-[11px] uppercase tracking-wide text-zinc-500 border-b border-white/[0.07]">
                          <th className="px-4 py-3 font-semibold">القطعة</th>
                          <th className="px-4 py-3 font-semibold">القسم</th>
                          <th className="px-4 py-3 font-semibold">الحالة / VIN</th>
                          <th className="px-4 py-3 font-semibold">السعر</th>
                          <th className="px-4 py-3 font-semibold w-24"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.05]">
                        {inventoryParts.map((p) => (
                          <tr
                            key={p.id}
                            className={`transition hover:bg-white/[0.02] ${isEditing && partForm.id === p.id ? "bg-orange-500/[0.05]" : ""}`}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-lg overflow-hidden bg-[#0D1014] border border-white/[0.07] flex items-center justify-center shrink-0">
                                  {p.image_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={p.image_url} alt={p.part_name} className="w-full h-full object-cover" />
                                  ) : (
                                    <Icon name="image" className="w-4 h-4 text-zinc-700" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-zinc-100 truncate max-w-[220px]">{p.part_name}</p>
                                  <p className="text-xs text-zinc-500">
                                    {p.make} {p.model} {p.year ? `· ${p.year}` : ""}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <CategoryBadge category={p.category} />
                            </td>
                            <td className="px-4 py-3 text-xs text-zinc-400 max-w-[160px] truncate">{p.vin || "—"}</td>
                            <td className="px-4 py-3 font-bold text-white whitespace-nowrap">
                              {fmt(p.price)} <span className="text-[11px] text-zinc-500">ر.س</span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1 justify-end">
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
                                    window.scrollTo({ top: 0, behavior: "smooth" });
                                  }}
                                  className="w-9 h-9 rounded-lg text-zinc-400 hover:text-sky-300 hover:bg-sky-500/10 flex items-center justify-center transition"
                                  title="تعديل"
                                >
                                  <Icon name="edit" className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeletePart(p.id)}
                                  className="w-9 h-9 rounded-lg text-zinc-400 hover:text-red-300 hover:bg-red-500/10 flex items-center justify-center transition"
                                  title="حذف"
                                >
                                  <Icon name="trash" className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* =================== 8. Staff =================== */}
        {activeTab === "staff" && user.role === "admin" && (
          <div className="aph-in max-w-xl mx-auto">
            <SectionHeader icon="users" title="إضافة موظف / إداري" subtitle="أنشئ حساباً للموظف للوصول إلى لوحة التحكم" />
            <div className={`${panelCls} p-6 sm:p-8`}>
              {employeeMsg && (
                <div
                  className={`mb-5 flex items-center gap-2.5 rounded-xl border p-3.5 text-sm ${
                    employeeMsg.startsWith("خطأ")
                      ? "border-red-500/30 bg-red-500/10 text-red-300"
                      : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  }`}
                >
                  <Icon name={employeeMsg.startsWith("خطأ") ? "info" : "check"} className="w-4 h-4 shrink-0" />
                  {employeeMsg}
                </div>
              )}

              <form onSubmit={handleAddEmployee} className="space-y-4">
                <div>
                  <label className={labelCls}>اسم الموظف</label>
                  <div className="relative">
                    <Icon name="user" className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      required
                      placeholder="مثال: أحمد علي"
                      className={`${inputCls} pr-10`}
                      value={employeeForm.name}
                      onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>البريد الإلكتروني</label>
                  <div className="relative">
                    <Icon name="mail" className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="email"
                      required
                      placeholder="employee@autoparts.com"
                      dir="ltr"
                      className={`${inputCls} pr-10 text-right`}
                      value={employeeForm.email}
                      onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>كلمة المرور</label>
                  <div className="relative">
                    <Icon name="lock" className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      className={`${inputCls} pr-10`}
                      value={employeeForm.password}
                      onChange={(e) => setEmployeeForm({ ...employeeForm, password: e.target.value })}
                    />
                  </div>
                </div>
                <button type="submit" className={`${btnPrimary} w-full h-12 mt-2`}>
                  <Icon name="plus" className="w-4 h-4" strokeWidth={2.4} />
                  إنشاء حساب الموظف
                </button>
              </form>
            </div>
          </div>
        )}

        {/* =================== 9. Admin orders dashboard =================== */}
        {activeTab === "orders" && user.role === "admin" && (
          <div className="aph-in">
            <SectionHeader
              icon="clipboard"
              title="إدارة الطلبات"
              subtitle="تابع طلبات العملاء وحدّث حالتها"
              actions={
                <button onClick={fetchOrdersAdmin} className={btnGhost}>
                  <Icon name="refresh" className="w-4 h-4" />
                  تحديث
                </button>
              }
            />

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              {[
                { label: "إجمالي الطلبات", value: fmt(orders.length), icon: "clipboard", tone: "text-zinc-200 bg-white/[0.05]" },
                { label: "بانتظار المعالجة", value: fmt(orderCounts["معلق"]), icon: "clock", tone: "text-amber-300 bg-amber-500/10" },
                { label: "قيد التوصيل", value: fmt(orderCounts["قيد التوصيل"]), icon: "truck", tone: "text-sky-300 bg-sky-500/10" },
                { label: "قيمة المبيعات", value: `${fmt(revenue)}`, unit: "ر.س", icon: "wallet", tone: "text-emerald-300 bg-emerald-500/10" },
              ].map((k) => (
                <div key={k.label} className={`${panelCls} p-4 sm:p-5`}>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-zinc-500">{k.label}</p>
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${k.tone}`}>
                      <Icon name={k.icon} className="w-4 h-4" />
                    </span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-white mt-3">
                    {k.value} {k.unit && <span className="text-xs font-bold text-zinc-500">{k.unit}</span>}
                  </p>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col lg:flex-row gap-3 mb-4">
              <div className="aph-scroll flex gap-1.5 overflow-x-auto p-1 rounded-xl bg-white/[0.03] border border-white/[0.07]">
                {["الكل", ...ORDER_STATUSES].map((s) => {
                  const on = orderFilter === s;
                  const count = s === "الكل" ? orders.length : orderCounts[s];
                  return (
                    <button
                      key={s}
                      onClick={() => setOrderFilter(s)}
                      className={`shrink-0 h-9 px-3.5 rounded-lg text-xs font-bold flex items-center gap-2 transition ${
                        on ? "bg-white text-zinc-900" : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      {s}
                      <span className={`text-[10px] px-1.5 rounded-md ${on ? "bg-zinc-900/10" : "bg-white/[0.06]"}`}>{count}</span>
                    </button>
                  );
                })}
              </div>
              <div className="relative flex-1">
                <Icon name="search" className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="ابحث برقم الطلب، اسم العميل، البريد أو القطعة..."
                  className={`${inputCls} pr-10`}
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                />
              </div>
            </div>

            {visibleOrders.length === 0 ? (
              <EmptyState
                icon="clipboard"
                title={orders.length === 0 ? "لا توجد طلبات حالياً" : "لا توجد طلبات مطابقة"}
                hint={orders.length === 0 ? "ستظهر طلبات العملاء هنا فور إتمامها." : "جرّب تغيير الفلتر أو كلمة البحث."}
              />
            ) : (
              <div className="space-y-3">
                {visibleOrders.map((ord) => {
                  const imgs = getOrderImages(ord);
                  return (
                    <div
                      key={ord.id}
                      className={`${panelCls} p-4 sm:p-5 flex flex-col md:flex-row gap-4 md:items-center transition hover:border-white/15`}
                    >
                      <div className="flex gap-4 flex-1 min-w-0">
                        {orderThumb(ord)}

                        <div className="flex-1 min-w-0 space-y-2.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-black text-white text-lg">#{ord.id}</span>
                            <StatusBadge status={ord.status} />
                            <PaymentBadge method={ord.payment_method} />
                            {imgs.length > 0 && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-500">
                                <Icon name="image" className="w-3.5 h-3.5" />
                                {imgs.length} {imgs.length === 1 ? "صورة" : "صور"}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-zinc-200 font-medium line-clamp-2">{ord.items_summary}</p>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
                            <span className="flex items-center gap-1.5">
                              <Icon name="user" className="w-3.5 h-3.5" />
                              <span className="text-zinc-300 font-semibold">{ord.user_name}</span>
                            </span>
                            <span className="flex items-center gap-1.5" dir="ltr">
                              {ord.user_email}
                              <Icon name="mail" className="w-3.5 h-3.5" />
                            </span>
                            {ord.created_at && (
                              <span className="flex items-center gap-1.5">
                                <Icon name="calendar" className="w-3.5 h-3.5" />
                                {formatDate(ord.created_at)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex md:flex-col items-center md:items-end justify-between gap-3 md:border-r md:border-white/[0.07] md:pr-5 md:min-w-[190px]">
                        <div className="md:text-left">
                          <p className="text-[11px] text-zinc-500">الإجمالي</p>
                          <p className="text-2xl font-black text-white whitespace-nowrap">
                            {fmt(ord.total_price)} <span className="text-xs text-zinc-500">ر.س</span>
                          </p>
                        </div>
                        <div className="relative">
                          <select
                            value={ord.status}
                            onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                            className="appearance-none h-10 rounded-xl bg-[#0D1014] border border-white/10 pr-3 pl-9 text-xs font-bold text-zinc-100 outline-none cursor-pointer transition focus:border-orange-500/70 focus:ring-4 focus:ring-orange-500/10 hover:border-white/20"
                          >
                            <option value="معلق">⏳ معلق</option>
                            <option value="قيد التوصيل">🚚 قيد التوصيل</option>
                            <option value="مكتمل">✅ مكتمل</option>
                            <option value="ملغي">❌ ملغي</option>
                          </select>
                          <Icon
                            name="chevronLeft"
                            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 -rotate-90 text-zinc-500 pointer-events-none"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* =================== Lightbox =================== */}
      {lightbox && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" dir="rtl">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setLightbox(null)} />
          <div className="aph-in relative w-full max-w-4xl">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-white">
                {lightbox.title}
                {lightbox.images.length > 1 && (
                  <span className="text-zinc-400 font-medium mr-2">
                    ({lightbox.index + 1} / {lightbox.images.length})
                  </span>
                )}
              </p>
              <button
                onClick={() => setLightbox(null)}
                className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
              >
                <Icon name="x" className="w-5 h-5" />
              </button>
            </div>
            <div className="relative rounded-2xl overflow-hidden bg-black border border-white/10 flex items-center justify-center max-h-[75vh]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={lightbox.images[lightbox.index]} alt={lightbox.title} className="max-h-[75vh] w-auto max-w-full object-contain" />
              {lightbox.images.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setLightbox((l) => (l ? { ...l, index: (l.index - 1 + l.images.length) % l.images.length } : l))
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur transition"
                  >
                    <Icon name="chevronRight" className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setLightbox((l) => (l ? { ...l, index: (l.index + 1) % l.images.length } : l))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur transition"
                  >
                    <Icon name="chevronLeft" className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
            {lightbox.images.length > 1 && (
              <div className="aph-scroll flex gap-2 mt-3 overflow-x-auto justify-center">
                {lightbox.images.map((src, i) => (
                  <button
                    key={src + i}
                    onClick={() => setLightbox((l) => (l ? { ...l, index: i } : l))}
                    className={`w-16 h-16 shrink-0 rounded-lg overflow-hidden border-2 transition ${
                      i === lightbox.index ? "border-orange-500" : "border-transparent opacity-50 hover:opacity-100"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {toastLayer}
    </div>
  );
}
