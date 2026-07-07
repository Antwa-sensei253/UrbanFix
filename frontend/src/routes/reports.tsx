import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, Plus, Search, Sparkles, ClipboardList, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/sonner";
import {
  CommunityReportCard,
  MyReportCard,
} from "@/components/report-card";
import { NewReportModal } from "@/components/new-report-modal";
import { ReportDetailsDialog } from "@/components/report-details-dialog";
import { RequireAuth } from "@/components/require-auth";
import { api, type ReportResponse } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Citizen portal — UrbanFix" },
      {
        name: "description",
        content:
          "Track your reports and see what's happening in your district on UrbanFix.",
      },
    ],
  }),
  component: () => (
    <RequireAuth roles={["Citizen"]}>
      <ReportsPage />
    </RequireAuth>
  ),
});

type Tab = "mine" | "community";

function ReportsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("mine");
  const [query, setQuery] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [details, setDetails] = useState<ReportResponse | null>(null);

  const mineQuery = useQuery({
    queryKey: ["reports", "mine"],
    queryFn: () => api.reports.mine(),
  });
  const communityQuery = useQuery({
    queryKey: ["reports", "community"],
    queryFn: () => api.reports.community(),
    enabled: tab === "community",
  });

  const upvote = useMutation({
    mutationFn: (id: number) => api.reports.upvote(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reports", "community"] }),
  });

  const myReports = useMemo(
    () => filterReports(mineQuery.data ?? [], query),
    [mineQuery.data, query],
  );
  const community = useMemo(
    () => filterReports(communityQuery.data ?? [], query),
    [communityQuery.data, query],
  );

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <Toaster position="top-center" />

      {/* Top bar */}
      <header className="z-30 flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <MapPin className="size-3.5" />
          </span>
          <span className="text-sm font-semibold tracking-tight text-foreground">
            UrbanFix
          </span>
        </Link>
        <div className="hidden flex-1 px-6 md:flex md:max-w-md md:mx-auto">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search reports…"
              className="h-9 pl-9"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-muted-foreground sm:inline">
            {user?.full_name}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              logout();
              navigate({ to: "/login" });
            }}
          >
            Sign out
          </Button>
          <Button size="sm" onClick={() => setShowNew(true)} className="gap-1.5">
            <Plus className="size-4" />
            <span className="hidden sm:inline">New report</span>
          </Button>
        </div>
      </header>

      {/* Page header */}
      <div className="mx-auto w-full max-w-6xl px-4 pt-8 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Welcome back, {user?.full_name?.split(" ")[0] ?? "neighbor"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Your reports and what's happening in your district.
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
            <TabsList className="bg-secondary">
              <TabsTrigger value="mine">
                My Reports
                <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-card px-1 text-[10px] font-semibold text-foreground">
                  {myReports.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="community">
                Community Feed
                <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-card px-1 text-[10px] font-semibold text-foreground">
                  {community.length}
                </span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="md:hidden">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search…"
                className="h-9 w-40 pl-8"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        {tab === "mine" ? (
          <DataSection
            loading={mineQuery.isLoading}
            error={mineQuery.error}
            empty={myReports.length === 0}
            emptyState={<EmptyMine onNew={() => setShowNew(true)} />}
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {myReports.map((r) => (
                <MyReportCard key={r.id} report={r} onDetails={setDetails} />
              ))}
            </div>
          </DataSection>
        ) : (
          <DataSection
            loading={communityQuery.isLoading}
            error={communityQuery.error}
            empty={community.length === 0}
            emptyState={<EmptyCommunity onNew={() => setShowNew(true)} />}
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {community.map((r) => (
                <CommunityReportCard
                  key={r.id}
                  report={r}
                  onUpvote={(id) => upvote.mutate(id)}
                />
              ))}
            </div>
          </DataSection>
        )}
      </main>

      <NewReportModal
        open={showNew}
        onOpenChange={setShowNew}
        onCreated={() => qc.invalidateQueries({ queryKey: ["reports"] })}
      />
      <ReportDetailsDialog
        report={details}
        open={!!details}
        onOpenChange={(v) => !v && setDetails(null)}
      />

      {/* Mobile FAB */}
      <button
        type="button"
        onClick={() => setShowNew(true)}
        className="fixed bottom-5 right-5 z-40 inline-flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-pop hover:bg-primary-hover sm:hidden"
        aria-label="New report"
      >
        <Plus className="size-6" />
      </button>
    </div>
  );
}

function filterReports(list: ReportResponse[], q: string) {
  if (!q.trim()) return list;
  const s = q.toLowerCase();
  return list.filter(
    (r) =>
      r.description.toLowerCase().includes(s) ||
      (r.address_description ?? "").toLowerCase().includes(s) ||
      r.category.toLowerCase().includes(s),
  );
}

function DataSection({
  loading,
  error,
  empty,
  emptyState,
  children,
}: {
  loading: boolean;
  error: unknown;
  empty: boolean;
  emptyState: React.ReactNode;
  children: React.ReactNode;
}) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-64 animate-pulse rounded-xl border border-border bg-card"
          />
        ))}
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-red-200 bg-red-50/40 px-8 py-16 text-center">
        <AlertCircle className="size-6 text-red-500" />
        <h3 className="mt-3 text-base font-semibold text-foreground">
          Couldn't load reports
        </h3>
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
          {(error as Error).message}
        </p>
      </div>
    );
  }
  if (empty) return <>{emptyState}</>;
  return <>{children}</>;
}

function EmptyMine({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-8 py-20 text-center">
      <EmptyIllustration />
      <h3 className="mt-6 text-lg font-semibold text-foreground">
        No reports yet
      </h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Issues you submit will appear here. Spot a pothole, a broken light, or
        graffiti? File your first report and we'll keep you posted.
      </p>
      <Button onClick={onNew} className="mt-6 gap-1.5">
        <Plus className="size-4" /> File your first report
      </Button>
    </div>
  );
}

function EmptyCommunity({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-8 py-20 text-center">
      <EmptyIllustration variant="community" />
      <h3 className="mt-6 text-lg font-semibold text-foreground">
        Nothing in your district yet
      </h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        No active reports from other residents right now. Be the first to flag
        something that needs attention.
      </p>
      <Button onClick={onNew} className="mt-6 gap-1.5">
        <Plus className="size-4" /> New report
      </Button>
    </div>
  );
}

function EmptyIllustration({ variant = "mine" }: { variant?: "mine" | "community" }) {
  return (
    <div className="relative">
      <div className="absolute -inset-6 rounded-full bg-blue-50/60 blur-xl" />
      <div className="relative flex size-24 items-center justify-center rounded-3xl border border-border bg-canvas">
        {variant === "mine" ? (
          <ClipboardList className="size-10 text-blue-500" />
        ) : (
          <MapPin className="size-10 text-emerald-500" />
        )}
        <span className="absolute -right-2 -top-2 flex size-7 items-center justify-center rounded-full border border-border bg-card">
          <Sparkles className="size-3.5 text-amber-500" />
        </span>
      </div>
    </div>
  );
}
