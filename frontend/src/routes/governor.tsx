import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { useEffect, useMemo, useState, Suspense } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Plus,
  Trash2,
  Wrench,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  MapPin,
  Pencil,
  SlidersHorizontal,
  LocateFixed,
  Globe,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import { AppShell } from "@/components/app-shell";
import { RequireAuth } from "@/components/require-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  formatCompact,
  RANGE_LABELS,
  RANGE_DAYS,
  type RangeKey,
} from "@/lib/governor-data";
import {
  ROLE_OPTIONS,
  PRIORITY_OPTIONS,
  type UserRole,
  type PriorityOption,
} from "@/lib/governor-admin-data";
import {
  api,
  type CategoryData,
  type DistrictData,
  type ReportResponse,
  type UserManagementResponse,
} from "@/lib/api";
import { normalizeStatus, normalizeUrgency } from "@/lib/reports-data";

import { useI18n } from "@/lib/i18n";

const DistrictBoundaryMap = React.lazy(() => import("@/components/DistrictBoundaryMap"));

export const Route = createFileRoute("/governor")({
  head: () => ({
    meta: [
      { title: "Governor — UrbanFix" },
      {
        name: "description",
        content:
          "Citywide overview, all reports, heatmap, and administration of users, districts, and categories.",
      },
    ],
  }),
  component: () => (
    <RequireAuth roles={["Governor"]}>
      <GovernorPage />
    </RequireAuth>
  ),
});

function GovernorPage() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const reportsQuery = useQuery({
    queryKey: ["reports", "all"],
    queryFn: () => api.reports.all(),
    refetchInterval: 30_000,
  });
  const usersQuery = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => api.admin.users(),
    refetchInterval: 30_000,
  });
  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.categories.all(),
  });
  const districtsQuery = useQuery({
    queryKey: ["districts"],
    queryFn: () => api.auth.districts(),
  });
  const summaryQuery = useQuery({
    queryKey: ["analytics", "summary"],
    queryFn: () => api.analytics.summary(),
    refetchInterval: 30_000,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["reports", "all"] });
    qc.invalidateQueries({ queryKey: ["admin", "users"] });
    qc.invalidateQueries({ queryKey: ["analytics", "summary"] });
  };

  return (
    <AppShell
      title={t("gov_title")}
      role="governor"
      actions={
        <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={refresh}>
          <RefreshCw className="size-3.5" /> {t("gov_refresh")}
        </Button>
      }
    >
      <Toaster richColors position="top-right" />
      <div className="mx-auto max-w-7xl p-6">
        <Tabs defaultValue="overview">
          <TabsList className="mb-6 h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
            {[
              { v: "overview", label: t("gov_tab_overview") },
              { v: "reports", label: t("gov_tab_reports") },
              { v: "users", label: t("gov_tab_users") },
              { v: "districts", label: t("gov_tab_districts") },
              { v: "categories", label: t("gov_tab_categories") },
            ].map((tab) => (
              <TabsTrigger
                key={tab.v}
                value={tab.v}
                className="rounded-md border border-transparent bg-transparent px-3 py-1.5 text-sm font-medium text-muted-foreground data-[state=active]:border-border data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-elevated"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <OverviewTab
              reports={reportsQuery.data ?? []}
              loading={reportsQuery.isLoading || summaryQuery.isLoading}
              summary={summaryQuery.data}
            />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsTab
              reports={reportsQuery.data ?? []}
              loading={reportsQuery.isLoading}
              error={reportsQuery.error}
            />
          </TabsContent>

          <TabsContent value="users">
            <UsersTab
              users={usersQuery.data ?? []}
              districts={districtsQuery.data ?? []}
              loading={usersQuery.isLoading}
              onChange={() =>
                qc.invalidateQueries({ queryKey: ["admin", "users"] })
              }
            />
          </TabsContent>

          <TabsContent value="districts">
            <DistrictsTab
              districts={districtsQuery.data ?? []}
              onAdded={() =>
                qc.invalidateQueries({ queryKey: ["districts"] })
              }
            />
          </TabsContent>

          <TabsContent value="categories">
            <CategoriesTab
              categories={categoriesQuery.data ?? []}
              onChanged={() =>
                qc.invalidateQueries({ queryKey: ["categories"] })
              }
            />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

/* ============ OVERVIEW ============ */

function OverviewTab({
  reports,
  loading,
  summary,
}: {
  reports: ReportResponse[];
  loading: boolean;
  summary: ReturnType<typeof useQuery<unknown>>["data"];
}) {
  const { t } = useI18n();
  const [range, setRange] = useState<RangeKey>("30d");

  // Client-side filter by date range.
  const since = Date.now() - RANGE_DAYS[range] * 86_400_000;
  const filtered = reports.filter(
    (r) => new Date(r.created_at).getTime() >= since,
  );

  const total = filtered.length;
  const resolved = filtered.filter(
    (r) => normalizeStatus(r.status) === "resolved",
  ).length;
  const inProgress = filtered.filter(
    (r) => normalizeStatus(r.status) === "in_progress",
  ).length;
  const critical = filtered.filter(
    (r) => normalizeUrgency(r.urgency) === "critical",
  ).length;
  const totalOpen = total - resolved;

  const byCategoryMap = new Map<string, number>();
  filtered.forEach((r) =>
    byCategoryMap.set(r.category, (byCategoryMap.get(r.category) ?? 0) + 1),
  );
  const byCategory = Array.from(byCategoryMap.entries()).map(([name, value]) => ({
    name,
    value,
  }));

  // Critical Alerts: open + critical urgency + overdue or recent.
  const criticalAlerts = filtered
    .filter(
      (r) =>
        normalizeUrgency(r.urgency) === "critical" &&
        normalizeStatus(r.status) !== "resolved",
    )
    .slice(0, 5);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">{t("gov_overview_city")}</h2>
        <div className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-2 py-1">
          <CalendarDays className="size-3.5 text-muted-foreground" />
          <Select value={range} onValueChange={(v) => setRange(v as RangeKey)}>
            <SelectTrigger className="h-7 w-[160px] border-0 bg-transparent text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(RANGE_LABELS) as RangeKey[]).map((k) => (
                <SelectItem key={k} value={k}>
                  {RANGE_LABELS[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <Kpi label={t("gov_kpi_open")} value={formatCompact(totalOpen)} icon={FileText} tone="slate" loading={loading} />
        <Kpi label={t("gov_kpi_resolved")} value={formatCompact(resolved)} icon={CheckCircle2} tone="emerald" loading={loading} />
        <Kpi label={t("gov_kpi_progress")} value={formatCompact(inProgress)} icon={Wrench} tone="blue" loading={loading} />
        <Kpi label={t("gov_kpi_critical")} value={formatCompact(critical)} icon={AlertTriangle} tone="red" loading={loading} />
        <Kpi
          label={t("gov_kpi_avg")}
          value={`${Math.round((summary as { avg_resolution_hours?: number } | undefined)?.avg_resolution_hours ?? 0)}h`}
          icon={Clock}
          tone="indigo"
          loading={loading}
        />
      </div>

      <section className="rounded-lg border border-border bg-card p-5">
        <header className="mb-4">
          <h2 className="text-sm font-semibold text-foreground">Reports by category</h2>
          <p className="text-xs text-muted-foreground">{RANGE_LABELS[range]}</p>
        </header>
        <div className="h-72 w-full">
          {byCategory.length === 0 ? (
            <NoData />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCategory} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6B7280" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: "rgba(0,0,0,0.03)" }}
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #E5E7EB",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {byCategory.map((_, i) => (
                    <Cell key={i} fill="#4338CA" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-5">
        <header className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Critical alerts</h2>
          <span className="text-xs text-muted-foreground">{criticalAlerts.length} open</span>
        </header>
        {criticalAlerts.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground">
            No critical alerts in this range.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {criticalAlerts.map((r) => (
              <li key={r.id} className="flex items-start gap-3 py-3">
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-red-50 text-red-700">
                  <AlertTriangle className="size-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {r.description.slice(0, 80) || `Report #${r.id}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {r.category} · {r.address_description || "—"}
                  </p>
                </div>
                <span className="font-mono text-[11px] text-muted-foreground">
                  #{r.id}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function Kpi({
  label,
  value,
  icon: Icon,
  tone,
  loading,
}: {
  label: string;
  value: string;
  icon: typeof FileText;
  tone: "slate" | "emerald" | "blue" | "red" | "indigo";
  loading?: boolean;
}) {
  const toneCls: Record<typeof tone, string> = {
    slate: "bg-slate-100 text-slate-700",
    emerald: "bg-emerald-50 text-emerald-700",
    blue: "bg-blue-50 text-blue-700",
    red: "bg-red-50 text-red-700",
    indigo: "bg-indigo-50 text-indigo-700",
  };
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <span className={cn("flex size-7 items-center justify-center rounded-md", toneCls[tone])}>
          <Icon className="size-3.5" />
        </span>
      </div>
      {loading ? (
        <div className="mt-2 h-8 w-20 animate-pulse rounded bg-secondary" />
      ) : (
        <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground tabular-nums">
          {value}
        </p>
      )}
    </div>
  );
}

function NoData() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
      <FileText className="size-5 text-muted-foreground" />
      <p className="text-sm font-medium text-foreground">No data available</p>
      <p className="text-xs text-muted-foreground">Try a wider date range.</p>
    </div>
  );
}

/* ============ REPORTS ============ */

const PAGE_SIZE = 15;

function ReportsTab({
  reports,
  loading,
  error,
}: {
  reports: ReportResponse[];
  loading: boolean;
  error: unknown;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [page, setPage] = useState(0);

  const categories = useMemo(
    () => Array.from(new Set(reports.map((r) => r.category))),
    [reports],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reports.filter((r) => {
      if (status !== "all" && normalizeStatus(r.status) !== status) return false;
      if (category !== "all" && r.category !== category) return false;
      if (!q) return true;
      return (
        String(r.id).includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        (r.address_description ?? "").toLowerCase().includes(q) ||
        (r.technician_name ?? "").toLowerCase().includes(q) ||
        r.citizen_name.toLowerCase().includes(q)
      );
    });
  }, [reports, query, status, category]);

  useEffect(() => setPage(0), [query, status, category]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const slice = filtered.slice(
    safePage * PAGE_SIZE,
    safePage * PAGE_SIZE + PAGE_SIZE,
  );

  return (
    <section className="rounded-lg border border-border bg-card">
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search id, description, citizen…"
            className="h-8 w-72 pl-8 text-sm"
          />
        </div>
        <FilterSelect
          value={status}
          onChange={setStatus}
          placeholder="Status"
          options={[
            { v: "all", l: "All statuses" },
            { v: "reported", l: "Reported" },
            { v: "verified", l: "Verified" },
            { v: "assigned", l: "Assigned" },
            { v: "in_progress", l: "In progress" },
            { v: "resolved", l: "Resolved" },
            { v: "rejected", l: "Rejected" },
          ]}
        />
        <FilterSelect
          value={category}
          onChange={setCategory}
          placeholder="Category"
          options={[
            { v: "all", l: "All categories" },
            ...categories.map((c) => ({ v: c, l: c })),
          ]}
        />
        <div className="ml-auto text-xs text-muted-foreground">
          {filtered.length} of {reports.length}
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">ID</TableHead>
            <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Description</TableHead>
            <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</TableHead>
            <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Category</TableHead>
            <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Urgency</TableHead>
            <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Technician</TableHead>
            <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Citizen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={7} className="py-12 text-center">
                <Loader2 className="mx-auto size-4 animate-spin text-muted-foreground" />
              </TableCell>
            </TableRow>
          ) : error ? (
            <TableRow>
              <TableCell colSpan={7} className="py-12 text-center text-sm text-red-600">
                {(error as Error).message}
              </TableCell>
            </TableRow>
          ) : slice.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                No reports match the current filters.
              </TableCell>
            </TableRow>
          ) : (
            slice.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">#{r.id}</TableCell>
                <TableCell className="max-w-md truncate font-medium text-foreground">
                  {r.description.split("\n")[0]}
                </TableCell>
                <TableCell>
                  <StatusBadge status={normalizeStatus(r.status)} />
                </TableCell>
                <TableCell className="text-sm text-foreground">{r.category}</TableCell>
                <TableCell>
                  <UrgencyBadge urgency={normalizeUrgency(r.urgency)} />
                </TableCell>
                <TableCell className="text-sm text-foreground">
                  {r.technician_name ?? (
                    <span className="text-muted-foreground">Unassigned</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{r.citizen_name}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
          <span>
            Page {safePage + 1} of {totalPages}
          </span>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1 px-2"
              disabled={safePage === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              <ChevronLeft className="size-3" /> Prev
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1 px-2"
              disabled={safePage >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            >
              Next <ChevronRight className="size-3" />
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { v: string; l: string }[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-8 w-[180px] bg-card text-sm">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.v} value={o.v}>
            {o.l}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function StatusBadge({ status }: { status: string }) {
  const meta: Record<string, { label: string; cls: string }> = {
    reported: { label: "Reported", cls: "border-slate-200 bg-slate-50 text-slate-700" },
    verified: { label: "Verified", cls: "border-violet-200 bg-violet-50 text-violet-700" },
    assigned: { label: "Assigned", cls: "border-blue-200 bg-blue-50 text-blue-700" },
    in_progress: { label: "In progress", cls: "border-blue-200 bg-blue-50 text-blue-700" },
    resolved: { label: "Resolved", cls: "border-emerald-200 bg-emerald-50 text-emerald-700" },
    rejected: { label: "Rejected", cls: "border-red-200 bg-red-50 text-red-700" },
  };
  const m = meta[status] ?? meta.reported;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
        m.cls,
      )}
    >
      {m.label}
    </span>
  );
}

function UrgencyBadge({ urgency }: { urgency: string }) {
  const meta: Record<string, string> = {
    critical: "border-red-200 bg-red-50 text-red-700",
    high: "border-orange-200 bg-orange-50 text-orange-700",
    medium: "border-yellow-200 bg-yellow-50 text-yellow-800",
    low: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize",
        meta[urgency] ?? meta.low,
      )}
    >
      {urgency}
    </span>
  );
}

/* ============ USERS ============ */

function UsersTab({
  users,
  districts,
  loading,
  onChange,
}: {
  users: UserManagementResponse[];
  districts: DistrictData[];
  loading: boolean;
  onChange: () => void;
}) {
  const updateMut = useMutation({
    mutationFn: (vars: { id: number; role: UserRole; district_id?: number | null }) =>
      api.admin.updateUserRole(vars.id, {
        role: vars.role,
        district_id: vars.district_id,
      }),
    onSuccess: () => {
      toast.success("User updated");
      onChange();
    },
    onError: (e) => toast.error("Update failed", { description: (e as Error).message }),
  });

  return (
    <section className="rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Name</TableHead>
            <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">National ID</TableHead>
            <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Role</TableHead>
            <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">District</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={4} className="py-10 text-center">
                <Loader2 className="mx-auto size-4 animate-spin text-muted-foreground" />
              </TableCell>
            </TableRow>
          ) : users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                No users yet.
              </TableCell>
            </TableRow>
          ) : (
            users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium text-foreground">{u.full_name}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{u.national_id}</TableCell>
                <TableCell>
                  <Select
                    value={u.role}
                    onValueChange={(v) =>
                      updateMut.mutate({
                        id: u.id,
                        role: v as UserRole,
                        district_id: u.district_id ?? null,
                      })
                    }
                  >
                    <SelectTrigger className="h-8 w-[160px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select
                    value={u.district_id ? String(u.district_id) : ""}
                    onValueChange={(v) =>
                      updateMut.mutate({
                        id: u.id,
                        role: u.role,
                        district_id: Number(v),
                      })
                    }
                  >
                    <SelectTrigger className="h-8 w-[180px] text-xs">
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      {districts.map((d) => (
                        <SelectItem key={d.id} value={String(d.id)}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </section>
  );
}

/* ============ DISTRICTS ============ */

function DistrictsTab({
  districts,
  onAdded,
}: {
  districts: DistrictData[];
  onAdded: () => void;
}) {
  const [name, setName] = useState("");
  const [radius, setRadius] = useState("5.0");
  const [lat, setLat] = useState("30.0444");
  const [lng, setLng] = useState("31.2357");
  const [desc, setDesc] = useState("");
  const [editingDistrict, setEditingDistrict] = useState<DistrictData | null>(null);

  const createMut = useMutation({
    mutationFn: (vars: { name: string; lat: number; lng: number; radius: number; desc: string }) =>
      api.admin.createDistrict(vars.name, vars.lat, vars.lng, vars.radius, vars.desc),
    onSuccess: () => {
      toast.success("District boundary zone created with visual point mapping");
      setName("");
      setRadius("5.0");
      setLat("30.0444");
      setLng("31.2357");
      setDesc("");
      onAdded();
    },
    onError: (e) => toast.error("Create failed", { description: (e as Error).message }),
  });

  const updateMut = useMutation({
    mutationFn: (vars: { id: number; data: Partial<DistrictData> }) =>
      api.admin.updateDistrict(vars.id, vars.data),
    onSuccess: () => {
      toast.success("District surveillance radius and GPS point updated successfully");
      setEditingDistrict(null);
      onAdded();
    },
    onError: (e) => toast.error("Update failed", { description: (e as Error).message }),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      {/* Left: Interactive District Builder */}
      <div className="rounded-xl border border-border bg-card p-5 lg:col-span-5 h-fit shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-2xs">
              <LocateFixed className="size-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold tracking-tight text-foreground">Interactive Jurisdiction Pointing</h3>
              <p className="text-[11px] text-muted-foreground">Point center location on map & adjust surveillance radius.</p>
            </div>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) {
              createMut.mutate({
                name: name.trim(),
                lat: parseFloat(lat) || 30.0444,
                lng: parseFloat(lng) || 31.2357,
                radius: parseFloat(radius) || 5.0,
                desc: desc.trim() || "Municipal district operational zone.",
              });
            }
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="district-name" className="text-xs font-semibold">
              District Zone Name
            </Label>
            <Input
              id="district-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Riverside Sector"
              className="text-xs h-9 bg-canvas/60"
              required
            />
          </div>

          {/* Interactive Live Map Selector */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-foreground">
              <span className="flex items-center gap-1.5 text-primary">
                <Globe className="size-3.5" /> Live Map Pointer
              </span>
              <span className="font-mono text-[11px] font-normal text-muted-foreground">
                GPS: {parseFloat(lat).toFixed(4)}° N, {parseFloat(lng).toFixed(4)}° E
              </span>
            </div>
            <Suspense fallback={<div className="h-[220px] w-full bg-secondary/50 rounded-xl animate-pulse border border-border" />}>
              <DistrictBoundaryMap
                lat={parseFloat(lat) || 30.0444}
                lng={parseFloat(lng) || 31.2357}
                radiusKm={parseFloat(radius) || 5.0}
                name={name || "Target Center"}
                height="h-[220px]"
                interactive={true}
                onLocationSelect={(newLat, newLng) => {
                  setLat(String(newLat));
                  setLng(String(newLng));
                }}
                otherDistricts={districts}
              />
            </Suspense>
          </div>

          {/* UI Surveillance Radius Controller Slider */}
          <div className="space-y-2.5 rounded-lg border border-primary/20 bg-primary/5 p-3.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <SlidersHorizontal className="size-3.5 text-primary" /> Surveillance Radius Space
              </span>
              <span className="font-mono text-xs font-extrabold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/30 shadow-2xs">
                {radius} km (~{Math.round(Math.PI * Math.pow(parseFloat(radius) || 5, 2))} km²)
              </span>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-7 shrink-0 text-xs font-bold shadow-2xs bg-card hover:bg-secondary"
                onClick={() => setRadius((r) => String(Math.max(0.5, (parseFloat(r) || 5) - 0.5)))}
                title="Decrease radius by 0.5 km"
              >
                -
              </Button>
              <input
                type="range"
                min="0.5"
                max="35"
                step="0.5"
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                className="w-full accent-primary h-2 bg-secondary rounded-lg cursor-pointer"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-7 shrink-0 text-xs font-bold shadow-2xs bg-card hover:bg-secondary"
                onClick={() => setRadius((r) => String(Math.min(100, (parseFloat(r) || 5) + 0.5)))}
                title="Increase radius by 0.5 km"
              >
                +
              </Button>
            </div>
            <div className="flex justify-between text-[10px] font-medium text-muted-foreground pt-0.5">
              <span>0.5 km (Precise Local)</span>
              <span>Slide to scale coverage space</span>
              <span>35 km (Metropolitan)</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="district-desc" className="text-xs font-semibold">
              Geographical Perimeter & Landmarks
            </Label>
            <Textarea
              id="district-desc"
              rows={2}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Describe borders, highways, and operational limits of this sector..."
              className="text-xs resize-none bg-canvas/60"
            />
          </div>

          <Button
            type="submit"
            size="sm"
            disabled={!name.trim() || createMut.isPending}
            className="w-full gap-2 font-bold shadow-2xs h-10 mt-1"
          >
            <LocateFixed className="size-4" /> Initialize Municipal Jurisdiction
          </Button>
        </form>
      </div>

      {/* Right: Master Overview & District Directory */}
      <div className="lg:col-span-7 space-y-5">
        <div className="rounded-xl border border-border bg-card shadow-2xs overflow-hidden">
          <div className="border-b border-border bg-secondary/30 px-5 py-3.5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold tracking-tight text-foreground">Metropolitan Surveillance Network</h3>
              <p className="text-xs text-muted-foreground">Master view of all district coverage circles and operational zones.</p>
            </div>
            <span className="inline-flex h-6 items-center justify-center rounded-full bg-primary/10 px-3 text-xs font-bold text-primary">
              {districts.length} Active Jurisdictions
            </span>
          </div>

          {/* Master Overview Map */}
          <div className="p-3 bg-secondary/10 border-b border-border/60">
            <Suspense fallback={<div className="h-[240px] w-full bg-secondary/50 rounded-lg animate-pulse" />}>
              <DistrictBoundaryMap
                lat={districts[0]?.latitude ?? 30.0444}
                lng={districts[0]?.longitude ?? 31.2357}
                radiusKm={districts[0]?.radius_km ?? 5.0}
                name={districts[0]?.name ?? "Master Hub"}
                height="h-[240px]"
                interactive={false}
                otherDistricts={districts}
              />
            </Suspense>
          </div>

          <div className="divide-y divide-border/60">
            {districts.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No municipal districts configured yet. Point a location on the left to start.
              </div>
            ) : (
              districts.map((d) => (
                <div key={d.id} className="p-4 sm:p-5 hover:bg-secondary/20 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 max-w-md">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground text-sm flex items-center gap-1.5">
                        <MapPin className="size-3.5 text-primary shrink-0" />
                        {d.name}
                      </span>
                      <span className="text-[10px] font-mono font-semibold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full border border-border">
                        ID #{d.id}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {d.boundaries_description || "Standard municipal district operational zone."}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-xs shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-border/40">
                    <div className="bg-canvas/60 rounded-lg p-2.5 border border-border/60 min-w-28 text-center">
                      <div className="text-[10px] text-muted-foreground font-medium flex items-center justify-center gap-1">
                        <SlidersHorizontal className="size-2.5 text-primary" /> Radius Space
                      </div>
                      <div className="font-extrabold text-foreground mt-0.5 text-sm">{d.radius_km ?? 5.0} km</div>
                      <div className="text-[10px] text-primary font-bold">~{Math.round(Math.PI * Math.pow(d.radius_km ?? 5.0, 2))} km² area</div>
                    </div>

                    <div className="bg-canvas/60 rounded-lg p-2.5 border border-border/60 min-w-32 text-center hidden xl:block">
                      <div className="text-[10px] text-muted-foreground font-medium">GPS Point</div>
                      <div className="font-mono text-xs font-bold text-foreground mt-0.5">
                        {d.latitude?.toFixed(4) ?? "30.0444"}° N
                      </div>
                      <div className="font-mono text-[11px] text-muted-foreground">
                        {d.longitude?.toFixed(4) ?? "31.2357"}° E
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingDistrict({ ...d, radius_km: d.radius_km ?? 5.0, latitude: d.latitude ?? 30.0444, longitude: d.longitude ?? 31.2357, boundaries_description: d.boundaries_description ?? "" })}
                      className="h-10 px-3.5 gap-1.5 text-xs font-bold shadow-2xs bg-primary/5 hover:bg-primary/15 hover:text-primary border-primary/20"
                    >
                      <Pencil className="size-3.5 text-primary" /> Point & Adjust
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Interactive Point & Adjust Boundary Modal */}
      {editingDistrict && (
        <Dialog open={!!editingDistrict} onOpenChange={(v) => !v && setEditingDistrict(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-bold">
                <LocateFixed className="size-5 text-primary animate-pulse" />
                <span>Interactive Geo-Surveillance Editor — {editingDistrict.name}</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Click directly on the map to relocate the district headquarters pin, or slide the radius control below to dynamically expand or contract the municipal surveillance space.
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (editingDistrict.name.trim()) {
                  updateMut.mutate({
                    id: editingDistrict.id,
                    data: {
                      name: editingDistrict.name.trim(),
                      radius_km: Number(editingDistrict.radius_km) || 5.0,
                      latitude: Number(editingDistrict.latitude) || 30.0444,
                      longitude: Number(editingDistrict.longitude) || 31.2357,
                      boundaries_description: editingDistrict.boundaries_description,
                    },
                  });
                }
              }}
              className="space-y-4 py-1"
            >
              {/* Interactive Live Editor Map */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-primary">
                    <Globe className="size-3.5" /> Live Pointing Map (Click or drag pin)
                  </span>
                  <span className="font-mono text-[11px] font-bold text-foreground bg-secondary px-2 py-0.5 rounded border border-border">
                    Current Center: {Number(editingDistrict.latitude ?? 30.0444).toFixed(4)}° N, {Number(editingDistrict.longitude ?? 31.2357).toFixed(4)}° E
                  </span>
                </div>
                <Suspense fallback={<div className="h-[300px] w-full bg-secondary/60 rounded-xl animate-pulse border border-border" />}>
                  <DistrictBoundaryMap
                    lat={Number(editingDistrict.latitude ?? 30.0444)}
                    lng={Number(editingDistrict.longitude ?? 31.2357)}
                    radiusKm={Number(editingDistrict.radius_km ?? 5.0)}
                    name={editingDistrict.name}
                    height="h-[300px]"
                    interactive={true}
                    onLocationSelect={(newLat, newLng) => {
                      setEditingDistrict({
                        ...editingDistrict,
                        latitude: newLat,
                        longitude: newLng,
                      });
                    }}
                    otherDistricts={districts}
                    currentDistrictId={editingDistrict.id}
                  />
                </Suspense>
              </div>

              {/* Live Interactive Surveillance Radius Controller */}
              <div className="space-y-3 rounded-xl border border-primary/25 bg-gradient-to-r from-primary/10 via-card to-card p-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <div className="font-extrabold text-foreground flex items-center gap-1.5 text-sm">
                      <SlidersHorizontal className="size-4 text-primary" /> Dynamic Surveillance Radius Control
                    </div>
                    <p className="text-muted-foreground text-[11px] mt-0.5">Slide to instantly expand or contract coverage perimeter on the map.</p>
                  </div>
                  <span className="font-mono text-sm font-black text-primary bg-primary/15 px-3 py-1 rounded-full border border-primary/30 shadow-2xs text-center">
                    {editingDistrict.radius_km ?? 5.0} km (~{Math.round(Math.PI * Math.pow(Number(editingDistrict.radius_km ?? 5.0), 2))} km²)
                  </span>
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-8 shrink-0 font-bold text-sm shadow-2xs bg-card hover:bg-secondary"
                    onClick={() => setEditingDistrict({ ...editingDistrict, radius_km: Math.max(0.5, Number(editingDistrict.radius_km ?? 5.0) - 0.5) })}
                  >
                    -
                  </Button>
                  <input
                    type="range"
                    min="0.5"
                    max="50"
                    step="0.5"
                    value={editingDistrict.radius_km ?? 5.0}
                    onChange={(e) => setEditingDistrict({ ...editingDistrict, radius_km: parseFloat(e.target.value) || 0.5 })}
                    className="w-full accent-primary h-2.5 bg-secondary rounded-lg cursor-pointer"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-8 shrink-0 font-bold text-sm shadow-2xs bg-card hover:bg-secondary"
                    onClick={() => setEditingDistrict({ ...editingDistrict, radius_km: Math.min(100, Number(editingDistrict.radius_km ?? 5.0) + 0.5) })}
                  >
                    +
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">District Zone Name</Label>
                  <Input
                    value={editingDistrict.name}
                    onChange={(e) => setEditingDistrict({ ...editingDistrict, name: e.target.value })}
                    className="h-9 text-xs font-semibold"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Geographical Perimeter & Landmarks</Label>
                  <Input
                    value={editingDistrict.boundaries_description ?? ""}
                    onChange={(e) => setEditingDistrict({ ...editingDistrict, boundaries_description: e.target.value })}
                    placeholder="Detail borders, roads, and regional bounds..."
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <DialogFooter className="pt-3 border-t border-border/60">
                <Button type="button" variant="ghost" size="sm" onClick={() => setEditingDistrict(null)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={updateMut.isPending} className="gap-2 font-bold shadow-2xs">
                  <LocateFixed className="size-4" /> Apply & Save Geo-Boundary
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

/* ============ CATEGORIES ============ */

function CategoriesTab({
  categories,
  onChanged,
}: {
  categories: CategoryData[];
  onChanged: () => void;
}) {
  const [name, setName] = useState("");
  const [priority, setPriority] = useState<PriorityOption>("Medium");
  const [sla, setSla] = useState("24");
  const [toDelete, setToDelete] = useState<CategoryData | null>(null);

  const createMut = useMutation({
    mutationFn: (vars: { name: string; default_priority: string; sla_hours: number }) =>
      api.categories.create(vars),
    onSuccess: () => {
      toast.success("Category created");
      setName("");
      onChanged();
    },
    onError: (e) => toast.error("Create failed", { description: (e as Error).message }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.categories.remove(id),
    onSuccess: () => {
      toast.success("Category deleted");
      setToDelete(null);
      onChanged();
    },
    onError: (e) => toast.error("Delete failed", { description: (e as Error).message }),
  });

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-lg border border-border bg-card p-5 md:col-span-1">
        <h3 className="text-sm font-semibold text-foreground">New category</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const slaNum = Number(sla);
            if (!name.trim() || !Number.isFinite(slaNum) || slaNum <= 0) return;
            createMut.mutate({
              name: name.trim(),
              default_priority: priority,
              sla_hours: slaNum,
            });
          }}
          className="mt-4 space-y-3"
        >
          <div className="space-y-1.5">
            <Label className="text-xs">Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Pothole"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Default priority</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as PriorityOption)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">SLA (hours)</Label>
            <Input
              type="number"
              min={1}
              value={sla}
              onChange={(e) => setSla(e.target.value)}
            />
          </div>
          <Button
            type="submit"
            size="sm"
            disabled={createMut.isPending}
            className="w-full gap-1.5"
          >
            <Plus className="size-3.5" /> Add category
          </Button>
        </form>
      </div>
      <div className="rounded-lg border border-border bg-card md:col-span-2">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Name</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Priority</TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">SLA</TableHead>
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                  No categories yet.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium text-foreground">{c.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {c.default_priority}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {c.sla_hours}h
                  </TableCell>
                  <TableCell>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7 text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => setToDelete(c)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove “{toDelete?.name}”. Reports already using it stay intact, but
              citizens can't pick this category anymore.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => toDelete && deleteMut.mutate(toDelete.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
