import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Check,
  X,
  MapPin,
  RefreshCw,
  Filter as FilterIcon,
  Loader2,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageShell } from "@/components/page-shell";
import { RequireAuth } from "@/components/require-auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import {
  URGENCY_DOT,
  URGENCY_LABEL,
  priorityKey,
  seedPos,
  timeAgo,
  type IncomingPriority,
} from "@/lib/manager-data";
import {
  api,
  type ReportResponse,
  type TechnicianResponse,
} from "@/lib/api";
import { normalizeStatus } from "@/lib/reports-data";

const HeatmapView = React.lazy(() => import("@/components/HeatmapView"));

export const Route = createFileRoute("/manager")({
  component: () => (
    <RequireAuth roles={["DistrictManager"]}>
      <ManagerWorkspace />
    </RequireAuth>
  ),
});

type WorkflowStatus = "reported" | "verified" | "assigned" | "rejected";

function workflowStatus(s: string): WorkflowStatus {
  const n = normalizeStatus(s);
  if (n === "verified") return "verified";
  if (n === "assigned" || n === "in_progress" || n === "resolved") return "assigned";
  if (n === "rejected") return "rejected";
  return "reported";
}

const STATUS_FILTERS: { id: "all" | WorkflowStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "reported", label: "Reported" },
  { id: "verified", label: "Verified" },
  { id: "assigned", label: "Assigned" },
  { id: "rejected", label: "Rejected" },
];

function ManagerWorkspace() {
  const qc = useQueryClient();
  const reportsQuery = useQuery({
    queryKey: ["reports", "manager"],
    queryFn: () => api.reports.all(),
    refetchInterval: 15_000,
  });
  const techsQuery = useQuery({
    queryKey: ["technicians"],
    queryFn: () => api.users.technicians(),
  });

  const [statusFilter, setStatusFilter] = useState<"all" | WorkflowStatus>("all");
  const [catFilter, setCatFilter] = useState<string>("all");
  const [techFilter, setTechFilter] = useState<string>("all");
  const [rejectTarget, setRejectTarget] = useState<ReportResponse | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [techSelections, setTechSelections] = useState<Record<number, string>>({});
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    if (reportsQuery.dataUpdatedAt) setLastRefresh(new Date(reportsQuery.dataUpdatedAt));
  }, [reportsQuery.dataUpdatedAt]);

  const verifyMut = useMutation({
    mutationFn: (vars: {
      id: number;
      is_approved: boolean;
      rejection_reason?: string;
    }) =>
      api.reports.verify(vars.id, {
        is_approved: vars.is_approved,
        rejection_reason: vars.rejection_reason,
      }),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["reports"] });
      toast.success(v.is_approved ? "Report approved" : "Report rejected", {
        description: `#${v.id}`,
      });
    },
    onError: (e) => toast.error("Action failed", { description: (e as Error).message }),
  });

  const assignMut = useMutation({
    mutationFn: (vars: { id: number; technician_id: number }) =>
      api.reports.assign(vars.id, { technician_id: vars.technician_id }),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Assigned", { description: `#${v.id}` });
    },
    onError: (e) => toast.error("Assign failed", { description: (e as Error).message }),
  });

  const reports = reportsQuery.data ?? [];
  const technicians = techsQuery.data ?? [];

  const categories = useMemo(
    () => Array.from(new Set(reports.map((r) => r.category))),
    [reports],
  );

  const filtered = useMemo(() => {
    return reports.filter((r) => {
      const ws = workflowStatus(r.status);
      if (statusFilter !== "all" && ws !== statusFilter) return false;
      if (catFilter !== "all" && r.category !== catFilter) return false;
      if (techFilter !== "all") {
        if (techFilter === "unassigned" && r.technician_id) return false;
        if (techFilter !== "unassigned" && String(r.technician_id) !== techFilter)
          return false;
      }
      return true;
    });
  }, [reports, statusFilter, catFilter, techFilter]);

  const unassignedVerified = reports.filter(
    (r) => workflowStatus(r.status) === "verified" && !r.technician_id,
  ).length;

  const confirmReject = () => {
    if (!rejectTarget) return;
    if (rejectReason.trim().length < 4) {
      toast.error("Please provide a rejection reason.");
      return;
    }
    verifyMut.mutate({
      id: rejectTarget.id,
      is_approved: false,
      rejection_reason: rejectReason.trim(),
    });
    setRejectTarget(null);
    setRejectReason("");
  };

  return (
    <AppShell title="District Manager Workspace" role="manager">
      <Toaster richColors position="top-right" />

      <PageShell size="full" className="py-4 sm:py-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>Triage incoming reports, verify, and assign to the right technician.</span>
          <span className="inline-flex items-center gap-1.5">
            <RefreshCw className="size-3" />
            Auto-refresh · last updated {lastRefresh.toLocaleTimeString()}
          </span>
        </div>

        <div className="grid gap-4 lg:grid-cols-5">
          {/* Heatmap */}
          <section className="lg:col-span-3">
            <div className="rounded-xl border border-border bg-card">
              <header className="flex items-center justify-between border-b border-border px-4 py-3">
                <div>
                  <h2 className="text-sm font-semibold tracking-tight text-foreground">
                    District heatmap
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {filtered.length} report{filtered.length === 1 ? "" : "s"} in view
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  {(["urgent", "high", "medium", "low"] as IncomingPriority[]).map((p) => (
                    <span key={p} className="inline-flex items-center gap-1.5">
                      <span className={cn("size-2 rounded-full", URGENCY_DOT[p].split(" ")[0])} />
                      {URGENCY_LABEL[p]}
                    </span>
                  ))}
                </div>
              </header>
              <div className="relative w-full overflow-hidden rounded-b-xl">
                <React.Suspense fallback={<div className="h-[600px] w-full animate-pulse bg-muted rounded-b-xl" />}>
                  <HeatmapView reports={filtered} />
                </React.Suspense>
              </div>
            </div>
          </section>

          {/* Panel */}
          <section className="flex min-h-0 flex-col lg:col-span-2">
            <div className="flex flex-col rounded-xl border border-border bg-card">
              <div className="space-y-3 border-b border-border px-4 py-3">
                <div className="flex flex-wrap gap-1.5">
                  {STATUS_FILTERS.map((f) => {
                    const active = statusFilter === f.id;
                    return (
                      <button
                        key={f.id}
                        onClick={() => setStatusFilter(f.id)}
                        className={cn(
                          "inline-flex h-7 items-center rounded-full border px-2.5 text-xs font-medium transition-colors",
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground",
                        )}
                      >
                        {f.label}
                      </button>
                    );
                  })}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Select value={catFilter} onValueChange={setCatFilter}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={techFilter} onValueChange={setTechFilter}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Technician" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All technicians</SelectItem>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {technicians.map((t) => (
                        <SelectItem key={t.id} value={String(t.id)}>
                          {t.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {unassignedVerified > 5 && (
                <div className="flex items-start gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-900">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                  <div>
                    <strong className="font-semibold">{unassignedVerified} verified reports</strong>{" "}
                    are still unassigned. Assign technicians to keep SLA on track.
                  </div>
                </div>
              )}

              <div className="max-h-[calc(100vh-280px)] divide-y divide-border overflow-y-auto">
                {reportsQuery.isLoading && (
                  <div className="flex items-center justify-center px-6 py-12">
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  </div>
                )}
                {reportsQuery.error && (
                  <div className="px-6 py-6 text-center text-xs text-red-600">
                    {(reportsQuery.error as Error).message}
                  </div>
                )}
                {!reportsQuery.isLoading && filtered.length === 0 && (
                  <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
                    <FilterIcon className="size-5 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">No reports match</p>
                    <p className="text-xs text-muted-foreground">Try clearing your filters.</p>
                  </div>
                )}
                {filtered.map((r) => (
                  <ReportItem
                    key={r.id}
                    report={r}
                    technicians={technicians}
                    selectedTechId={techSelections[r.id]}
                    busy={verifyMut.isPending || assignMut.isPending}
                    onTechChange={(v) =>
                      setTechSelections((s) => ({ ...s, [r.id]: v }))
                    }
                    onApprove={() =>
                      verifyMut.mutate({ id: r.id, is_approved: true })
                    }
                    onReject={() => {
                      setRejectTarget(r);
                      setRejectReason("");
                    }}
                    onAssign={() => {
                      const techId = techSelections[r.id];
                      if (!techId) {
                        toast.error("Pick a technician first.");
                        return;
                      }
                      assignMut.mutate({ id: r.id, technician_id: Number(techId) });
                    }}
                  />
                ))}
              </div>
            </div>
          </section>
        </div>
      </PageShell>

      <Dialog
        open={!!rejectTarget}
        onOpenChange={(o) => {
          if (!o) {
            setRejectTarget(null);
            setRejectReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject report #{rejectTarget?.id}</DialogTitle>
            <DialogDescription>
              Tell the citizen why this report can't be actioned. They'll be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-reason" className="text-xs font-semibold">
              Rejection reason
            </Label>
            <Textarea
              id="reject-reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Out of jurisdiction — forwarded to county roads dept."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmReject}>
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function ReportItem({
  report,
  technicians,
  selectedTechId,
  busy,
  onTechChange,
  onApprove,
  onReject,
  onAssign,
}: {
  report: ReportResponse;
  technicians: TechnicianResponse[];
  selectedTechId?: string;
  busy: boolean;
  onTechChange: (v: string) => void;
  onApprove: () => void;
  onReject: () => void;
  onAssign: () => void;
}) {
  const ws = workflowStatus(report.status);
  const pk = priorityKey(report.urgency);
  return (
    <article className="px-4 py-3.5 transition-colors hover:bg-secondary/40">
      <div className="flex items-start gap-2.5">
        <span className={cn("mt-1.5 size-2 shrink-0 rounded-full ring-4", URGENCY_DOT[pk])} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate text-sm font-semibold text-foreground">
              {report.description.split("\n")[0].slice(0, 60) ||
                `Report #${report.id}`}
            </p>
            <span className="shrink-0 text-[10px] font-mono text-muted-foreground">
              #{report.id}
            </span>
          </div>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="size-3" />
            <span className="truncate">
              {report.address_description ||
                `${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}`}
            </span>
            <span>·</span>
            <span>{timeAgo(report.created_at)}</span>
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center rounded-md border border-border bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-foreground">
              {report.category}
            </span>
            <StatusBadge status={ws} />
            {report.technician_name && (
              <span className="text-[10px] text-muted-foreground">
                → {report.technician_name}
              </span>
            )}
          </div>

          {ws === "rejected" && report.rejection_reason && (
            <p className="mt-2 rounded-md border border-red-200 bg-red-50 px-2 py-1.5 text-[11px] text-red-800">
              <span className="font-semibold">Rejected:</span> {report.rejection_reason}
            </p>
          )}

          {ws === "reported" && (
            <div className="mt-2.5 flex gap-2">
              <Button
                size="sm"
                disabled={busy}
                className="h-7 bg-emerald-600 text-white hover:bg-emerald-700"
                onClick={onApprove}
              >
                <Check className="size-3.5" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                className="h-7 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-700"
                onClick={onReject}
              >
                <X className="size-3.5" />
                Reject
              </Button>
            </div>
          )}

          {ws === "verified" && (
            <div className="mt-2.5 flex gap-2">
              <Select value={selectedTechId} onValueChange={onTechChange}>
                <SelectTrigger className="h-7 flex-1 text-xs">
                  <SelectValue placeholder="Assign technician..." />
                </SelectTrigger>
                <SelectContent>
                  {technicians.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      <span className="flex items-center gap-1.5">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        {t.full_name}
                        <span className="text-muted-foreground">
                          ({t.active_assignments} active)
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" className="h-7" onClick={onAssign} disabled={busy}>
                Assign
              </Button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function StatusBadge({ status }: { status: WorkflowStatus }) {
  const map: Record<WorkflowStatus, string> = {
    reported: "border-blue-200 bg-blue-50 text-blue-700",
    verified: "border-violet-200 bg-violet-50 text-violet-700",
    assigned: "border-emerald-200 bg-emerald-50 text-emerald-700",
    rejected: "border-red-200 bg-red-50 text-red-700",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold capitalize",
        map[status],
      )}
    >
      {status}
    </span>
  );
}
