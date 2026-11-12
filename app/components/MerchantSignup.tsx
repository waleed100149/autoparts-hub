"use client";

import { useState } from "react";
import { Icon, btnGhost, btnPrimary, inputCls, labelCls, panelCls } from "./ui";
import { FilePicker } from "./FilePicker";
import { MAX_DOCUMENT_MB, MAX_IMAGE_MB, type Merchant } from "./merchant-types";
import { CONTRACT_SECTIONS, CONTRACT_TITLE, CONTRACT_VERSION } from "@/lib/contract";

type SignupUser = { id: number; name: string; email: string; role: "merchant" };

const STEPS = [
  { key: "account", label: "الحساب", icon: "user" },
  { key: "store", label: "المحل", icon: "store" },
  { key: "legal", label: "السجل والضريبة", icon: "file" },
  { key: "contract", label: "الاتفاقية", icon: "shield" },
] as const;

const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp";
const DOC_ACCEPT = "image/jpeg,image/png,image/webp,application/pdf";

/** تسجيل تاجر جديد على 4 خطوات — يرسل كل شي مرة وحدة في النهاية */
export function MerchantSignup({
  onDone,
  onCancel,
}: {
  onDone: (user: SignupUser, merchant: Merchant) => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [readContract, setReadContract] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    password2: "",
    store_name: "",
    phone: "",
    city: "",
    address: "",
    tax_number: "",
    commercial_register: "",
    iban: "",
  });
  const [logo, setLogo] = useState<File | null>(null);
  const [crDoc, setCrDoc] = useState<File | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  // نفس قواعد السيرفر — عشان التاجر يعرف الخطأ قبل ما يكمل
  const validateStep = (i: number): string | null => {
    if (i === 0) {
      if (!form.name.trim() || !form.email.trim() || !form.password) return "عبّي الاسم والبريد وكلمة المرور";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return "البريد الإلكتروني غير صالح";
      if (form.password.length < 6) return "كلمة المرور 6 أحرف على الأقل";
      if (form.password !== form.password2) return "كلمتا المرور غير متطابقتين";
    }
    if (i === 1) {
      if (!form.store_name.trim() || !form.phone.trim() || !form.city.trim()) return "اسم المحل والجوال والمدينة مطلوبة";
      if (!/^(\+?966|0)?5\d{8}$/.test(form.phone.replace(/[\s-]/g, ""))) return "رقم الجوال غير صحيح (مثال: 05xxxxxxxx)";
    }
    if (i === 2) {
      if (!/^3\d{13}3$/.test(form.tax_number.replace(/\s/g, ""))) return "الرقم الضريبي 15 رقم يبدأ وينتهي بـ 3";
      if (!/^\d{10}$/.test(form.commercial_register.replace(/\s/g, ""))) return "رقم السجل التجاري 10 أرقام";
      if (!crDoc) return "ارفع صورة أو PDF للسجل التجاري";
      const iban = form.iban.replace(/\s/g, "").toUpperCase();
      if (iban && !/^SA\d{22}$/.test(iban)) return "الآيبان يبدأ بـ SA ثم 22 رقم";
    }
    if (i === 3 && !accepted) return "لازم توافق على الاتفاقية";
    return null;
  };

  const next = () => {
    const err = validateStep(step);
    if (err) return setError(err);
    setError("");
    setStep((s) => s + 1);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < STEPS.length - 1) return next();
    const err = validateStep(step);
    if (err) return setError(err);

    setLoading(true);
    setError("");
    try {
      const fd = new FormData();
      for (const [k, v] of Object.entries(form)) if (k !== "password2") fd.append(k, v);
      if (logo) fd.append("logo", logo);
      if (crDoc) fd.append("cr_document", crDoc);
      fd.append("accept_contract", "true");
      fd.append("contract_version", CONTRACT_VERSION);

      const res = await fetch("/api/merchants", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({ error: "تعذر قراءة رد الخادم" }));
      if (!res.ok) throw new Error(data.error || "تعذر إنشاء الحساب");
      onDone(data.user, data.merchant);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl aph-in">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white">التسجيل كتاجر</h2>
          <p className="text-sm text-zinc-500 mt-1.5">اعرض قطعك لآلاف العملاء. حسابك يتفعّل بعد مراجعة الإدارة لبياناتك.</p>
        </div>
        <button type="button" onClick={onCancel} className={`${btnGhost} shrink-0`}>
          رجوع
        </button>
      </div>

      {/* Stepper */}
      <ol className="grid grid-cols-4 gap-2 mb-6">
        {STEPS.map((s, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <li key={s.key}>
              <button
                type="button"
                disabled={i > step}
                onClick={() => i < step && setStep(i)}
                className={`w-full rounded-xl border px-2 py-2.5 flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold transition ${
                  active
                    ? "border-orange-500/60 bg-orange-500/10 text-orange-200"
                    : done
                    ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-300"
                    : "border-white/[0.07] text-zinc-500"
                }`}
              >
                <Icon name={done ? "check" : s.icon} className="w-4 h-4 shrink-0" strokeWidth={done ? 2.6 : 1.8} />
                {s.label}
              </button>
            </li>
          );
        })}
      </ol>

      {error && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-sm text-red-300">
          <Icon name="info" className="w-4 h-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={submit} className={`${panelCls} p-5 sm:p-7 space-y-4`}>
        {step === 0 && (
          <>
            <div>
              <label className={labelCls}>اسم صاحب المحل / المسؤول</label>
              <input className={inputCls} value={form.name} onChange={set("name")} placeholder="محمد عبدالله" autoFocus />
            </div>
            <div>
              <label className={labelCls}>البريد الإلكتروني</label>
              <input
                type="email"
                dir="ltr"
                className={`${inputCls} text-right`}
                value={form.email}
                onChange={set("email")}
                placeholder="store@example.com"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>كلمة المرور</label>
                <input type="password" className={inputCls} value={form.password} onChange={set("password")} placeholder="••••••••" />
              </div>
              <div>
                <label className={labelCls}>تأكيد كلمة المرور</label>
                <input type="password" className={inputCls} value={form.password2} onChange={set("password2")} placeholder="••••••••" />
              </div>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <FilePicker
              label="شعار / صورة المحل"
              hint={`JPG أو PNG أو WEBP — حتى ${MAX_IMAGE_MB} ميجا`}
              accept={IMAGE_ACCEPT}
              maxMb={MAX_IMAGE_MB}
              file={logo}
              round
              onChange={(f, err) => {
                setLogo(f);
                setError(err || "");
              }}
            />
            <div>
              <label className={labelCls}>اسم المحل *</label>
              <input className={inputCls} value={form.store_name} onChange={set("store_name")} placeholder="مؤسسة الخليج لقطع الغيار" />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>رقم الجوال *</label>
                <input dir="ltr" className={`${inputCls} text-right`} value={form.phone} onChange={set("phone")} placeholder="05xxxxxxxx" />
              </div>
              <div>
                <label className={labelCls}>المدينة *</label>
                <input className={inputCls} value={form.city} onChange={set("city")} placeholder="الرياض" />
              </div>
            </div>
            <div>
              <label className={labelCls}>العنوان (اختياري)</label>
              <input className={inputCls} value={form.address} onChange={set("address")} placeholder="الحي، الشارع" />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>الرقم الضريبي (15 رقم) *</label>
                <input
                  dir="ltr"
                  inputMode="numeric"
                  maxLength={15}
                  className={`${inputCls} text-right tracking-wider`}
                  value={form.tax_number}
                  onChange={set("tax_number")}
                  placeholder="3xxxxxxxxxxxxx3"
                />
              </div>
              <div>
                <label className={labelCls}>رقم السجل التجاري (10 أرقام) *</label>
                <input
                  dir="ltr"
                  inputMode="numeric"
                  maxLength={10}
                  className={`${inputCls} text-right tracking-wider`}
                  value={form.commercial_register}
                  onChange={set("commercial_register")}
                  placeholder="10xxxxxxxx"
                />
              </div>
            </div>
            <FilePicker
              label="صورة السجل التجاري"
              hint={`PDF أو صورة — حتى ${MAX_DOCUMENT_MB} ميجا`}
              accept={DOC_ACCEPT}
              maxMb={MAX_DOCUMENT_MB}
              file={crDoc}
              required
              onChange={(f, err) => {
                setCrDoc(f);
                setError(err || "");
              }}
            />
            <div>
              <label className={labelCls}>الآيبان لتحويل المستحقات (اختياري)</label>
              <input
                dir="ltr"
                className={`${inputCls} text-right tracking-wider`}
                value={form.iban}
                onChange={set("iban")}
                placeholder="SA0000000000000000000000"
              />
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-extrabold text-white text-sm">{CONTRACT_TITLE}</h3>
                <span className="text-[11px] text-zinc-500">نسخة {CONTRACT_VERSION}</span>
              </div>
              <div
                className="h-72 overflow-y-auto rounded-xl border border-white/10 bg-[#0D1014] p-4 space-y-4 text-sm leading-7 text-zinc-300"
                onScroll={(e) => {
                  const el = e.currentTarget;
                  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 24) setReadContract(true);
                }}
              >
                {CONTRACT_SECTIONS.map((s) => (
                  <section key={s.title}>
                    <h4 className="font-bold text-white mb-1">{s.title}</h4>
                    <p>{s.body}</p>
                  </section>
                ))}
              </div>
              {!readContract && <p className="text-[11px] text-zinc-500 mt-2">انزل لآخر الاتفاقية عشان تقدر توافق عليها.</p>}
            </div>
            <label
              className={`flex items-start gap-3 rounded-xl border p-3.5 transition ${
                readContract ? "cursor-pointer border-white/10 hover:border-orange-500/40" : "opacity-50 border-white/[0.06]"
              }`}
            >
              <input
                type="checkbox"
                className="mt-1 w-4 h-4 accent-orange-500"
                disabled={!readContract}
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
              />
              <span className="text-sm text-zinc-300">
                قرأت <b className="text-white">اتفاقية انضمام التاجر</b> وأوافق على جميع بنودها، بما فيها خصم عمولة المنصة من سعر كل قطعة
                تُباع، وأُقر بصحة البيانات والمستندات المرفقة.
              </span>
            </label>
          </>
        )}

        <div className="flex gap-2 pt-2">
          {step > 0 && (
            <button type="button" onClick={() => setStep((s) => s - 1)} className={`${btnGhost} h-11`}>
              السابق
            </button>
          )}
          <button type="submit" disabled={loading || (step === 3 && !accepted)} className={`${btnPrimary} flex-1`}>
            {loading ? (
              <Icon name="spinner" className="w-5 h-5 animate-spin" />
            ) : step < STEPS.length - 1 ? (
              <>
                التالي <Icon name="arrowLeft" className="w-4 h-4" strokeWidth={2.2} />
              </>
            ) : (
              <>
                <Icon name="check" className="w-4 h-4" strokeWidth={2.4} />
                أوافق على الاتفاقية وأرسل الطلب
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
