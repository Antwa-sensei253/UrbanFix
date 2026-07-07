import * as React from "react";
import { CalendarClock, MapPin } from "lucide-react";
const MapPreview = React.lazy(() => import("@/components/MapPreview"));
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusPill } from "@/components/report-card";
import {
  categoryMeta,
  formatDate,
  formatDeadline,
  normalizeStatus,
  normalizeUrgency,
  slaDeadline,
  statusMeta,
  urgencyMeta,
} from "@/lib/reports-data";
import type { ReportResponse } from "@/lib/api";

export function ReportDetailsDialog({
  report,
  open,
  onOpenChange,
}: {
  report: ReportResponse | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  if (!report) return null;
  const cat = categoryMeta(report.category);
  const status = normalizeStatus(report.status);
  const s = statusMeta(status);
  const u = urgencyMeta(normalizeUrgency(report.urgency));
  const deadline = slaDeadline(report.created_at, report.category);
  const overdue =
    deadline.getTime() < Date.now() && status !== "resolved" && status !== "rejected";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto bg-card p-0 sm:max-w-xl">
        <div className="relative aspect-[16/9] overflow-hidden bg-secondary">
          {report.photo_url ? (
            <img
              src={report.photo_url}
              alt={report.description.slice(0, 40)}
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-6xl">
              {cat.emoji}
            </div>
          )}
          <div className="absolute left-4 top-4 flex gap-1.5">
            <StatusPill tone={s.tone}>{s.label}</StatusPill>
            <StatusPill tone={u.tone}>{u.label}</StatusPill>
          </div>
        </div>
        <div className="space-y-5 p-6">
          <DialogHeader className="space-y-1 text-left">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>{cat.emoji}</span>
              <span className="font-medium text-foreground">{cat.label}</span>
              <span>·</span>
              <span>#{report.id}</span>
            </div>
            <DialogTitle className="text-xl font-semibold tracking-tight">
              {report.description.split("\n")[0].slice(0, 90) ||
                `Report #${report.id}`}
            </DialogTitle>
          </DialogHeader>

          <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/85">
            {report.description}
          </p>

          <div className="rounded-lg border border-border bg-canvas p-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="size-3" />
              {report.address_description ||
                `${report.latitude.toFixed(5)}, ${report.longitude.toFixed(5)}`}
            </p>
            {report.latitude != null && report.longitude != null && (
              <React.Suspense fallback={<div className="h-48 w-full animate-pulse bg-muted rounded-md" />}>
                <MapPreview lat={report.latitude} lng={report.longitude} height="h-48" />
              </React.Suspense>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <InfoTile label="Reported">
              <span className="text-sm font-medium text-foreground">
                {formatDate(report.created_at)}
              </span>
            </InfoTile>
            <InfoTile label="SLA deadline">
              <span
                className={`inline-flex items-center gap-1 text-sm font-medium ${
                  overdue ? "text-destructive" : "text-foreground"
                }`}
              >
                <CalendarClock className="size-3.5" />
                {formatDeadline(deadline)}
              </span>
              <span className="block text-[11px] text-muted-foreground">
                {cat.slaHours}h response window
              </span>
            </InfoTile>
          </div>

          {report.rejection_reason && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <p className="font-semibold">Rejected</p>
              <p className="mt-1 text-xs">{report.rejection_reason}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InfoTile({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-canvas p-3">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      {children}
    </div>
  );
}
