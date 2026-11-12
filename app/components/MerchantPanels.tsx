"use client";

import { useEffect, useState } from "react";
import {
  EmptyState,
  FONT_CSS,
  Icon,
  Logo,
  SectionHeader,
  StatusBadge,
  btnGhost,
  btnPrimary,
  fmt,
  formatDate,
  gridBg,
  inputCls,
  labelCls,
  panelCls,
} from "./ui";
import { FilePicker } from "./FilePicker";
import { MAX_IMAGE_MB, MERCHANT_STATUS_META, type Merchant } from "./merchant-types";
import { CONTRACT_SECTIONS, CONTRACT_TITLE } from "@/lib/contract";

export function StoreAvatar({ merchant, size = "md" }: { merchant: Pick<Merchant, "store_name" | "logo_url">; size?: "sm" | "md" | "lg" }) {
  const dim = size === "lg" ? "w-20 h-20 text-2xl" : size === "sm" ? "w-8 h-8 text-xs" : "w-12 h-12 text-base";
  return (
    <div className={`${dim} shrink-0 rounded-full overflow-hidden bg-violet-500/15 text-violet-200 font-black flex items-center justify-center border border-white/10`}>
      {merchant.logo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={merchant.logo_url} alt={merchant.store_name} className="w-full h-full object-cover" />
      ) : (
        merchant.store_name?.trim().charAt(0) || "؟"
      )}
    </div>
  );
}

export function MerchantStatusBadge({ status }: { status: Merchant["status"] }) {
  const m = MERCHANT_STATUS_META[status] ?? MERCHANT_STATUS_META.pending;
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${m.cls}`}>{m.label}</span>;
}

/* =========================================================
   شاشة التاجر قبل الاعتماد (قيد المراجعة / مرفوض / موقوف)
   ========================================================= */
export function MerchantStatusScreen({ merchant, onLogout, onRefresh }: { merchant: Merchant; onLogout: () => void; onRefresh: () => void }) {
  const copy = {
    pending: {
      icon: "clock",
      title: "طلبك قيد المراجعة",
      body: "استلمنا بيانات محلك وسجلك التجاري، وفريق الإدارة يراجعها الحين. أول ما ينعتمد حسابك تقدر تضيف قطعك وتبدأ البيع.",
      tone: "text-amber-300 bg-amber-500/10 border-amber-500/30",
    },
    rejected: {
      icon: "ban",
      title: "تم رفض طلب التسجيل",
      body: "للأسف ما قدرنا نعتمد حسابك. راجع ملاحظة الإدارة تحت، وتواصل معنا لو عندك استفسار.",
      tone: "text-red-300 bg-red-500/10 border-red-500/30",
    },
    suspended: {
      icon: "ban",
      title: "حسابك موقوف مؤقتاً",
      body: "قطعك مخفية من المتجر حالياً. تواصل مع الإدارة لمعرفة السبب وإعادة التفعيل.",
      tone: "text-zinc-300 bg-zinc-500/10 border-zinc-500/30",
    },
    approved: { icon: "check", title: "", body: "", tone: "" },
  }[merchant.status];

  return (
    <div className="aph-root min-h-screen bg-[#0A0C0F] text-zinc-100 flex items-center justify-center p-5 relative" dir="rtl">
      <style dangerouslySetInnerHTML={{ __html: FONT_CSS }} />
      <div className="absolute inset-0" style={gridBg} />
      <div className="relative w-full max-w-lg aph-in">
        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>
        <div className={`${panelCls} p-7 text-center`}>
          <div className={`mx-auto w-14 h-14 rounded-2xl border flex items-center justify-center mb-5 ${copy.tone}`}>
            <Icon name={copy.icon} className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-extrabold text-white">{copy.title}</h2>
          <p className="text-sm text-zinc-400 leading-7 mt-2">{copy.body}</p>

          <div className="mt-6 flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 text-right">
            <StoreAvatar merchant={merchant} />
            <div className="min-w-0 flex-1">
              <p className="font-bold text-white truncate">{merchant.store_name}</p>
              <p className="text-xs text-zinc-500">تاريخ الطلب: {formatDate(merchant.created_at)}</p>
            </div>
            <MerchantStatusBadge status={merchant.status} />
          </div>

          {merchant.admin_note && (
            <div className="mt-4 rounded-xl border border-white/10 bg-[#0D1014] p-3.5 text-right">
              <p className="text-[11px] font-bold text-zinc-500 mb-1">ملاحظة الإدارة</p>
              <p className="text-sm text-zinc-200">{merchant.admin_note}</p>
            </div>
          )}

          <div className="mt-6 flex gap-2">
            <button onClick={onRefresh} className={`${btnPrimary} flex-1`}>
              <Icon name="refresh" className="w-4 h-4" />
              تحديث الحالة
            </button>
            <button onClick={onLogout} className={`${btnGhost} h-11`}>
              <Icon name="logout" className="w-4 h-4" />
              خروج
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   مبيعات التاجر
   ========================================================= */
interface Sale {
  id: number;
  order_id: number;
  part_name: string;
  image_url: string | null;
  quantity: number;
  unit_price: number;
  commission_rate: number;
  commission_amount: number;
  merchant_net: number;
  status: string;
  created_at: string;
  user_name: string;
}
interface SalesSummary {
  items_sold: number;
  gross: number;
  commission: number;
  net: number;
  net_completed: number;
}

export function MerchantSales({ merchant }: { merchant: Merchant }) {
  const [data, setData] = useState<{ sales: Sale[]; summary: SalesSummary } | null>(null);
  const [error, setError] = useState("");

  const load = () =>
    fetch("/api/merchants/me/sales")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "تعذر جلب المبيعات");
        setData(d);
        setError("");
      })
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);

  const cards = data
    ? [
        { label: "إجمالي المبيعات", value: data.summary.gross, icon: "chart", tone: "text-sky-300 bg-sky-500/10" },
        { label: `عمولة المنصة (${merchant.commission_rate}٪)`, value: data.summary.commission, icon: "percent", tone: "text-orange-300 bg-orange-500/10" },
        { label: "صافي مستحقاتك", value: data.summary.net, icon: "wallet", tone: "text-emerald-300 bg-emerald-500/10" },
        { label: "مستحق من طلبات مكتملة", value: data.summary.net_completed, icon: "check", tone: "text-lime-300 bg-lime-500/10" },
      ]
    : [];

  return (
    <div className="aph-in">
      <SectionHeader
        icon="chart"
        title="مبيعاتي"
        subtitle="عمولة المنصة تنخصم من سعر كل قطعة، والصافي هو المبلغ اللي يتحول لك"
        actions={
          <button onClick={load} className={btnGhost}>
            <Icon name="refresh" className="w-4 h-4" />
            تحديث
          </button>
        }
      />

      {error && <p className="mb-4 text-sm text-red-300">{error}</p>}
      {!data && !error && (
        <div className="py-16 flex justify-center">
          <Icon name="spinner" className="w-7 h-7 animate-spin text-orange-500" />
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {cards.map((c) => (
              <div key={c.label} className={`${panelCls} p-4`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${c.tone}`}>
                  <Icon name={c.icon} className="w-4 h-4" />
                </div>
                <p className="text-[11px] text-zinc-500 font-semibold mt-3">{c.label}</p>
                <p className="text-xl font-black text-white mt-0.5">
                  {fmt(c.value)} <span className="text-xs text-zinc-500 font-bold">ر.س</span>
                </p>
              </div>
            ))}
          </div>

          <div className={`${panelCls} overflow-hidden`}>
            {data.sales.length === 0 ? (
              <div className="p-6">
                <EmptyState icon="box" title="ما فيه مبيعات للحين" hint="أول ما يطلب عميل قطعة من قطعك بتظهر هنا." />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead>
                    <tr className="text-[11px] text-zinc-500 border-b border-white/[0.07]">
                      <th className="px-4 py-3 font-semibold">القطعة</th>
                      <th className="px-4 py-3 font-semibold">الطلب</th>
                      <th className="px-4 py-3 font-semibold">الحالة</th>
                      <th className="px-4 py-3 font-semibold">سعر البيع</th>
                      <th className="px-4 py-3 font-semibold">العمولة</th>
                      <th className="px-4 py-3 font-semibold">صافيك</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05]">
                    {data.sales.map((s) => (
                      <tr key={s.id} className={s.status === "ملغي" ? "opacity-50" : ""}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#0D1014] border border-white/[0.07] flex items-center justify-center shrink-0">
                              {s.image_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={s.image_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <Icon name="image" className="w-4 h-4 text-zinc-700" />
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-zinc-100">{s.part_name}</p>
                              <p className="text-xs text-zinc-500">الكمية: {s.quantity}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-zinc-400 whitespace-nowrap">
                          #{s.order_id}
                          <br />
                          {formatDate(s.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={s.status} />
                        </td>
                        <td className="px-4 py-3 font-bold whitespace-nowrap">{fmt(s.unit_price * s.quantity)}</td>
                        <td className="px-4 py-3 text-orange-300 whitespace-nowrap">
                          −{fmt(s.commission_amount)} <span className="text-[11px] text-zinc-500">({s.commission_rate}٪)</span>
                        </td>
                        <td className="px-4 py-3 font-black text-emerald-300 whitespace-nowrap">{fmt(s.merchant_net)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* =========================================================
   ملف المحل
   ========================================================= */
export function MerchantProfile({
  merchant,
  onUpdated,
  notify,
}: {
  merchant: Merchant;
  onUpdated: (m: Merchant) => void;
  notify: (msg: string, type?: "success" | "error" | "info") => void;
}) {
  const [form, setForm] = useState({
    store_name: merchant.store_name,
    phone: merchant.phone,
    city: merchant.city,
    address: merchant.address ?? "",
    iban: merchant.iban ?? "",
  });
  const [logo, setLogo] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [showContract, setShowContract] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      for (const [k, v] of Object.entries(form)) fd.append(k, v);
      if (logo) fd.append("logo", logo);
      const res = await fetch("/api/merchants/me", { method: "PUT", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "تعذر الحفظ");
      onUpdated(data.merchant);
      setLogo(null);
      notify("تم حفظ بيانات المحل");
    } catch (err) {
      notify(err instanceof Error ? err.message : "حدث خطأ", "error");
    } finally {
      setSaving(false);
    }
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  const facts = [
    { label: "الرقم الضريبي", value: merchant.tax_number },
    { label: "السجل التجاري", value: merchant.commercial_register },
    { label: "نسبة عمولة المنصة", value: `${merchant.commission_rate}٪` },
    { label: "الموافقة على الاتفاقية", value: `نسخة ${merchant.contract_version} — ${formatDate(merchant.contract_accepted_at)}` },
  ];

  return (
    <div className="aph-in">
      <SectionHeader icon="store" title="ملف المحل" subtitle="بيانات محلك اللي تظهر للعملاء وللإدارة" />
      <div className="grid lg:grid-cols-3 gap-6 items-start">
        <div className={`${panelCls} p-6 text-center`}>
          <div className="flex justify-center">
            <StoreAvatar merchant={merchant} size="lg" />
          </div>
          <p className="font-extrabold text-white text-lg mt-3">{merchant.store_name}</p>
          <div className="mt-2 flex justify-center">
            <MerchantStatusBadge status={merchant.status} />
          </div>
          <dl className="mt-6 space-y-3 text-right">
            {facts.map((f) => (
              <div key={f.label} className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-3.5 py-2.5">
                <dt className="text-[11px] text-zinc-500 font-semibold">{f.label}</dt>
                <dd className="text-sm font-bold text-zinc-100 mt-0.5" dir="auto">
                  {f.value}
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 flex flex-col gap-2">
            <a href={merchant.cr_document_url} target="_blank" rel="noreferrer" className={`${btnGhost} w-full`}>
              <Icon name="file" className="w-4 h-4" />
              عرض السجل التجاري المرفوع
            </a>
            <button type="button" onClick={() => setShowContract((v) => !v)} className={`${btnGhost} w-full`}>
              <Icon name="shield" className="w-4 h-4" />
              {showContract ? "إخفاء الاتفاقية" : "عرض الاتفاقية"}
            </button>
          </div>
          <p className="text-[11px] text-zinc-600 mt-3">لتعديل الرقم الضريبي أو السجل التجاري تواصل مع الإدارة.</p>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={save} className={`${panelCls} p-6 space-y-4`}>
            <h3 className="font-extrabold text-white">تعديل بيانات المحل</h3>
            <FilePicker
              label="تغيير الشعار"
              accept="image/jpeg,image/png,image/webp"
              maxMb={MAX_IMAGE_MB}
              file={logo}
              currentUrl={merchant.logo_url}
              round
              onChange={(f, err) => {
                setLogo(f);
                if (err) notify(err, "error");
              }}
            />
            <div>
              <label className={labelCls}>اسم المحل</label>
              <input className={inputCls} value={form.store_name} onChange={set("store_name")} required />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>الجوال</label>
                <input dir="ltr" className={`${inputCls} text-right`} value={form.phone} onChange={set("phone")} required />
              </div>
              <div>
                <label className={labelCls}>المدينة</label>
                <input className={inputCls} value={form.city} onChange={set("city")} required />
              </div>
            </div>
            <div>
              <label className={labelCls}>العنوان</label>
              <input className={inputCls} value={form.address} onChange={set("address")} />
            </div>
            <div>
              <label className={labelCls}>الآيبان</label>
              <input dir="ltr" className={`${inputCls} text-right tracking-wider`} value={form.iban} onChange={set("iban")} placeholder="SA..." />
            </div>
            <button type="submit" disabled={saving} className={btnPrimary}>
              {saving ? <Icon name="spinner" className="w-4 h-4 animate-spin" /> : <Icon name="check" className="w-4 h-4" strokeWidth={2.4} />}
              حفظ
            </button>
          </form>

          {showContract && (
            <div className={`${panelCls} p-6`}>
              <h3 className="font-extrabold text-white mb-4">{CONTRACT_TITLE}</h3>
              <div className="space-y-4 text-sm leading-7 text-zinc-300">
                {CONTRACT_SECTIONS.map((s) => (
                  <section key={s.title}>
                    <h4 className="font-bold text-white mb-1">{s.title}</h4>
                    <p>{s.body}</p>
                  </section>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
