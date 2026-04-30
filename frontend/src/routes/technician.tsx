import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Protected } from "@/components/Protected";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge, UrgencyBadge } from "@/components/StatusBadge";
import { CenterSpinner } from "@/components/Spinner";
import { apiFetch, useAuth } from "@/lib/auth";
import { showApiError } from "@/components/NotificationBell";
import { ExternalLink, MapPin, ClipboardList, Map as MapIcon, Loader2, Camera, CheckCircle2 } from "lucide-react";
import { useT } from "@/lib/i18n";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const MapPreview = React.lazy(() => import("@/components/MapPreview"));

export const Route = createFileRoute("/technician")({
  component: () => (
    <Protected allow="Technician" showBell>
      <TechnicianPage />
    </Protected>
  ),
});

interface Report {
  id: number | string;
  category: string;
  urgency: string;
  status: string;
  description?: string;
  address_description?: string;
  technician_id?: number | string | null;
  latitude?: number; longitude?: number; lat?: number; lng?: number;
}

function TechnicianPage() {
  const { user } = useAuth();
  const t = useT();
  const [reports, setReports] = React.useState<Report[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await apiFetch("/reports", user.token);
      const all: Report[] = Array.isArray(data) ? data : (data?.reports ?? []);
      const myId = parseInt(String(user.user_id), 10);
      setReports(all.filter((r) => parseInt(String(r.technician_id), 10) === myId));
    } catch (e) {
      showApiError(e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  React.useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: Report["id"], new_status: string, photo_url?: string) => {
    if (!user) return;
    try {
      await apiFetch(`/reports/${id}/status`, user.token, {
        method: "PATCH",
        body: JSON.stringify({ new_status, ...(photo_url ? { photo_url } : {}) }),
      });
      load();
    } catch (e) { showApiError(e); }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Tasks for {user?.full_name}</h1>
      {loading ? <CenterSpinner /> : reports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 p-10 text-center text-muted-foreground">
            <ClipboardList className="h-10 w-10 opacity-50" />
            <p>No tasks assigned yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {reports.map((r: Report) => {
            const lat = r.latitude ?? r.lat;
            const lng = r.longitude ?? r.lng;
            return (
              <Card key={r.id} className="transition-shadow hover:shadow-md">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-bold">{r.category}</h3>
                    <UrgencyBadge urgency={r.urgency} />
                  </div>
                  {r.address_description && (
                    <div className="flex items-start gap-1 text-sm text-muted-foreground">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0" /><span>{r.address_description}</span>
                    </div>
                  )}
                  {lat != null && lng != null && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <button className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
                          {t.view_location} <MapIcon className="h-3.5 w-3.5" />
                        </button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px] border-none p-0 overflow-hidden bg-transparent shadow-none">
                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border overflow-hidden">
                          <div className="p-4 border-b flex items-center justify-between">
                            <h2 className="font-bold text-lg flex items-center gap-2">
                              <MapIcon className="h-5 w-5 text-blue-600" />
                              {t.view_location}
                            </h2>
                            <DialogHeader className="hidden">
                              <DialogTitle>{t.view_location}</DialogTitle>
                            </DialogHeader>
                          </div>
                          <div className="h-[550px] w-full relative">
                            <React.Suspense fallback={
                              <div className="h-full w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 animate-pulse">
                                <CenterSpinner />
                              </div>
                            }>
                              {typeof window !== "undefined" && <MapPreview lat={lat} lng={lng} height="h-full" />}
                            </React.Suspense>
                          </div>
                          <div className="p-4 bg-slate-50 dark:bg-slate-950/50 text-xs text-muted-foreground flex items-center gap-2">
                            <MapPin className="h-3 w-3" />
                            {r.address_description || "Lat: " + lat + ", Lng: " + lng}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                  {r.description && <p className="text-sm">{r.description}</p>}
                  <div><StatusBadge status={r.status} /></div>
                  <div className="flex gap-2 pt-1">
                    {r.status === "Assigned" && (
                      <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700"
                        onClick={() => updateStatus(r.id, "InProgress")}>Start Work</Button>
                    )}
                    {r.status === "InProgress" && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" className="bg-green-600 text-white hover:bg-green-700">
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            {t.mark_resolved}
                          </Button>
                        </DialogTrigger>
                        <ResolveDialog 
                          report={r} 
                          onResolve={(url) => updateStatus(r.id, "Resolved", url)} 
                        />
                      </Dialog>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
function ResolveDialog({ report, onResolve }: { report: Report; onResolve: (url: string) => void }) {
  const t = useT();
  const [photoUrl, setPhotoUrl] = React.useState("");
  const [open, setOpen] = React.useState(true);

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

  return (
    <DialogContent className="sm:max-w-[450px]">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          {t.mark_resolved}
        </DialogTitle>
      </DialogHeader>
      
      <div className="space-y-4 py-4">
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {t.closure_photo}
        </label>
        
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">{t.upload_image}</TabsTrigger>
            <TabsTrigger value="url">{t.paste_url}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="space-y-3 pt-3">
            <Input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange}
              className="cursor-pointer"
            />
          </TabsContent>
          
          <TabsContent value="url" className="space-y-3 pt-3">
            <Input 
              type="url" 
              placeholder="https://..." 
              value={photoUrl.startsWith("http") ? photoUrl : ""}
              onChange={(e) => setPhotoUrl(e.target.value)}
            />
          </TabsContent>
        </Tabs>

        {photoUrl && (
          <div className="relative mt-2 rounded-lg border overflow-hidden aspect-video bg-muted flex items-center justify-center">
            <img src={photoUrl} alt="Preview" className="h-full w-full object-cover" />
          </div>
        )}
      </div>

      <DialogFooter>
        <Button 
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-11"
          disabled={!photoUrl}
          onClick={() => onResolve(photoUrl)}
        >
          {t.mark_resolved}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
