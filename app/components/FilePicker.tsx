"use client";

import { useEffect, useMemo } from "react";
import { Icon } from "./ui";

/** اختيار ملف مع معاينة للصور والتحقق من النوع والحجم قبل الرفع */
export function FilePicker({
  label,
  hint,
  accept,
  maxMb,
  file,
  onChange,
  required,
  currentUrl,
  round,
}: {
  label: string;
  hint?: string;
  accept: string;
  maxMb: number;
  file: File | null;
  onChange: (f: File | null, error?: string) => void;
  required?: boolean;
  currentUrl?: string | null;
  round?: boolean;
}) {
  const preview = useMemo(() => (file && file.type.startsWith("image/") ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const shown = preview || (!file ? currentUrl : null);
  const isPdf = file?.type === "application/pdf";

  return (
    <div>
      <p className="block text-xs font-semibold text-zinc-400 mb-1.5">
        {label} {required && <span className="text-orange-400">*</span>}
      </p>
      <label className="flex items-center gap-4 rounded-xl border border-dashed border-white/15 bg-[#0D1014] p-3 cursor-pointer hover:border-orange-500/50 transition">
        <div
          className={`w-16 h-16 shrink-0 overflow-hidden bg-white/[0.04] border border-white/10 flex items-center justify-center ${
            round ? "rounded-full" : "rounded-lg"
          }`}
        >
          {shown ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shown} alt="" className="w-full h-full object-cover" />
          ) : (
            <Icon name={isPdf ? "file" : "upload"} className="w-6 h-6 text-zinc-500" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-zinc-200 truncate">{file ? file.name : "اختر ملف من جهازك"}</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            {file ? `${(file.size / 1024 / 1024).toFixed(2)} ميجا` : hint || `الحد الأقصى ${maxMb} ميجا`}
          </p>
        </div>
        {file && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onChange(null);
            }}
            className="w-8 h-8 rounded-lg text-zinc-400 hover:text-red-300 hover:bg-red-500/10 flex items-center justify-center"
            title="إزالة"
          >
            <Icon name="x" className="w-4 h-4" />
          </button>
        )}
        <input
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            e.target.value = "";
            if (!f) return;
            const allowed = accept.split(",").map((t) => t.trim());
            if (!allowed.includes(f.type)) return onChange(null, "نوع الملف غير مدعوم");
            if (f.size > maxMb * 1024 * 1024) return onChange(null, `حجم الملف أكبر من ${maxMb} ميجا`);
            onChange(f);
          }}
        />
      </label>
    </div>
  );
}
