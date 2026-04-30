import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Protected } from "@/components/Protected";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge, UrgencyBadge } from "@/components/StatusBadge";
import { CenterSpinner } from "@/components/Spinner";
import { apiFetch, useAuth } from "@/lib/auth";
import { showApiError } from "@/components/NotificationBell";
import { Inbox } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

const STATUSES = ["Reported", "Verified", "Assigned", "InProgress", "Resolved", "Rejected"];
const ROLES = ["Citizen", "DistrictManager", "Technician", "Governor"];

const HeatmapView = React.lazy(() => import("@/components/HeatmapView"));

export const Route = createFileRoute("/governor")({
  component: () => (
    <Protected allow="Governor">
      <GovernorPage />
    </Protected>
  ),
});

interface Report {
  id: number | string;
  category: string;
  urgency: string;
  status: string;
  citizen_name?: string;
  technician_name?: string | null;
  created_at?: string;
}

interface Summary {
  total?: number;
  resolved?: number;
  in_progress?: number;
  critical?: number;
  by_category?: Record<string, number>;
}

interface UserData {
  id: number;
  full_name: string;
  national_id: string;
  role: string;
  district_id?: number | null;
  district_name?: string | null;
  is_verified: boolean;
}

interface DistrictData {
  id: number;
  name: string;
}

interface CategoryData {
  id: number;
  name: string;
  default_priority: string;
  sla_hours: number;
}

const PRIORITY_COLOR: Record<string, string> = {
  High: "bg-red-100 text-red-700",
  Medium: "bg-yellow-100 text-yellow-700",
  Low: "bg-green-100 text-green-700",
};

const CATEGORIES = ["Pothole", "Streetlight", "Water Leak", "Trash"];

function GovernorPage() {
  const { user } = useAuth();
  const t = useT();
  const [summary, setSummary] = React.useState<Summary | null>(null);
  const [panelData, setPanelData] = React.useState<{ averageResolutionHours: number } | null>(null);
  const [reports, setReports] = React.useState<Report[]>([]);
  const [users, setUsers] = React.useState<UserData[]>([]);
  const [districts, setDistricts] = React.useState<DistrictData[]>([]);
  const [categories, setCategories] = React.useState<CategoryData[]>([]);
  const [newCatName, setNewCatName] = React.useState("");
  const [newCatPriority, setNewCatPriority] = React.useState("Medium");
  const [newCatSla, setNewCatSla] = React.useState(72);
  
  const [loading, setLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState<string>("All");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("All");
  const [technicianFilter, setTechnicianFilter] = React.useState<string>("All");
  const [newDistrictName, setNewDistrictName] = React.useState("");

  const load = React.useCallback(async () => {
    if (!user) return;
    try {
      const [s, r, u, d, cats, p] = await Promise.all([
        apiFetch("/analytics/summary", user.token).catch(() => null),
        apiFetch("/reports", user.token).catch(() => []),
        apiFetch("/admin/users", user.token).catch(() => []),
        apiFetch("/auth/districts", undefined).catch(() => []),
        apiFetch("/categories", undefined).catch(() => []),
        apiFetch("/analytics/panel", user.token).catch(() => null),
      ]);
      setSummary(s);
      setReports(Array.isArray(r) ? r : (r?.reports ?? []));
      setUsers(Array.isArray(u) ? u : (u?.users ?? []));
      setDistricts(Array.isArray(d) ? d : (d?.districts ?? []));
      setCategories(Array.isArray(cats) ? cats : []);
      setPanelData(p);
    } catch (e) {
      showApiError(e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  React.useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [load]);

  const handleAddDistrict = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDistrictName.trim() || !user) return;
    try {
      await apiFetch("/admin/districts", user.token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDistrictName) // body expects just a string since [FromBody] string name
      });
      toast.success("District added successfully.");
      setNewDistrictName("");
      load();
    } catch (e) {
      showApiError(e);
    }
  };

  const handleUpdateUser = async (userId: number, role: string, districtId: number | null | string) => {
    if (!user) return;
    try {
      await apiFetch(`/admin/users/${userId}/role`, user.token, {
        method: "PATCH",
        body: JSON.stringify({ 
            role, 
            district_id: districtId === "null" || !districtId ? null : Number(districtId) 
        })
      });
      toast.success("User updated successfully.");
      load();
    } catch (e) {
      showApiError(e);
    }
  };

  const counts = summary?.by_category
    ?? reports.reduce<Record<string, number>>((acc, r) => {
      acc[r.category] = (acc[r.category] ?? 0) + 1;
      return acc;
    }, {});
  const chartData = CATEGORIES.map((c) => ({ category: c, count: counts[c] ?? 0 }));

  const total = summary?.total ?? reports.length;
  const resolved = summary?.resolved ?? reports.filter((r) => r.status === "Resolved").length;
  const inProgress = summary?.in_progress ?? reports.filter((r) => r.status === "InProgress").length;
  const critical = summary?.critical ?? reports.filter((r) => r.urgency === "Critical").length;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t.governor_dashboard}</h1>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">{t.overview}</TabsTrigger>
          <TabsTrigger value="reports">{t.reports}</TabsTrigger>
          <TabsTrigger value="heatmap">{t.city_heatmap}</TabsTrigger>
          <TabsTrigger value="users">{t.manage_users}</TabsTrigger>
          <TabsTrigger value="districts">{t.manage_districts}</TabsTrigger>
          <TabsTrigger value="categories">{t.categories}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <StatCard label="Total Reports" value={total} bg="bg-blue-600" />
            <StatCard label="Resolved" value={resolved} bg="bg-green-600" />
            <StatCard label="In Progress" value={inProgress} bg="bg-yellow-500" />
            <StatCard label="Critical" value={critical} bg="bg-red-600" />
            <StatCard label="Avg Resolution (hrs)" value={panelData?.averageResolutionHours ?? 0} bg="bg-indigo-600" />
          </div>
          <Card>
            <CardContent className="p-4">
              <h2 className="mb-3 text-lg font-semibold">Reports by Category</h2>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardContent className="p-0">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
                <h2 className="text-lg font-semibold">All Reports</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-muted-foreground mr-1">Filters:</span>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Category" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Categories</SelectItem>
                      {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={technicianFilter} onValueChange={setTechnicianFilter}>
                    <SelectTrigger className="h-8 w-40 text-xs"><SelectValue placeholder="Technician" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Technicians</SelectItem>
                      {users.filter(u => u.role === "Technician").map(t => (
                        <SelectItem key={t.full_name} value={t.full_name}>{t.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-8 w-32 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Statuses</SelectItem>
                      {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {loading ? <CenterSpinner /> : (
                <div className="overflow-auto max-h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Urgency</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Citizen</TableHead>
                        <TableHead>Technician</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reports.filter((r) => {
                         if (statusFilter !== "All" && r.status !== statusFilter) return false;
                         if (categoryFilter !== "All" && r.category !== categoryFilter) return false;
                         if (technicianFilter !== "All" && r.technician_name !== technicianFilter) return false;
                         return true;
                      }).map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-mono text-xs">{r.id}</TableCell>
                          <TableCell>{r.category}</TableCell>
                          <TableCell><UrgencyBadge urgency={r.urgency} /></TableCell>
                          <TableCell><StatusBadge status={r.status} /></TableCell>
                          <TableCell>{r.citizen_name ?? "—"}</TableCell>
                          <TableCell>{r.technician_name ?? "—"}</TableCell>
                          <TableCell className="text-xs">
                            {r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="heatmap">
          <Card>
            <CardHeader><CardTitle>City Heatmap</CardTitle></CardHeader>
            <CardContent>
              {loading ? <CenterSpinner /> : (
                 <React.Suspense fallback={<div className="h-[600px] w-full animate-pulse bg-muted rounded-md" />}>
                   {typeof window !== "undefined" && <HeatmapView reports={reports} />}
                 </React.Suspense>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <CenterSpinner /> : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>NID</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>District</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-mono text-xs">{u.id}</TableCell>
                        <TableCell>{u.full_name}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{u.national_id}</TableCell>
                        <TableCell>
                          <Select 
                            value={u.role} 
                            onValueChange={(val) => handleUpdateUser(u.id, val, u.district_id ?? null)}
                          >
                            <SelectTrigger className="h-8 w-32 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={u.district_id ? String(u.district_id) : "null"}
                            onValueChange={(val) => handleUpdateUser(u.id, u.role, val)}
                          >
                            <SelectTrigger className="h-8 w-36 text-xs">
                              <SelectValue placeholder="No District" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="null">No District</SelectItem>
                              {districts.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="districts">
          <Card className="mb-4">
            <CardHeader><CardTitle>Create District</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleAddDistrict} className="flex gap-2 items-center">
                <Input 
                  placeholder="New District Name..." 
                  value={newDistrictName} 
                  onChange={e => setNewDistrictName(e.target.value)}
                  className="max-w-sm"
                />
                <Button type="submit" disabled={!newDistrictName.trim()}>Add District</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>All Districts</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">ID</TableHead>
                    <TableHead>Name</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {districts.map(d => (
                    <TableRow key={d.id}>
                      <TableCell className="font-mono text-xs">{d.id}</TableCell>
                      <TableCell className="font-medium">{d.name}</TableCell>
                    </TableRow>
                  ))}
                  {districts.length === 0 && (
                    <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">No districts found.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Categories ─────────────────────────────────── */}
        <TabsContent value="categories" className="space-y-4">
          {/* Add new category */}
          <Card>
            <CardHeader><CardTitle>Add Issue Category</CardTitle></CardHeader>
            <CardContent>
              <form
                className="flex flex-wrap gap-3 items-end"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newCatName.trim() || !user) return;
                  try {
                    await apiFetch("/categories", user.token, {
                      method: "POST",
                      body: JSON.stringify({
                        name: newCatName.trim(),
                        default_priority: newCatPriority,
                        sla_hours: newCatSla,
                      }),
                    });
                    toast.success("Category added.");
                    setNewCatName("");
                    load();
                  } catch (err) { showApiError(err); }
                }}
              >
                <div className="space-y-1">
                  <label className="text-xs font-medium">Name</label>
                  <Input
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="e.g. Broken Bench"
                    className="w-44"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Priority</label>
                  <Select value={newCatPriority} onValueChange={setNewCatPriority}>
                    <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">SLA (hours)</label>
                  <Input
                    type="number" min={1} value={newCatSla}
                    onChange={(e) => setNewCatSla(Number(e.target.value))}
                    className="w-24"
                  />
                </div>
                <Button type="submit" disabled={!newCatName.trim()}>Add Category</Button>
              </form>
            </CardContent>
          </Card>

          {/* Category list */}
          <Card>
            <CardHeader><CardTitle>Issue Categories ({categories.length})</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>SLA</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">No categories.</TableCell></TableRow>
                  )}
                  {categories.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${PRIORITY_COLOR[c.default_priority] ?? ""}`}>
                          {c.default_priority}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.sla_hours}h</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost" size="sm"
                          className="text-red-500 hover:text-red-700 h-7"
                          onClick={async () => {
                            if (!user) return;
                            if (!window.confirm(`Delete category "${c.name}"?`)) return;
                            try {
                              await apiFetch(`/categories/${c.id}`, user.token, { method: "DELETE" });
                              toast.success("Category deleted.");
                              load();
                            } catch (err) { showApiError(err); }
                          }}
                        >Delete</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}

function StatCard({ label, value, bg }: { label: string; value: number; bg: string }) {
  return (
    <Card className={`${bg} text-white`}>
      <CardContent className="p-4">
        <div className="text-3xl font-bold">{value}</div>
        <div className="text-sm opacity-90">{label}</div>
      </CardContent>
    </Card>
  );
}
