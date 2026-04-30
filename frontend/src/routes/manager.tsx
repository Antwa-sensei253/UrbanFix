import "leaflet/dist/leaflet.css";
import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Protected } from "@/components/Protected";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { StatusBadge, UrgencyBadge } from "@/components/StatusBadge";
import { CenterSpinner } from "@/components/Spinner";
import { apiFetch, useAuth } from "@/lib/auth";
import { showApiError } from "@/components/NotificationBell";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";

const HeatmapView = React.lazy(() => import("@/components/HeatmapView"));

export const Route = createFileRoute("/manager")({
  component: () => (
    <Protected allow="DistrictManager">
      <ManagerPage />
    </Protected>
  ),
});

interface Report {
  id: number | string;
  category: string;
  urgency: string;
  status: string;
  citizen_name?: string;
  description?: string;
  address_description?: string;
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
  technician_id?: number | null;
}

interface Technician { id: number | string; full_name: string }

const URGENCY_COLOR: Record<string, string> = {
  Critical: "#dc2626", High: "#ea580c", Medium: "#eab308", Low: "#16a34a",
};

const STATUS_ORDER = ["Reported", "Verified", "Assigned", "In Progress", "Resolved", "Rejected"];
type StatusFilter = "All" | string;

function ManagerPage() {
  const { user } = useAuth();
  const t = useT();
  const [reports, setReports] = React.useState<Report[]>([]);
  const [technicians, setTechnicians] = React.useState<Technician[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("All");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("All");
  const [technicianFilter, setTechnicianFilter] = React.useState<string>("All");

  const load = React.useCallback(async () => {
    if (!user) return;
    try {
      const [data, techData] = await Promise.all([
        apiFetch("/reports", user.token),
        apiFetch("/users/technicians", user.token),
      ]);
      setReports(Array.isArray(data) ? data : (data?.reports ?? []));
      setTechnicians(Array.isArray(techData) ? techData : (techData?.technicians ?? []));
    } catch (e) {
      showApiError(e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  React.useEffect(() => {
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, [load]);

  const filtered = reports.filter(r => {
    if (statusFilter !== "All" && r.status !== statusFilter) return false;
    if (categoryFilter !== "All" && r.category !== categoryFilter) return false;
    if (technicianFilter !== "All" && String(r.technician_id) !== technicianFilter) return false;
    return true;
  });

  const uniqueCategories = Array.from(new Set(reports.map((r) => r.category)));

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-bold">{t.manager_dashboard}</h1>
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Map — left 3 columns */}
        <Card className="lg:col-span-3">
          <CardContent className="p-2">
            <div className="h-[520px] w-full overflow-hidden rounded-md">
              <React.Suspense fallback={<div className="h-full w-full animate-pulse bg-muted" />}>
                {typeof window !== "undefined" && <HeatmapView reports={reports} />}
              </React.Suspense>
            </div>
          </CardContent>
        </Card>

        {/* Reports panel — right 2 columns */}
        <Card className="lg:col-span-2 flex flex-col">
          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            {/* Filter bar */}
            <div className="flex flex-col gap-2 border-b px-3 py-2 shrink-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground w-12">{t.status}:</span>
                <div className="flex flex-wrap gap-1">
                  {(["All", ...STATUS_ORDER] as StatusFilter[]).map(s => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`rounded-full px-2 py-0.5 text-xs font-medium border transition-colors ${
                        statusFilter === s
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-muted-foreground/30 text-muted-foreground hover:border-foreground"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground w-12">{t.filters}:</span>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-7 w-32 text-xs"><SelectValue placeholder={t.category} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">{t.all_categories}</SelectItem>
                    {uniqueCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={technicianFilter} onValueChange={setTechnicianFilter}>
                  <SelectTrigger className="h-7 w-36 text-xs"><SelectValue placeholder={t.select_technician} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">{t.all_technicians}</SelectItem>
                    {technicians.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Report cards */}
            <div className="flex-1 overflow-y-auto divide-y">
              {loading ? (
                <CenterSpinner />
              ) : filtered.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">No reports.</div>
              ) : (
                filtered.map((r) => (
                  <ReportCard
                    key={r.id}
                    report={r}
                    technicians={technicians}
                    onChange={load}
                  />
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ReportCard({
  report: r,
  technicians,
  onChange,
}: {
  report: Report;
  technicians: Technician[];
  onChange: () => void;
}) {
  const { user } = useAuth();
  const langT = useT();
  const [busy, setBusy] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<string>("");

  const verify = async (is_approved: boolean, rejection_reason?: string) => {
    if (!user) return;
    setBusy(true);
    try {
      await apiFetch(`/reports/${r.id}/verify`, user.token, {
        method: "PATCH",
        body: JSON.stringify({ is_approved, ...(rejection_reason ? { rejection_reason } : {}) }),
      });
      onChange();
    } catch (e) { showApiError(e); }
    finally { setBusy(false); }
  };

  const assign = async () => {
    if (!user || !selectedId) return;
    setBusy(true);
    try {
      await apiFetch(`/reports/${r.id}/assign`, user.token, {
        method: "PATCH",
        body: JSON.stringify({ technician_id: parseInt(selectedId, 10) }),
      });
      toast.success("Report assigned!");
      onChange();
    } catch (e) { showApiError(e); }
    finally { setBusy(false); }
  };

  return (
    <div className="p-3 space-y-2 hover:bg-muted/40 transition-colors">
      {/* Row 1: category + badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-semibold text-sm">{r.category}</span>
        <UrgencyBadge urgency={r.urgency} />
        <StatusBadge status={r.status} />
        {r.citizen_name && (
          <span className="text-xs text-muted-foreground ml-auto">{r.citizen_name}</span>
        )}
      </div>

      {/* Row 2: address */}
      {r.address_description && (
        <div className="text-xs text-muted-foreground truncate">📍 {r.address_description}</div>
      )}

      {/* Row 3: actions */}
      {r.status === "Reported" && (
        <div className="flex gap-1 flex-wrap">
          <Button size="sm" disabled={busy}
            className="bg-green-600 text-white hover:bg-green-700 h-7 text-xs"
            onClick={() => verify(true)}>Approve</Button>
          <Button size="sm" disabled={busy}
            className="bg-red-600 text-white hover:bg-red-700 h-7 text-xs"
            onClick={() => {
              const reason = window.prompt("Rejection reason?");
              if (reason) verify(false, reason);
            }}>Reject</Button>
        </div>
      )}

      {r.status === "Verified" && (
        <div className="flex gap-2 items-center flex-wrap">
          {technicians.length === 0 ? (
            <span className="text-xs text-muted-foreground">No technicians in district</span>
          ) : (
            <>
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger className="h-7 w-48 text-xs">
                  <SelectValue placeholder="Select technician…" />
                </SelectTrigger>
                <SelectContent>
                  {technicians.map((tech, idx) => (
                    <SelectItem key={tech.id} value={String(tech.id)}>
                      {idx === 0 ? "🟢 " : ""}{tech.full_name}
                      <span className="ml-1 text-xs opacity-50">({(tech as any).active_tasks ?? 0} active)</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
                <Button size="sm" onClick={assign} disabled={!selectedId || busy}>
                  {busy ? langT.assigning : langT.assign}
                </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

