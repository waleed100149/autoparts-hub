export type MerchantStatus = "pending" | "approved" | "rejected" | "suspended";

export interface Merchant {
  user_id: number;
  store_name: string;
  logo_url: string | null;
  phone: string;
  city: string;
  address: string | null;
  tax_number: string;
  commercial_register: string;
  cr_document_url: string;
  iban: string | null;
  commission_rate: number;
  status: MerchantStatus;
  admin_note: string | null;
  contract_version: string;
  contract_accepted_at: string;
  reviewed_at: string | null;
  created_at: string;
}

/** صف التاجر في لوحة الإدارة */
export interface AdminMerchant extends Merchant {
  owner_name: string;
  email: string;
  parts_count: number;
  sales_total: number;
  commission_total: number;
  net_total: number;
}

export const MERCHANT_STATUS_META: Record<MerchantStatus, { label: string; cls: string }> = {
  pending: { label: "قيد المراجعة", cls: "bg-amber-500/10 text-amber-300 border-amber-500/30" },
  approved: { label: "معتمد", cls: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30" },
  rejected: { label: "مرفوض", cls: "bg-red-500/10 text-red-300 border-red-500/30" },
  suspended: { label: "موقوف", cls: "bg-zinc-500/10 text-zinc-300 border-zinc-500/30" },
};

// نفس حدود السيرفر (lib/storage.ts) — نتحقق قبل الرفع عشان رسالة أوضح
export const MAX_IMAGE_MB = 1.5;
export const MAX_DOCUMENT_MB = 2.5;

/** يحسب العمولة وصافي التاجر لسعر معيّن (للعرض فقط — السيرفر هو اللي يحسب الفعلي) */
export function previewCommission(price: number, rate: number) {
  const commission = Math.round(price * rate) / 100;
  return { commission, net: Math.round((price - commission) * 100) / 100 };
}
