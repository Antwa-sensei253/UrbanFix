import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  MapPin,
  Clock,
  AlertTriangle,
  Inbox,
  Search,
  CheckCircle2,
  Play,
  Ban,
  Upload,
  Link2,
  ImageIcon,
  Loader2,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { RequireAuth } from "@/components/require-auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  STATUS_COLUMNS,
  PRIORITY_META,
  formatSla,
  priorityFromUrgency,
  statusFromBackend,
  type TicketStatus,
} from "@/lib/tickets-data";
import { api, type ReportResponse } from "@/lib/api";
import { categoryMeta, slaDeadline } from "@/lib/reports-data";
import { useIsMobile } from "@/hooks/use-mobile";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/technician")({
  head: () => ({
    meta: [
      { title: "Technician board — UrbanFix" },
      {
        name: "description",
        content:
          "Kanban-style board of assigned tickets with quick status actions and SLA countdowns.",
      },
    ],
  }),
  component: () => (
    <RequireAuth roles={["Technician"]}>
      <TechnicianPage />
    </RequireAuth>
  ),
});

function TechnicianPage() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const reportsQuery = useQuery({
    queryKey: ["reports", "technician"],
    queryFn: () => api.reports.all(),
  });
  const isMobile = useIsMobile();

  const [query, setQuery] = useState("");
  const [mapReport, setMapReport] = useState<ReportResponse | null>(null);
  const [resolveReport, setResolveReport] = useState<ReportResponse | null>(null);
  const [blockReport, setBlockReport] = useState<ReportResponse | null>(null);

  const statusMut = useMutation({
    mutationFn: (vars: {
      id: number;
      new_status: string;
      photo_url?: string;
    }) =>
      api.reports.updateStatus(vars.id, {
        new_status: vars.new_status,
        photo_url: vars.photo_url,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reports"] });
    },
    onError: (err) => toast.error("Status update failed", { description: (err as Error).message }),
  });

  const reports = reportsQuery.data ?? [];
  const visible = useMemo(() => {
    if (!query) return reports;
    const q = query.toLowerCase();
    return reports.filter(
      (t) =>
        t.description.toLowerCase().includes(q) ||
        String(t.id).includes(q) ||
        (t.address_description ?? "").toLowerCase().includes(q),
    );
  }, [query, reports]);

  const grouped = (col: TicketStatus) =>
    visible.filter((r) => statusFromBackend(r.status) === col);

  const open = reports.filter((r) => statusFromBackend(r.status) !== "Resolved");
  const breached = open.filter(
    (r) => slaDeadline(r.created_at, r.category).getTime() < Date.now(),
  ).length;

  return (
    <AppShell
      title={t("tech_title")}
      role="technician"
      actions={
        <div className="relative hidden sm:block">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("tech_search")}
            className="h-8 w-56 pl-8 text-sm"
          />
        </div>
      }
    >
      <Toaster richColors position="top-right" />
      <div className="flex items-center justify-between border-b border-border bg-card px-5 py-2.5">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>
            <span className="font-semibold text-foreground">{open.length}</span> {t("tech_kpi_open")}
          </span>
          <span className="text-border">·</span>
          <span>
            <span className="font-semibold text-foreground">
              {grouped("InProgress").length}
            </span>{" "}
            {t("tech_kpi_inprogress")}
          </span>
          {breached > 0 && (
            <>
              <span className="text-border">·</span>
              <span className="flex items-center gap-1 font-medium text-destructive">
                <AlertTriangle className="size-3" /> {breached} {t("tech_kpi_breached")}
              </span>
            </>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {reportsQuery.isFetching ? "Refreshing…" : "Updated just now"}
        </span>
      </div>

      {reportsQuery.isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : reportsQuery.error ? (
        <div className="m-5 rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          Couldn't load tickets: {(reportsQuery.error as Error).message}
        </div>
      ) : isMobile ? (
        <div className="p-3">
          <Accordion type="multiple" defaultValue={["Assigned", "InProgress"]}>
            {STATUS_COLUMNS.map((col) => {
              const items = grouped(col.id);
              return (
                <AccordionItem key={col.id} value={col.id} className="border-border">
                  <AccordionTrigger className="rounded-md px-3 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <span className={cn("size-2 rounded-full", col.dot)} />
                      <span className="text-sm font-semibold">{t(`tech_col_${col.id}`)}</span>
                      <span className="rounded-md border border-border bg-secondary px-1.5 text-[10.5px] font-semibold tabular-nums">
                        {items.length}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2 px-1 pb-3">
                    {items.length === 0 ? (
                      <EmptyColumn />
                    ) : (
                      items.map((r) => (
                        <TicketCard
                          key={r.id}
                          report={r}
                          busy={statusMut.isPending}
                          onViewMap={() => setMapReport(r)}
                          onStart={() =>
                            statusMut.mutate({ id: r.id, new_status: "InProgress" })
                          }
                          onResolve={() => setResolveReport(r)}
                          onBlock={() => setBlockReport(r)}
                        />
                      ))
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      ) : (
        <div className="h-full overflow-x-auto p-5">
          <div className="grid h-full min-w-[1100px] grid-cols-4 gap-4">
            {STATUS_COLUMNS.map((col) => {
              const items = grouped(col.id);
              return (
                <div
                  key={col.id}
                  className="flex min-h-0 flex-col rounded-lg border border-border bg-card"
                >
                  <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className={cn("size-2 rounded-full", col.dot)} />
                      <span className="text-[13px] font-semibold text-foreground">
                        {t(`tech_col_${col.id}`)}
                      </span>
                      <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-border bg-secondary px-1.5 text-[10.5px] font-semibold text-foreground tabular-nums">
                        {items.length}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2 overflow-y-auto p-2">
                    {items.length === 0 ? (
                      <EmptyColumn />
                    ) : (
                      items.map((r) => (
                        <TicketCard
                          key={r.id}
                          report={r}
                          busy={statusMut.isPending}
                          onViewMap={() => setMapReport(r)}
                          onStart={() =>
                            statusMut.mutate({ id: r.id, new_status: "InProgress" })
                          }
                          onResolve={() => setResolveReport(r)}
                          onBlock={() => setBlockReport(r)}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <MapDialog report={mapReport} onClose={() => setMapReport(null)} />
      <ResolveDialog
        report={resolveReport}
        onClose={() => setResolveReport(null)}
        onConfirm={(photo) => {
          if (resolveReport)
            statusMut.mutate({
              id: resolveReport.id,
              new_status: "Resolved",
              photo_url: photo,
            });
          setResolveReport(null);
        }}
      />
      <BlockDialog
        report={blockReport}
        onClose={() => setBlockReport(null)}
        onConfirm={(reason) => {
          if (blockReport)
            statusMut.mutate({
              id: blockReport.id,
              new_status: "Blocked",
              photo_url: reason, // backend may use this slot
            });
          setBlockReport(null);
        }}
      />
    </AppShell>
  );
}

function TicketCard({
  report,
  busy,
  onViewMap,
  onStart,
  onResolve,
  onBlock,
}: {
  report: ReportResponse;
  busy: boolean;
  onViewMap: () => void;
  onStart: () => void;
  onResolve: () => void;
  onBlock: () => void;
}) {
  const { t } = useI18n();
  const meta = categoryMeta(report.category);
  const status = statusFromBackend(report.status);
  const pri = priorityFromUrgency(report.urgency);
  const priMeta = PRIORITY_META[pri];
  const readonly = status === "Resolved" || status === "Blocked";
  const sla = formatSla(slaDeadline(report.created_at, report.category).toISOString(), t);

  return (
    <article className="group relative rounded-md border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <h3 className="line-clamp-1 font-semibold text-foreground">
          {meta.emoji} {t(`cat_${report.category}`)}
        </h3>
        <span
          className={cn(
            "shrink-0 rounded-full border px-2 py-0.5 text-[10.5px] font-bold tracking-wide",
            priMeta.pill,
          )}
        >
          {t(`tech_pri_${pri}`)}
        </span>
      </div>

      <p className="mt-1.5 line-clamp-2 text-[13.5px] font-semibold leading-snug text-foreground">
        {report.description.split("\n")[0].slice(0, 80) || `Report #${report.id}`}
      </p>

      <p className="mt-1.5 flex items-start gap-1 text-[11.5px] text-muted-foreground">
        <MapPin className="mt-0.5 size-3 shrink-0" />
        <span className="line-clamp-1">
          {report.address_description ||
            `${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}`}
        </span>
      </p>

      {status === "Blocked" && (
        <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10.5px] font-semibold text-amber-700">
          <AlertTriangle className="size-3" /> {t("tech_col_Blocked")}
        </div>
      )}

      {!readonly && (
        <div className="mt-2.5 flex items-center justify-between border-t border-border pt-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 text-[11px] font-medium",
              sla.breached
                ? "text-red-600"
                : sla.urgent
                  ? "text-orange-600"
                  : "text-muted-foreground",
            )}
          >
            <Clock className="size-3" />
            {sla.text}
          </span>
          <span className="font-mono text-[10.5px] text-muted-foreground">
            #{report.id}
          </span>
        </div>
      )}

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        <Button
          size="sm"
          variant="outline"
          className="h-7 gap-1 px-2 text-[11px]"
          onClick={onViewMap}
        >
          <MapPin className="size-3" /> {t("tech_view_map")}
        </Button>

        {!readonly && status === "Assigned" && (
          <Button
            size="sm"
            disabled={busy}
            className="h-7 gap-1 bg-blue-600 px-2 text-[11px] hover:bg-blue-700"
            onClick={onStart}
          >
            <Play className="size-3" /> {t("tech_start_work")}
          </Button>
        )}

        {!readonly && status === "InProgress" && (
          <>
            <Button
              size="sm"
              disabled={busy}
              className="h-7 gap-1 bg-emerald-600 px-2 text-[11px] hover:bg-emerald-700"
              onClick={onResolve}
            >
              <CheckCircle2 className="size-3" /> {t("tech_mark_res")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              className="h-7 gap-1 border-amber-300 bg-amber-50 px-2 text-[11px] text-amber-800 hover:bg-amber-100"
              onClick={onBlock}
            >
              <Ban className="size-3" /> {t("tech_mark_blk")}
            </Button>
          </>
        )}

        {readonly && (
          <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10.5px] font-semibold text-emerald-700">
            <CheckCircle2 className="size-3" /> {t("tech_closed")}
          </span>
        )}
      </div>

      {readonly && report.photo_url && (
        <div className="mt-2 overflow-hidden rounded border border-border">
          <img
            src={report.photo_url}
            alt="Closure"
            className="aspect-video w-full object-cover"
          />
        </div>
      )}
    </article>
  );
}

function EmptyColumn() {
  const { t } = useI18n();
  return (
    <div className="flex h-32 flex-col items-center justify-center rounded-md border border-dashed border-border text-center">
      <Inbox className="size-4 text-muted-foreground" />
      <p className="mt-2 text-xs text-muted-foreground">{t("tech_empty")}</p>
    </div>
  );
}

function MapDialog({
  report,
  onClose,
}: {
  report: ReportResponse | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!report} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl bg-card p-0">
        <DialogHeader className="border-b border-border px-5 py-3.5">
          <DialogTitle className="text-base">Location</DialogTitle>
          <DialogDescription>
            {report?.address_description ||
              (report
                ? `${report.latitude.toFixed(5)}, ${report.longitude.toFixed(5)}`
                : "")}
          </DialogDescription>
        </DialogHeader>
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-[radial-gradient(circle_at_top,_#EFF4FB,_#F9FAFB)]">
          <svg className="absolute inset-0 h-full w-full text-slate-200" aria-hidden>
            <defs>
              <pattern id="grid-t" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M40 0H0V40" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-t)" />
            <path d="M0 220 H800" stroke="#CBD5E1" strokeWidth="6" />
            <path d="M420 0 V500" stroke="#CBD5E1" strokeWidth="6" />
          </svg>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
            <span className="relative inline-flex">
              <span className="absolute inset-0 animate-ping rounded-full bg-red-400/40" />
              <span className="relative inline-flex size-6 items-center justify-center rounded-full border-2 border-white bg-red-500 shadow-elevated">
                <MapPin className="size-3 text-white" />
              </span>
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ResolveDialog({
  report,
  onClose,
  onConfirm,
}: {
  report: ReportResponse | null;
  onClose: () => void;
  onConfirm: (photo: string) => void;
}) {
  const [tab, setTab] = useState<"upload" | "url">("upload");
  const [photo, setPhoto] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");

  const reset = () => {
    setPhoto("");
    setFileName("");
    setTab("upload");
  };

  return (
    <Dialog
      open={!!report}
      onOpenChange={(o) => {
        if (!o) {
          reset();
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-md bg-card">
        <DialogHeader>
          <DialogTitle>Mark as resolved</DialogTitle>
          <DialogDescription>
            Upload a closure photo showing the completed work.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "upload" | "url")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" className="gap-1.5">
              <Upload className="size-3.5" /> Upload file
            </TabsTrigger>
            <TabsTrigger value="url" className="gap-1.5">
              <Link2 className="size-3.5" /> Paste URL
            </TabsTrigger>
          </TabsList>
          <TabsContent value="upload" className="mt-3">
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-border bg-secondary/40 px-4 py-8 text-center transition-colors hover:border-foreground/30 hover:bg-secondary">
              <ImageIcon className="size-5 text-muted-foreground" />
              <span className="mt-2 text-sm font-medium text-foreground">
                {fileName || "Choose a photo"}
              </span>
              <span className="mt-0.5 text-xs text-muted-foreground">
                PNG or JPG, up to 10MB
              </span>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setFileName(f.name);
                    setPhoto(URL.createObjectURL(f));
                  }
                }}
              />
            </label>
          </TabsContent>
          <TabsContent value="url" className="mt-3 space-y-2">
            <Label htmlFor="closure-url" className="text-xs">
              Image URL
            </Label>
            <Input
              id="closure-url"
              placeholder="https://…"
              value={tab === "url" ? photo : ""}
              onChange={(e) => setPhoto(e.target.value)}
            />
          </TabsContent>
        </Tabs>

        {photo && (
          <div className="overflow-hidden rounded-md border border-border">
            <img src={photo} alt="Closure" className="aspect-video w-full object-cover" />
          </div>
        )}

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => {
              reset();
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button
            disabled={!photo}
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={() => {
              onConfirm(photo);
              reset();
            }}
          >
            Confirm resolved
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BlockDialog({
  report,
  onClose,
  onConfirm,
}: {
  report: ReportResponse | null;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  return (
    <Dialog
      open={!!report}
      onOpenChange={(o) => {
        if (!o) {
          setReason("");
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-md bg-card">
        <DialogHeader>
          <DialogTitle>Mark as blocked</DialogTitle>
          <DialogDescription>
            Tell your manager what's holding this ticket up.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Awaiting paving crew assignment from Ops."
        />
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={reason.trim().length < 4}
            className="bg-amber-500 hover:bg-amber-600"
            onClick={() => {
              onConfirm(reason.trim());
              setReason("");
            }}
          >
            Mark blocked
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
