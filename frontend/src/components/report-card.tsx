import { useState } from "react";
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
  const chip = slaChip(report);
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
}: {
  report: ReportResponse;
  onDetails: (r: ReportResponse) => void;
}) {
  const cat = categoryMeta(report.category);
  const s = statusMeta(normalizeStatus(report.status));
  const u = urgencyMeta(normalizeUrgency(report.urgency));
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
        <div className="mt-auto pt-2">
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={() => onDetails(report)}
          >
            View details
          </Button>
        </div>
      </div>
    </article>
  );
}

export function CommunityReportCard({
  report,
  onUpvote,
}: {
  report: ReportResponse;
  onUpvote?: (id: number) => void;
}) {
  const cat = categoryMeta(report.category);
  const s = statusMeta(normalizeStatus(report.status));
  const u = urgencyMeta(normalizeUrgency(report.urgency));
  const [upvoted, setUpvoted] = useState(report.has_upvoted);
  const [count, setCount] = useState(report.upvote_count);

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
          {report.address_description || "—"} · by {report.citizen_name}
        </p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-xs text-muted-foreground">{count} upvotes</span>
          <button
            type="button"
            onClick={toggle}
            aria-pressed={upvoted}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all active:scale-95",
              upvoted
                ? "border-destructive/30 bg-destructive/10 text-destructive"
                : "border-border bg-card text-foreground hover:bg-secondary",
            )}
          >
            <Heart
              className={cn("size-3.5", upvoted && "fill-destructive")}
              strokeWidth={2}
            />
            {upvoted ? "Upvoted" : "Upvote"}
          </button>
        </div>
      </div>
    </article>
  );
}
