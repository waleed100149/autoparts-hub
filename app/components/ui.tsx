"use client";

import type React from "react";

/* =========================================================
   Icons (inline SVG — no external dependency)
   ========================================================= */
export const ICONS: Record<string, React.ReactNode> = {
  store: (
    <>
      <path d="M3 9l1.5-5h15L21 9" />
      <path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" />
      <path d="M5 12v8h14v-8M10 20v-5h4v5" />
    </>
  ),
  upload: (
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M17 8l-5-5-5 5M12 3v12" />
    </>
  ),
  file: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M8 13h8M8 17h5" />
    </>
  ),
  percent: (
    <>
      <path d="M19 5L5 19" />
      <circle cx="6.5" cy="6.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
    </>
  ),
  chart: <path d="M3 3v18h18M7 15l4-4 3 3 5-6" />,
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

export function Icon({ name, className = "w-5 h-5", strokeWidth = 1.8 }: { name: string; className?: string; strokeWidth?: number }) {
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
export const inputCls =
  "w-full h-11 rounded-xl bg-[#0D1014] border border-white/10 px-3.5 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition focus:border-orange-500/70 focus:ring-4 focus:ring-orange-500/10";
export const textareaCls =
  "w-full rounded-xl bg-[#0D1014] border border-white/10 px-3.5 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition focus:border-orange-500/70 focus:ring-4 focus:ring-orange-500/10 resize-none";
export const labelCls = "block text-xs font-semibold text-zinc-400 mb-1.5";
export const panelCls = "rounded-2xl bg-[#12151B] border border-white/[0.07]";
export const btnPrimary =
  "inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-orange-500 hover:bg-orange-400 active:bg-orange-600 text-white text-sm font-bold transition shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed";
export const btnGhost =
  "inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-zinc-200 text-sm font-semibold transition";

export const fmt = (n: number | string | null | undefined) => Number(n || 0).toLocaleString("en-US");

export const formatDate = (d: string) => {
  try {
    return new Date(d).toLocaleString("ar-SA-u-ca-gregory-nu-latn", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return d;
  }
};

export const STATUS_META: Record<string, { cls: string; dot: string; icon: string }> = {
  "معلق": { cls: "bg-amber-500/10 text-amber-300 ring-amber-500/25", dot: "bg-amber-400", icon: "clock" },
  "قيد النظر": { cls: "bg-amber-500/10 text-amber-300 ring-amber-500/25", dot: "bg-amber-400", icon: "clock" },
  "قيد التوصيل": { cls: "bg-sky-500/10 text-sky-300 ring-sky-500/25", dot: "bg-sky-400", icon: "truck" },
  "تم الرد": { cls: "bg-sky-500/10 text-sky-300 ring-sky-500/25", dot: "bg-sky-400", icon: "message" },
  "مكتمل": { cls: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/25", dot: "bg-emerald-400", icon: "check" },
  "متوفرة": { cls: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/25", dot: "bg-emerald-400", icon: "check" },
  "ملغي": { cls: "bg-red-500/10 text-red-300 ring-red-500/25", dot: "bg-red-400", icon: "ban" },
  "غير متوفرة": { cls: "bg-red-500/10 text-red-300 ring-red-500/25", dot: "bg-red-400", icon: "ban" },
};

export function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] || STATUS_META["معلق"];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${m.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {status}
    </span>
  );
}

export function CategoryBadge({ category, long = false }: { category?: "parts" | "salvage"; long?: boolean }) {
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

export function paymentMeta(method?: string) {
  const m = method || "دفع إلكتروني";
  if (m.includes("تحويل")) return { label: m, icon: "bank", cls: "bg-violet-500/10 text-violet-300 ring-violet-500/25" };
  if (m.includes("حجز")) return { label: m, icon: "lock", cls: "bg-amber-500/10 text-amber-300 ring-amber-500/25" };
  return { label: m, icon: "card", cls: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/25" };
}

export function PaymentBadge({ method }: { method?: string }) {
  const p = paymentMeta(method);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${p.cls}`}>
      <Icon name={p.icon} className="w-3.5 h-3.5" strokeWidth={2} />
      {p.label}
    </span>
  );
}

export function EmptyState({ icon, title, hint, action }: { icon: string; title: string; hint?: string; action?: React.ReactNode }) {
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

export function SectionHeader({ icon, title, subtitle, actions }: { icon: string; title: string; subtitle?: string; actions?: React.ReactNode }) {
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

export function Logo({ size = "md" }: { size?: "md" | "lg" }) {
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

export const gridBg: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
  backgroundSize: "44px 44px",
};

// الخطوط تُحمَّل عن طريق next/font في layout.tsx
export const FONT_CSS = `.aph-root{font-family:var(--font-plex),system-ui,sans-serif}
.aph-root .font-black,.aph-root .font-extrabold{font-family:var(--font-cairo),var(--font-plex),sans-serif}
.aph-scroll::-webkit-scrollbar{height:0;width:0}
@keyframes aphIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.aph-in{animation:aphIn .35s ease both}
.aph-root input[type=number]::-webkit-inner-spin-button{opacity:.3}
.aph-root select option{background:#12151B}`;

