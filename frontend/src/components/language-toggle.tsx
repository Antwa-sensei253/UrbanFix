import { Languages } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguageToggle() {
  const { lang, toggle } = useI18n();
  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-secondary shadow-2xs shrink-0"
      title="Toggle language / تغيير اللغة"
      aria-label="Toggle language"
    >
      <Languages className="size-3.5 text-muted-foreground shrink-0" />
      <span className={cn(lang === "en" ? "text-primary font-bold" : "text-muted-foreground font-medium")}>EN</span>
      <span className="text-border">/</span>
      <span className={cn(lang === "ar" ? "text-primary font-bold" : "text-muted-foreground font-medium")}>AR</span>
    </button>
  );
}
