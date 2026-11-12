"use client";

import { useState } from "react";
import { EmptyState, Icon, SectionHeader, btnGhost, fmt, formatDate, inputCls, panelCls } from "./ui";
import { MERCHANT_STATUS_META, type AdminMerchant, type MerchantStatus } from "./merchant-types";
import { MerchantStatusBadge, StoreAvatar } from "./MerchantPanels";

type Filter = "all" | MerchantStatus;

/** لوحة الإدارة: مراجعة طلبات التجار واعتمادهم وتحديد نسبة العمولة لكل تاجر */
export function AdminMerchants({
  merchants,
  reload,
  notify,
}: {
  merchants: AdminMerchant[];
  reload: () => void;
  notify: (msg: string, type?: "success" | "error" | "info") => void;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [rates, setRates] = useState<Record<number, string>>({});
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState<number | null>(null);

  const update = async (id: number, body: Record<string, unknown>, okMsg: string) => {
    setBusy(id);
    try {
      const res = await fetch(`/api/merchants/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "تعذر التحديث");
      notify(okMsg);
      // نرجع للقيم المحفوظة بعد التحديث
      const without = (o: Record<number, string>) => {
        const copy = { ...o };
        delete copy[id];
        return copy;
      };
      setRates(without);
      setNotes(without);
      reload();
    } catch (err) {
      notify(err instanceof Error ? err.message : "حدث خطأ", "error");
    } finally {
      setBusy(null);
    }
  };

  const counts = merchants.reduce<Record<string, number>>((acc, m) => {
    acc[m.status] = (acc[m.status] ?? 0) + 1;
    return acc;
  }, {});
  const visible = filter === "all" ? merchants : merchants.filter((m) => m.status === filter);
  const totalCommission = merchants.reduce((s, m) => s + m.commission_total, 0);

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: `الكل (${merchants.length})` },
    ...(Object.keys(MERCHANT_STATUS_META) as MerchantStatus[]).map((k) => ({
      key: k,
      label: `${MERCHANT_STATUS_META[k].label} (${counts[k] ?? 0})`,
    })),
  ];

  return (
    <div className="aph-in">
      <SectionHeader
        icon="store"
        title="التجار"
        subtitle={`إجمالي عمولة المنصة من التجار: ${fmt(totalCommission)} ر.س`}
        actions={
          <button onClick={reload} className={btnGhost}>
            <Icon name="refresh" className="w-4 h-4" />
            تحديث
          </button>
        }
      />

      <div className="aph-scroll flex gap-2 overflow-x-auto mb-5">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`shrink-0 h-9 px-3.5 rounded-lg text-xs font-bold border transition ${
              filter === f.key ? "bg-white text-zinc-900 border-white" : "border-white/10 text-zinc-400 hover:text-white"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState icon="store" title="ما فيه تجار هنا" hint="طلبات التسجيل الجديدة تظهر في «قيد المراجعة»." />
      ) : (
        <div className="space-y-4">
          {visible.map((m) => {
            const rate = rates[m.user_id] ?? String(m.commission_rate);
            const note = notes[m.user_id] ?? m.admin_note ?? "";
            const rateChanged = rate !== String(m.commission_rate);
            const noteChanged = note !== (m.admin_note ?? "");
            return (
              <article key={m.user_id} className={`${panelCls} p-5`}>
                <div className="flex flex-wrap items-start gap-4">
                  <StoreAvatar merchant={m} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-extrabold text-white text-lg">{m.store_name}</h3>
                      <MerchantStatusBadge status={m.status} />
                    </div>
                    <p className="text-xs text-zinc-500 mt-1">
                      {m.owner_name} · <span dir="ltr">{m.email}</span> · <span dir="ltr">{m.phone}</span> · {m.city}
                    </p>
                    <p className="text-[11px] text-zinc-600 mt-1">
                      سجّل في {formatDate(m.created_at)} · وافق على الاتفاقية نسخة {m.contract_version}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4 text-sm">
                  {[
                    { l: "الرقم الضريبي", v: m.tax_number },
                    { l: "السجل التجاري", v: m.commercial_register },
                    { l: "الآيبان", v: m.iban || "—" },
                    { l: "العنوان", v: m.address || "—" },
                  ].map((f) => (
                    <div key={f.l} className="rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2 min-w-0">
                      <p className="text-[10px] text-zinc-500 font-semibold">{f.l}</p>
                      <p className="font-bold text-zinc-200 truncate" dir="auto" title={f.v}>
                        {f.v}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-sm">
                  {[
                    { l: "عدد القطع", v: fmt(m.parts_count) },
                    { l: "المبيعات", v: `${fmt(m.sales_total)} ر.س` },
                    { l: "عمولة المنصة", v: `${fmt(m.commission_total)} ر.س` },
                    { l: "صافي التاجر", v: `${fmt(m.net_total)} ر.س` },
                  ].map((f) => (
                    <div key={f.l} className="rounded-lg bg-white/[0.02] px-3 py-2">
                      <p className="text-[10px] text-zinc-500 font-semibold">{f.l}</p>
                      <p className="font-black text-white">{f.v}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid md:grid-cols-[auto_1fr] gap-3 items-end">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1">نسبة العمولة ٪</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        className={`${inputCls} w-24 h-10`}
                        value={rate}
                        onChange={(e) => setRates({ ...rates, [m.user_id]: e.target.value })}
                      />
                      <button
                        disabled={!rateChanged || busy === m.user_id}
                        onClick={() => update(m.user_id, { commission_rate: rate }, "تم تحديث نسبة العمولة")}
                        className={`${btnGhost} disabled:opacity-40`}
                      >
                        حفظ
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1">ملاحظة للتاجر (تظهر له)</label>
                    <div className="flex gap-2">
                      <input
                        className={`${inputCls} h-10`}
                        value={note}
                        placeholder="مثال: السجل التجاري منتهي، ارفع نسخة محدثة"
                        onChange={(e) => setNotes({ ...notes, [m.user_id]: e.target.value })}
                      />
                      <button
                        disabled={!noteChanged || busy === m.user_id}
                        onClick={() => update(m.user_id, { admin_note: note }, "تم حفظ الملاحظة")}
                        className={`${btnGhost} disabled:opacity-40`}
                      >
                        حفظ
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/[0.06] flex flex-wrap gap-2">
                  <a href={m.cr_document_url} target="_blank" rel="noreferrer" className={btnGhost}>
                    <Icon name="file" className="w-4 h-4" />
                    السجل التجاري
                  </a>
                  <div className="flex-1" />
                  {m.status !== "approved" && (
                    <button
                      disabled={busy === m.user_id}
                      onClick={() => update(m.user_id, { status: "approved" }, `تم اعتماد ${m.store_name}`)}
                      className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold transition disabled:opacity-50"
                    >
                      <Icon name="check" className="w-4 h-4" strokeWidth={2.4} />
                      {m.status === "pending" ? "اعتماد" : "إعادة تفعيل"}
                    </button>
                  )}
                  {m.status === "pending" && (
                    <button
                      disabled={busy === m.user_id}
                      onClick={() => update(m.user_id, { status: "rejected" }, "تم رفض الطلب")}
                      className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-red-500/30 text-red-300 hover:bg-red-500/10 text-sm font-bold transition disabled:opacity-50"
                    >
                      <Icon name="x" className="w-4 h-4" />
                      رفض
                    </button>
                  )}
                  {m.status === "approved" && (
                    <button
                      disabled={busy === m.user_id}
                      onClick={() => {
                        if (confirm(`إيقاف ${m.store_name}؟ قطعه بتختفي من المتجر.`)) {
                          update(m.user_id, { status: "suspended" }, "تم إيقاف التاجر");
                        }
                      }}
                      className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-white/10 text-zinc-300 hover:bg-white/[0.06] text-sm font-bold transition disabled:opacity-50"
                    >
                      <Icon name="ban" className="w-4 h-4" />
                      إيقاف
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
