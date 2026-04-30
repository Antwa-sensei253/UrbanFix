import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Protected } from "@/components/Protected";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge, UrgencyBadge } from "@/components/StatusBadge";
import { CenterSpinner } from "@/components/Spinner";
import { apiFetch, useAuth } from "@/lib/auth";
import { showApiError } from "@/components/NotificationBell";
import { Plus, MapPin, Inbox, Loader2, Heart } from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import { motion } from "framer-motion";

const MapPreview = React.lazy(() => import("@/components/MapPreview"));

export const Route = createFileRoute("/citizen")({
  component: () => (
    <Protected allow="Citizen" showBell>
      <CitizenPage />
    </Protected>
  ),
});

interface Report {
  id: number | string;
  category: string;
  urgency: string;
  status: string;
  address_description?: string;
  description?: string;
  photo_url?: string | null;
  created_at?: string;
  latitude?: number;
  longitude?: number;
}

const URGENCIES = ["Low", "Medium", "High", "Critical"];

interface CategoryInfo { id: number; name: string; default_priority: string; sla_hours: number; }

function CitizenPage() {
  const { user } = useAuth();
  const t = useT();
  const [reports, setReports] = React.useState<Report[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);

  // Community Feed state
  const [community, setCommunity] = React.useState<any[]>([]);
  const [communityLoading, setCommunityLoading] = React.useState(false);
  const [upvoting, setUpvoting] = React.useState<number | null>(null);

  const load = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await apiFetch("/reports/mine", user.token);
      setReports(Array.isArray(data) ? data : (data?.reports ?? []));
    } catch (e) {
      showApiError(e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadCommunity = React.useCallback(async () => {
    if (!user) return;
    setCommunityLoading(true);
    try {
      const data = await apiFetch("/reports/community", user.token);
      setCommunity(Array.isArray(data) ? data : []);
    } catch (e) {
      showApiError(e);
    } finally {
      setCommunityLoading(false);
    }
  }, [user]);

  const handleUpvote = async (reportId: number) => {
    if (!user || upvoting === reportId) return;
    setUpvoting(reportId);
    try {
      const res = await apiFetch(`/reports/${reportId}/upvote`, user.token, { method: "POST" });
      setCommunity(prev => prev.map(r =>
        r.id === reportId
          ? { ...r, upvote_count: res.upvote_count, has_upvoted: res.has_upvoted }
          : r
      ));
    } catch (e) {
      showApiError(e);
    } finally {
      setUpvoting(null);
    }
  };

  React.useEffect(() => { load(); loadCommunity(); }, [load, loadCommunity]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {user?.full_name}</h1>
          <p className="text-sm text-muted-foreground">Track and report issues in your area.</p>
        </div>
      </div>

      <Tabs defaultValue="my" onValueChange={(v) => v === "community" && loadCommunity()}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="my">{t.my_reports}</TabsTrigger>
            <TabsTrigger value="community">{t.community_feed}</TabsTrigger>
          </TabsList>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow font-semibold">
                <Plus className="mr-2 h-4 w-4" />
                {t.add_report}
              </Button>
            </DialogTrigger>
            <ReportDialog onSuccess={() => { setOpen(false); load(); }} />
          </Dialog>
        </div>

        {/* ── My Reports Tab ── */}
        <TabsContent value="my" className="mt-3">
          {loading ? (
            <CenterSpinner />
          ) : reports.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 p-10 text-center text-muted-foreground">
                <Inbox className="h-10 w-10 opacity-50" />
                <p>{t.no_reports}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {reports.map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                >
                  <Card className="h-full transition-all hover:shadow-lg hover:-translate-y-1 dark:hover:shadow-blue-900/20 border-white/40 dark:border-slate-800/60 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm">
                    <CardContent className="space-y-3 p-5 flex flex-col h-full">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold">{r.category}</h3>
                        <UrgencyBadge urgency={r.urgency} />
                      </div>
                      {r.address_description && (
                        <div className="flex items-start gap-1 text-sm text-muted-foreground">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                          <span>{r.address_description}</span>
                        </div>
                      )}
                      {r.created_at && (
                        <div className="text-xs text-muted-foreground">
                          {new Date(r.created_at).toLocaleString()}
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-2 pt-2 border-t text-sm">
                        <StatusBadge status={r.status} />
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-600 hover:text-blue-800">
                                {t.details}
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                              <DialogHeader><DialogTitle>{t.details}</DialogTitle></DialogHeader>
                              <div className="space-y-4 pb-2 text-sm text-muted-foreground w-full break-words max-h-[80vh] overflow-y-auto">
                                <div className="space-y-1">
                                  <p><strong className="text-foreground">{t.category}:</strong> {r.category}</p>
                                  <p><strong className="text-foreground">{t.description}:</strong> {r.description || "-"}</p>
                                  <p><strong className="text-foreground">{t.status}:</strong> <span className="inline-block"><StatusBadge status={r.status} /></span></p>
                                </div>
                                {r.photo_url && (
                                  <div className="text-center">
                                    <img src={r.photo_url} alt="Report" className="w-full max-h-48 rounded object-cover mx-auto shadow-sm" />
                                  </div>
                                )}
                                {r.latitude && r.longitude && (
                                  <div className="space-y-1">
                                    <strong className="text-foreground">{t.report_tracking}:</strong>
                                    <React.Suspense fallback={<div className="h-48 w-full animate-pulse bg-muted rounded-md" />}>
                                      {typeof window !== "undefined" && <MapPreview lat={r.latitude} lng={r.longitude} height="h-64" />}
                                    </React.Suspense>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Community Feed Tab ── */}
        <TabsContent value="community" className="mt-3">
          {communityLoading ? (
            <CenterSpinner />
          ) : community.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 p-10 text-center text-muted-foreground">
                <Inbox className="h-10 w-10 opacity-50" />
                <p>{t.be_first_report}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {community.map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                >
                  <Card className="h-full flex flex-col transition-all hover:shadow-lg hover:-translate-y-1 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border-white/40 dark:border-slate-800/60">
                    <CardContent className="p-5 flex flex-col gap-3 h-full">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold">{r.category}</h3>
                        <StatusBadge status={r.status} />
                      </div>
                      {r.address_description && (
                        <div className="flex items-start gap-1 text-sm text-muted-foreground">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                          <span>{r.address_description}</span>
                        </div>
                      )}
                      {r.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{r.description}</p>
                      )}
                      {r.photo_url && (
                        <img src={r.photo_url} alt={r.category} className="w-full h-32 rounded object-cover" />
                      )}
                      <div className="flex items-center justify-between mt-auto pt-2 border-t text-xs text-muted-foreground">
                        <span>{new Date(r.created_at).toLocaleDateString()}</span>
                        <button
                          onClick={() => handleUpvote(r.id)}
                          disabled={upvoting === r.id}
                          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${r.has_upvoted
                              ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-red-50 hover:text-red-500"
                            }`}
                        >
                          {upvoting === r.id
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <Heart className={`h-3.5 w-3.5 ${r.has_upvoted ? "fill-red-500" : ""}`} />
                          }
                          <span>{r.upvote_count} {t.upvotes}</span>
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}


function ReportDialog({ onSuccess }: { onSuccess: () => void }) {
  const { user } = useAuth();
  const t = useT();
  const [dynamicCategories, setDynamicCategories] = React.useState<CategoryInfo[]>([]);
  const [category, setCategory] = React.useState("");
  const [urgency, setUrgency] = React.useState(URGENCIES[1]);
  const [address, setAddress] = React.useState("");
  const [lat, setLat] = React.useState<number | null>(null);
  const [lng, setLng] = React.useState<number | null>(null);
  const [locLoading, setLocLoading] = React.useState(false);
  const [photoUrl, setPhotoUrl] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    apiFetch("/categories", undefined)
      .then((d) => {
        const cats = Array.isArray(d) ? d : [];
        setDynamicCategories(cats);
        if (cats.length > 0) setCategory(cats[0].name);
      })
      .catch(() => { });
  }, []);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setLocLoading(false);
        toast.success(t.gps_success);
      },
      (err) => {
        setLocLoading(false);
        toast.error(`${t.gps_error}: ${err.message}`);
      }
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t.image_size_error);
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setPhotoUrl(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!category || !urgency || !description.trim()) {
      toast.error("Category, Urgency, and Description are required.");
      return;
    }
    if (!photoUrl.trim()) {
      toast.error("Before Photo is required. Please provide a photo URL.");
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch("/reports", user.token, {
        method: "POST",
        body: JSON.stringify({
          category,
          urgency,
          address_description: address,
          latitude: lat ?? undefined,
          longitude: lng ?? undefined,
          photo_url: photoUrl || undefined,
          description,
        }),
      });
      toast.success(t.submitted_ok);
      onSuccess();
    } catch (e: any) {
      if (e?.status === 409 || (e?.message && e.message.includes("already been reported"))) {
        const existingId = e?.existing_id;
        const autoText = t.duplicate_warning + ` (${existingId ? `#${existingId}` : ""})`;
        const followInstead = window.confirm(autoText);
        if (followInstead) {
          toast.info("You can track the existing report in your dashboard.");
          onSuccess();
          return;
        }
        try {
          await apiFetch("/reports", user.token, {
            method: "POST",
            body: JSON.stringify({
              category,
              urgency,
              address_description: address,
              photo_url: photoUrl || undefined,
              description,
            }),
          });
          toast.success(t.submitted_ok);
          onSuccess();
        } catch (retryErr) {
          showApiError(retryErr);
        }
      } else {
        showApiError(e);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px] border-white/20 bg-white/90 backdrop-blur-xl dark:bg-slate-950/90 rounded-xl shadow-2xl">
      <DialogHeader>
        <DialogTitle className="text-xl font-bold">{t.report_issue}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-5 pt-2">
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold">{t.category}</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="bg-white/50 dark:bg-slate-900/50"><SelectValue placeholder={t.select_category} /></SelectTrigger>
            <SelectContent>
              {(dynamicCategories.length > 0 ? dynamicCategories : []).map((c) => (
                <SelectItem key={c.id} value={c.name}>
                  <div className="flex items-center justify-between w-full pr-4">
                    <span>{c.name}</span>
                    {c.sla_hours && <span className="ml-2 text-xs text-muted-foreground opacity-60">{t.sla}: {c.sla_hours}h</span>}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold">{t.urgency}</Label>
          <Select value={urgency} onValueChange={setUrgency}>
            <SelectTrigger className="bg-white/50 dark:bg-slate-900/50"><SelectValue /></SelectTrigger>
            <SelectContent>
              {URGENCIES.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold">{t.before_photo}</Label>
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-lg">
              <TabsTrigger value="upload" className="rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 shadow-sm transition-all">{t.upload_image}</TabsTrigger>
              <TabsTrigger value="url" className="rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 shadow-sm transition-all">{t.paste_url}</TabsTrigger>
            </TabsList>
            <TabsContent value="upload" className="pt-2">
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-1 file:text-sm file:font-semibold file:text-primary-foreground hover:file:bg-primary/90"
              />
              {photoUrl.startsWith("data:image/") && (
                <div className="mt-2 h-20 w-32 rounded border overflow-hidden">
                  <img src={photoUrl} className="h-full w-full object-cover" alt="Preview" />
                </div>
              )}
            </TabsContent>
            <TabsContent value="url" className="pt-2">
              <Input
                type="url"
                value={photoUrl.startsWith("http") ? photoUrl : ""}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://..."
              />
            </TabsContent>
          </Tabs>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="addr">{t.address_description}</Label>
          <div className="flex gap-2">
            <Input
              id="addr"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required={!(lat !== null && lng !== null)}
              placeholder={t.describe_location_placeholder}
            />
            <Button type="button" variant="outline" onClick={handleGetLocation} disabled={locLoading}>
              <MapPin className="mr-1 h-3 w-3" />
              {lat && lng ? t.update_gps : locLoading ? t.locating : t.use_gps}
            </Button>
          </div>
          {lat !== null && lng !== null && (
            <React.Suspense fallback={<div className="mt-2 h-32 w-full animate-pulse bg-muted rounded-md" />}>
              {typeof window !== "undefined" && <MapPreview lat={lat} lng={lng} height="h-64" />}
            </React.Suspense>
          )}
        </div>
        {user && (
          <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{t.contact}</span> {user.full_name}
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="desc">{t.description}</Label>
          <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} required placeholder={t.details_issue_placeholder} className="min-h-[80px]" />
        </div>
        <DialogFooter className="pt-2">
          <Button type="submit" disabled={submitting} className="w-full bg-blue-600 text-white hover:bg-blue-700">
            {submitting ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : t.submit_report}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
