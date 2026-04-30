import { cn } from "@/lib/utils";
import { useLang } from "@/lib/i18n";

const STATUS_STYLES: Record<string, string> = {
  Reported: "bg-gray-200 text-gray-800",
  Verified: "bg-blue-100 text-blue-800",
  Assigned: "bg-orange-100 text-orange-800",
  InProgress: "bg-yellow-100 text-yellow-800",
  Resolved: "bg-green-100 text-green-800",
  Rejected: "bg-red-100 text-red-800",
};

const URGENCY_STYLES: Record<string, string> = {
  Low: "bg-green-100 text-green-800",
  Medium: "bg-yellow-100 text-yellow-800",
  High: "bg-orange-100 text-orange-800",
  Critical: "bg-red-100 text-red-800",
};

export function StatusBadge({ status }: { status: string }) {
  const { lang } = useLang();
  const translations: Record<string, { en: string; ar: string }> = {
    Reported: { en: "Reported", ar: "مُبلّغ عنه" },
    Verified: { en: "Verified", ar: "تم التحقق" },
    Assigned: { en: "Assigned", ar: "مُعيّن" },
    InProgress: { en: "In Progress", ar: "قيد التنفيذ" },
    Resolved: { en: "Resolved", ar: "تم الحل" },
    Rejected: { en: "Rejected", ar: "مرفوض" },
  };

  const label = translations[status]?.[lang] || status;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold",
        STATUS_STYLES[status] ?? "bg-gray-100 text-gray-700",
      )}
    >
      {label}
    </span>
  );
}

export function UrgencyBadge({ urgency }: { urgency: string }) {
  const { lang } = useLang();
  const translations: Record<string, { en: string; ar: string }> = {
    Low: { en: "Low", ar: "منخفضة" },
    Medium: { en: "Medium", ar: "متوسطة" },
    High: { en: "High", ar: "عالية" },
    Critical: { en: "Critical", ar: "حرجة" },
  };

  const label = translations[urgency]?.[lang] || urgency;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold",
        URGENCY_STYLES[urgency] ?? "bg-gray-100 text-gray-700",
      )}
    >
      {label}
    </span>
  );
}
