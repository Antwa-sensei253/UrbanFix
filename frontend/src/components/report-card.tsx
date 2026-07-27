import { useState, useEffect } from "react";
import { Clock, Heart, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  categoryMeta,
  formatDate,
  normalizeStatus,
  normalizeUrgency,
  slaChip,
  statusMeta,
  urgencyMeta,
} from "@/lib/reports-data";
import type { ReportResponse } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

type Tone = "muted" | "primary" | "warning" | "success" | "destructive";

export function StatusPill({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: Tone;
}) {
  const cls =
    tone === "warning"
      ? "text-warning-foreground bg-warning/15 border-warning/30"
      : tone === "success"
        ? "text-success bg-success/10 border-success/30"
        : tone === "destructive"
          ? "text-destructive bg-destructive/10 border-destructive/30"
          : tone === "muted"
            ? "text-muted-foreground bg-secondary border-border"
            : "text-primary bg-primary/10 border-primary/20";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        cls,
      )}
    >
      {children}
    </span>
  );
}

function SlaChip({ report }: { report: ReportResponse }) {
  const { lang } = useI18n();
  const chip = slaChip(report, lang);
  if (!chip) return null;
  const cls = chip.overdue
    ? "border-red-200 bg-red-50 text-red-700"
    : chip.urgent
      ? "border-orange-200 bg-orange-50 text-orange-700"
      : "border-border bg-secondary text-foreground";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-semibold",
        cls,
      )}
    >
      <Clock className="size-3" />
      {chip.text}
    </span>
  );
}

export function MyReportCard({
  report,
  onDetails,
  onUpvote,
}: {
  report: ReportResponse;
  onDetails?: (r: ReportResponse) => void;
  onUpvote?: (id: number) => void;
}) {
  const { t, lang } = useI18n();
  const cat = categoryMeta(report.category, lang);
  const s = statusMeta(normalizeStatus(report.status), lang);
  const u = urgencyMeta(normalizeUrgency(report.urgency), lang);
  const [upvoted, setUpvoted] = useState(report.has_upvoted);
  const [count, setCount] = useState(report.upvote_count);

  useEffect(() => {
    setUpvoted(report.has_upvoted);
    setCount(report.upvote_count);
  }, [report.has_upvoted, report.upvote_count]);

  function toggle() {
    setUpvoted((prev) => {
      setCount((c) => c + (prev ? -1 : 1));
      return !prev;
    });
    onUpvote?.(report.id);
  }

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-foreground/20 hover:shadow-elevated">
      <div className="relative aspect-[16/10] overflow-hidden bg-secondary">
        {report.photo_url ? (
          <img
            src={report.photo_url}
            alt={report.description.slice(0, 40)}
            loading="lazy"
            className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-4xl">
            {cat.emoji}
          </div>
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <StatusPill tone={s.tone}>{s.label}</StatusPill>
          <StatusPill tone={u.tone}>{u.label}</StatusPill>
        </div>
        <div className="absolute right-3 top-3">
          <SlaChip report={report} />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>{cat.emoji}</span>
          <span className="font-medium text-foreground">{cat.label}</span>
          <span>·</span>
          <span>{formatDate(report.created_at)}</span>
        </div>
        <h3 className="line-clamp-2 text-[15px] font-semibold leading-tight text-foreground">
          {report.description.split("\n")[0].slice(0, 80) ||
            `Report #${report.id}`}
        </h3>
        <p className="line-clamp-1 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="size-3" />
          {report.address_description || `${report.latitude}, ${report.longitude}`}
        </p>
        <div className="mt-auto flex items-center justify-between gap-2.5 pt-3 border-t border-border/50">
          <Button
            size="sm"
            variant="outline"
            className="h-8 flex-1 text-xs font-medium"
            onClick={() => onDetails?.(report)}
          >
            {t("hub_view_details")}
          </Button>
          {onUpvote && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggle();
              }}
              aria-pressed={upvoted}
              title={upvoted ? t("hub_liked") : t("hub_like")}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-all select-none active:scale-95",
                upvoted
                  ? "border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400 shadow-2xs"
                  : "border-border bg-card text-muted-foreground hover:border-border hover:bg-secondary hover:text-foreground",
              )}
            >
              <Heart
                className={cn(
                  "size-3.5 shrink-0 transition-transform duration-200",
                  upvoted ? "fill-rose-500 text-rose-500 scale-110" : "text-muted-foreground"
                )}
                strokeWidth={2}
              />
              <span>{count}</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export function CommunityReportCard({
  report,
  onUpvote,
  onDetails,
}: {
  report: ReportResponse;
  onUpvote?: (id: number) => void;
  onDetails?: (r: ReportResponse) => void;
}) {
  const { t, lang } = useI18n();
  const cat = categoryMeta(report.category, lang);
  const s = statusMeta(normalizeStatus(report.status), lang);
  const u = urgencyMeta(normalizeUrgency(report.urgency), lang);
  const [upvoted, setUpvoted] = useState(report.has_upvoted);
  const [count, setCount] = useState(report.upvote_count);

  useEffect(() => {
    setUpvoted(report.has_upvoted);
    setCount(report.upvote_count);
  }, [report.has_upvoted, report.upvote_count]);

  function toggle() {
    setUpvoted((prev) => {
      setCount((c) => c + (prev ? -1 : 1));
      return !prev;
    });
    onUpvote?.(report.id);
  }

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-foreground/20 hover:shadow-elevated">
      <div className="relative aspect-[16/10] overflow-hidden bg-secondary">
        {report.photo_url ? (
          <img
            src={report.photo_url}
            alt={report.description.slice(0, 40)}
            loading="lazy"
            className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-4xl">
            {cat.emoji}
          </div>
        )}
        <div className="absolute left-3 top-3 flex gap-1.5">
          <StatusPill tone={s.tone}>{s.label}</StatusPill>
          <StatusPill tone={u.tone}>{u.label}</StatusPill>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>{cat.emoji}</span>
          <span className="font-medium text-foreground">{cat.label}</span>
          <span>·</span>
          <span>{formatDate(report.created_at)}</span>
        </div>
        <h3 className="line-clamp-2 text-[15px] font-semibold leading-tight text-foreground">
          {report.description.split("\n")[0].slice(0, 80) ||
            `Report #${report.id}`}
        </h3>
        <p className="line-clamp-1 text-xs text-muted-foreground">
          {report.address_description || "—"} · {t("hub_by")} {report.citizen_name}
        </p>
        <div className="mt-auto flex items-center justify-between gap-2.5 pt-3 border-t border-border/50">
          <Button
            size="sm"
            variant="outline"
            className="h-8 flex-1 text-xs font-medium"
            onClick={() => onDetails?.(report)}
          >
            {t("hub_view_details")}
          </Button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggle();
            }}
            aria-pressed={upvoted}
            title={upvoted ? t("hub_liked") : t("hub_like")}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-all select-none active:scale-95",
              upvoted
                ? "border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400 shadow-2xs"
                : "border-border bg-card text-muted-foreground hover:border-border hover:bg-secondary hover:text-foreground",
            )}
          >
            <Heart
              className={cn(
                "size-3.5 shrink-0 transition-transform duration-200",
                upvoted ? "fill-rose-500 text-rose-500 scale-110" : "text-muted-foreground"
              )}
              strokeWidth={2}
            />
            <span>{count}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
