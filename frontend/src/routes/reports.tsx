import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, Plus, Search, Sparkles, ClipboardList, AlertCircle, Heart, Filter, X, ArrowUpDown, Globe, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import {
  CommunityReportCard,
  MyReportCard,
} from "@/components/report-card";
import { NewReportModal } from "@/components/new-report-modal";
import { ReportDetailsDialog } from "@/components/report-details-dialog";
import { RequireAuth } from "@/components/require-auth";
import { api, type ReportResponse } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { LanguageToggle } from "@/components/language-toggle";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Report Hub — UrbanFix" },
      {
        name: "description",
        content:
          "Discover community issues, track your reports, filter by category and urgency, and endorse local fixes on UrbanFix.",
      },
    ],
  }),
  component: () => (
    <RequireAuth roles={["Citizen"]}>
      <ReportsPage />
    </RequireAuth>
  ),
});

type Tab = "mine" | "community" | "liked";

function ReportsPage() {
  const { user, logout } = useAuth();
  const { t, toggle, lang } = useI18n();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("community");
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedUrgency, setSelectedUrgency] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [showNew, setShowNew] = useState(false);
  const [details, setDetails] = useState<ReportResponse | null>(null);

  const mineQuery = useQuery({
    queryKey: ["reports", "mine"],
    queryFn: () => api.reports.mine(),
  });
  const communityQuery = useQuery({
    queryKey: ["reports", "community"],
    queryFn: () => api.reports.community(),
  });
  const likedQuery = useQuery({
    queryKey: ["reports", "liked"],
    queryFn: () => api.reports.liked(),
  });

  const upvote = useMutation({
    mutationFn: (id: number) => api.reports.upvote(id),
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: ["reports", "mine"] });
      qc.invalidateQueries({ queryKey: ["reports", "community"] });
      qc.invalidateQueries({ queryKey: ["reports", "liked"] });
      if (details && details.id === variables) {
        setDetails((prev) => prev ? { ...prev, upvote_count: data.upvote_count, has_upvoted: data.has_upvoted } : null);
      }
    },
  });

  const categoryFilters = [
    { value: "all", label: t("hub_filter_all_cat"), emoji: "✨" },
    { value: "Pothole", label: t("cat_Pothole"), emoji: "🕳️" },
    { value: "Streetlight", label: t("cat_Streetlight"), emoji: "💡" },
    { value: "Water leak", label: t("cat_Water leak"), emoji: "💧" },
    { value: "Graffiti", label: t("cat_Graffiti"), emoji: "🎨" },
    { value: "Trash / Debris", label: t("cat_Trash / Debris"), emoji: "🗑️" },
  ];

  const statusFilters = [
    { value: "all", label: t("hub_filter_all_status") },
    { value: "Reported", label: lang === "ar" ? "مُبلغ عنه" : "Reported" },
    { value: "Verified", label: lang === "ar" ? "مُتخذ إجراء" : "Verified" },
    { value: "InProgress", label: t("tech_col_InProgress") },
    { value: "Resolved", label: t("tech_col_Resolved") },
    { value: "Rejected", label: lang === "ar" ? "مرفوض" : "Rejected" },
  ];

  const urgencyFilters = [
    { value: "all", label: t("hub_filter_all_urgency") },
    { value: "Low", label: t("tech_pri_Low") },
    { value: "Medium", label: t("tech_pri_Medium") },
    { value: "High", label: t("tech_pri_High") },
    { value: "Critical", label: t("tech_pri_Critical") },
  ];

  const sortOptions = [
    { value: "newest", label: t("hub_sort_newest") },
    { value: "popular", label: t("hub_sort_popular") },
    { value: "urgency", label: t("hub_sort_urgency") },
    { value: "oldest", label: t("hub_sort_oldest") },
  ];

  const isFiltered =
    query.trim() !== "" ||
    selectedCategory !== "all" ||
    selectedStatus !== "all" ||
    selectedUrgency !== "all" ||
    sortBy !== "newest";

  function clearFilters() {
    setQuery("");
    setSelectedCategory("all");
    setSelectedStatus("all");
    setSelectedUrgency("all");
    setSortBy("newest");
  }

  const myReports = useMemo(
    () => filterAndSortReports(mineQuery.data ?? [], query, selectedCategory, selectedStatus, selectedUrgency, sortBy),
    [mineQuery.data, query, selectedCategory, selectedStatus, selectedUrgency, sortBy],
  );
  const community = useMemo(
    () => filterAndSortReports(communityQuery.data ?? [], query, selectedCategory, selectedStatus, selectedUrgency, sortBy),
    [communityQuery.data, query, selectedCategory, selectedStatus, selectedUrgency, sortBy],
  );
  const likedReports = useMemo(
    () => filterAndSortReports(likedQuery.data ?? [], query, selectedCategory, selectedStatus, selectedUrgency, sortBy),
    [likedQuery.data, query, selectedCategory, selectedStatus, selectedUrgency, sortBy],
  );

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <Toaster position="top-center" />

      {/* Top bar (No search bar here!) */}
      <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-border bg-card/80 px-6 backdrop-blur supports-[backdrop-filter]:bg-card/70">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-2xs">
            <MapPin className="size-4" />
          </span>
          <span className="text-base font-semibold tracking-tight text-foreground">
            UrbanFix
          </span>
        </Link>

        <div className="flex items-center gap-2.5">
          <LanguageToggle />

          <span className="hidden text-xs font-medium text-muted-foreground sm:inline px-2 py-1 bg-secondary/70 rounded-md">
            {user?.full_name}
          </span>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              logout();
              navigate({ to: "/login" });
            }}
            className="text-xs text-muted-foreground hover:text-foreground gap-1"
          >
            <LogOut className="size-3.5" />
            <span>{t("nav.signOut")}</span>
          </Button>

          <Button size="sm" onClick={() => setShowNew(true)} className="gap-1.5 shadow-2xs font-medium">
            <Plus className="size-4" />
            <span className="hidden sm:inline">{t("common.newReport")}</span>
          </Button>
        </div>
      </header>

      {/* Page header & controls */}
      <div className="mx-auto w-full max-w-6xl px-4 pt-8 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center gap-2.5">
              <span>{t("hub_title")}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-1 text-xs font-semibold text-primary">
                <Sparkles className="size-3.5" /> {t("hub_district_portal")}
              </span>
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {t("hub_subtitle")}
            </p>
          </div>
        </div>

        {/* Tabs row */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
          <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="w-full sm:w-auto">
            <TabsList className="bg-secondary p-1 rounded-lg h-auto flex-wrap sm:flex-nowrap">
              <TabsTrigger value="community" className="rounded-md px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-all">
                {t("hub_tab_community")}
                <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-card px-1.5 text-[10px] font-bold text-foreground shadow-2xs">
                  {communityQuery.data?.length ?? 0}
                </span>
              </TabsTrigger>
              <TabsTrigger value="mine" className="rounded-md px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-all">
                {t("hub_tab_mine")}
                <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-card px-1.5 text-[10px] font-bold text-foreground shadow-2xs">
                  {mineQuery.data?.length ?? 0}
                </span>
              </TabsTrigger>
              <TabsTrigger value="liked" className="rounded-md px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-all">
                <Heart className="size-3.5 mr-1.5 fill-rose-500 text-rose-500 inline" />
                {t("hub_tab_liked")}
                <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-card px-1.5 text-[10px] font-bold text-foreground shadow-2xs">
                  {likedQuery.data?.length ?? 0}
                </span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Search & Filter Bar (Placed here, outside navbar) */}
        <div className="mt-4 flex flex-col gap-3.5 rounded-xl border border-border bg-card p-4 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative w-full md:w-80 shrink-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("hub_search_placeholder")}
                className="h-9 w-full pl-9 pr-8 text-xs bg-canvas/60 border-border/80"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {isFiltered && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary gap-1.5 self-start md:self-auto ml-auto"
              >
                <X className="size-3.5" />
                {t("hub_reset_filters")}
              </Button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border/40">
            <span className="text-xs font-semibold text-muted-foreground mr-1.5 flex items-center gap-1">
              <Filter className="size-3.5" />
              {t("hub_filter_category")}
            </span>
            {categoryFilters.map((cat) => {
              const active = selectedCategory === cat.value;
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setSelectedCategory(cat.value)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all",
                    active
                      ? "bg-primary text-primary-foreground font-semibold shadow-2xs scale-[1.02]"
                      : "bg-secondary/80 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2.5 border-t border-border/50 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground font-medium">{t("hub_filter_status")}</span>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="h-8 w-[140px] text-xs bg-canvas/60">
                  <SelectValue placeholder={t("hub_filter_all_status")} />
                </SelectTrigger>
                <SelectContent>
                  {statusFilters.map((s) => (
                    <SelectItem key={s.value} value={s.value} className="text-xs">
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-muted-foreground font-medium">{t("hub_filter_urgency")}</span>
              <Select value={selectedUrgency} onValueChange={setSelectedUrgency}>
                <SelectTrigger className="h-8 w-[135px] text-xs bg-canvas/60">
                  <SelectValue placeholder={t("hub_filter_all_urgency")} />
                </SelectTrigger>
                <SelectContent>
                  {urgencyFilters.map((u) => (
                    <SelectItem key={u.value} value={u.value} className="text-xs">
                      {u.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <span className="text-muted-foreground font-medium flex items-center gap-1">
                <ArrowUpDown className="size-3 text-muted-foreground" />
                {t("hub_filter_sort")}
              </span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-8 w-[175px] text-xs font-semibold bg-canvas/60 border-primary/20">
                  <SelectValue placeholder={t("hub_sort_newest")} />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            emptyState={<EmptyMine onNew={() => setShowNew(true)} isFiltered={isFiltered} onReset={clearFilters} />}
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {myReports.map((r) => (
                <MyReportCard
                  key={r.id}
                  report={r}
                  onDetails={setDetails}
                  onUpvote={(id) => upvote.mutate(id)}
                />
              ))}
            </div>
          </DataSection>
        ) : tab === "community" ? (
          <DataSection
            loading={communityQuery.isLoading}
            error={communityQuery.error}
            empty={community.length === 0}
            emptyState={<EmptyCommunity onNew={() => setShowNew(true)} isFiltered={isFiltered} onReset={clearFilters} />}
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {community.map((r) => (
                <CommunityReportCard
                  key={r.id}
                  report={r}
                  onUpvote={(id) => upvote.mutate(id)}
                  onDetails={setDetails}
                />
              ))}
            </div>
          </DataSection>
        ) : (
          <DataSection
            loading={likedQuery.isLoading}
            error={likedQuery.error}
            empty={likedReports.length === 0}
            emptyState={<EmptyLiked onExplore={() => setTab("community")} isFiltered={isFiltered} onReset={clearFilters} />}
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {likedReports.map((r) => (
                <CommunityReportCard
                  key={r.id}
                  report={r}
                  onUpvote={(id) => upvote.mutate(id)}
                  onDetails={setDetails}
                />
              ))}
            </div>
          </DataSection>
        )}
      </main>

      <NewReportModal
        open={showNew}
        onOpenChange={setShowNew}
        onCreated={() => {
          qc.invalidateQueries({ queryKey: ["reports", "mine"] });
          qc.invalidateQueries({ queryKey: ["reports", "community"] });
        }}
      />
      <ReportDetailsDialog
        report={details}
        open={!!details}
        onOpenChange={(v) => !v && setDetails(null)}
        onUpvote={(id) => upvote.mutate(id)}
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

function filterAndSortReports(list: ReportResponse[], q: string, cat: string, status: string, urgency: string, sort: string) {
  let result = list.slice();
  if (q.trim()) {
    const s = q.toLowerCase();
    result = result.filter(
      (r) =>
        r.description.toLowerCase().includes(s) ||
        (r.address_description ?? "").toLowerCase().includes(s) ||
        r.category.toLowerCase().includes(s),
    );
  }
  if (cat !== "all") {
    result = result.filter((r) => r.category.toLowerCase() === cat.toLowerCase());
  }
  if (status !== "all") {
    result = result.filter((r) => r.status.toLowerCase() === status.toLowerCase());
  }
  if (urgency !== "all") {
    result = result.filter((r) => r.urgency.toLowerCase() === urgency.toLowerCase());
  }
  result.sort((a, b) => {
    if (sort === "popular") {
      return (b.upvote_count ?? 0) - (a.upvote_count ?? 0);
    }
    if (sort === "urgency") {
      const weight: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
      return (weight[b.urgency.toLowerCase()] ?? 0) - (weight[a.urgency.toLowerCase()] ?? 0);
    }
    if (sort === "oldest") {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
    // default newest
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  return result;
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

function EmptyFiltered({ onReset }: { onReset?: () => void }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-8 py-16 text-center">
      <Search className="size-8 text-muted-foreground opacity-50 mb-3" />
      <h3 className="text-base font-semibold text-foreground">
        {t("hub_no_matches_title")}
      </h3>
      <p className="mt-1 max-w-sm text-xs text-muted-foreground">
        {t("hub_no_matches_desc")}
      </p>
      {onReset && (
        <Button onClick={onReset} variant="secondary" size="sm" className="mt-4 gap-1.5">
          <X className="size-3.5" /> {t("hub_clear_all_filters")}
        </Button>
      )}
    </div>
  );
}

function EmptyMine({ onNew, isFiltered, onReset }: { onNew: () => void; isFiltered?: boolean; onReset?: () => void }) {
  const { t } = useI18n();
  if (isFiltered) return <EmptyFiltered onReset={onReset} />;
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-8 py-20 text-center">
      <EmptyIllustration />
      <h3 className="mt-6 text-lg font-semibold text-foreground">
        {t("reports.empty.title")}
      </h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {t("reports.empty.body")}
      </p>
      <Button onClick={onNew} className="mt-6 gap-1.5">
        <Plus className="size-4" /> {t("hub_file_first_report")}
      </Button>
    </div>
  );
}

function EmptyCommunity({ onNew, isFiltered, onReset }: { onNew: () => void; isFiltered?: boolean; onReset?: () => void }) {
  const { t } = useI18n();
  if (isFiltered) return <EmptyFiltered onReset={onReset} />;
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-8 py-20 text-center">
      <EmptyIllustration variant="community" />
      <h3 className="mt-6 text-lg font-semibold text-foreground">
        {t("hub_no_community_title")}
      </h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {t("hub_no_community_desc")}
      </p>
      <Button onClick={onNew} className="mt-6 gap-1.5">
        <Plus className="size-4" /> {t("common.newReport")}
      </Button>
    </div>
  );
}

function EmptyLiked({ onExplore, isFiltered, onReset }: { onExplore: () => void; isFiltered?: boolean; onReset?: () => void }) {
  const { t } = useI18n();
  if (isFiltered) return <EmptyFiltered onReset={onReset} />;
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-8 py-20 text-center">
      <EmptyIllustration variant="liked" />
      <h3 className="mt-6 text-lg font-semibold text-foreground">
        {t("hub_no_liked_title")}
      </h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {t("hub_no_liked_desc")}
      </p>
      <Button onClick={onExplore} className="mt-6 gap-1.5" variant="outline">
        <Sparkles className="size-4 text-amber-500" /> {t("hub_explore_community")}
      </Button>
    </div>
  );
}

function EmptyIllustration({ variant = "mine" }: { variant?: "mine" | "community" | "liked" }) {
  return (
    <div className="relative">
      <div className="absolute -inset-6 rounded-full bg-blue-50/60 blur-xl" />
      <div className="relative flex size-24 items-center justify-center rounded-3xl border border-border bg-canvas">
        {variant === "mine" ? (
          <ClipboardList className="size-10 text-blue-500" />
        ) : variant === "community" ? (
          <MapPin className="size-10 text-emerald-500" />
        ) : (
          <Heart className="size-10 text-rose-500 fill-rose-500" />
        )}
        <span className="absolute -right-2 -top-2 flex size-7 items-center justify-center rounded-full border border-border bg-card">
          <Sparkles className="size-3.5 text-amber-500" />
        </span>
      </div>
    </div>
  );
}
