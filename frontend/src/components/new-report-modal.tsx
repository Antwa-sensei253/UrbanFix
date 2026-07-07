import * as React from "react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Camera, Link2, Loader2, LocateFixed, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useIsMobile } from "@/hooks/use-mobile";
import { api, ApiError, type CategoryData } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MapPreview = React.lazy(() => import("@/components/MapPreview"));

type Urgency = "Low" | "Medium" | "High" | "Critical";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: () => void;
}

export function NewReportModal(props: Props) {
  const isMobile = useIsMobile();
  const Inner = (
    <ReportForm
      onClose={() => props.onOpenChange(false)}
      onCreated={props.onCreated}
    />
  );
  if (isMobile) {
    return (
      <Drawer open={props.open} onOpenChange={props.onOpenChange}>
        <DrawerContent className="bg-card">
          <DrawerHeader className="border-b border-border text-left">
            <DrawerTitle>New report</DrawerTitle>
          </DrawerHeader>
          <div className="max-h-[80vh] overflow-y-auto p-5">{Inner}</div>
        </DrawerContent>
      </Drawer>
    );
  }
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto bg-card sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New report</DialogTitle>
        </DialogHeader>
        {Inner}
      </DialogContent>
    </Dialog>
  );
}

const URGENCIES: { value: Urgency; label: string }[] = [
  { value: "Low", label: "Low" },
  { value: "Medium", label: "Medium" },
  { value: "High", label: "High" },
  { value: "Critical", label: "Critical" },
];

function ReportForm({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated?: () => void;
}) {
  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.categories.all(),
  });
  const categories: CategoryData[] = categoriesQuery.data ?? [];

  const [category, setCategory] = useState<string>("");
  const [urgency, setUrgency] = useState<Urgency>("Medium");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [photoTab, setPhotoTab] = useState<"upload" | "url">("upload");
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [gpsBusy, setGpsBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [conflict, setConflict] = useState<string | null>(null);

  const selectedSla = categories.find((c) => c.name === category)?.sla_hours;

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setErrors((p) => ({ ...p, photo: "Image must be under 8 MB." }));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPhotoPreview(result);
      setPhotoBase64(result.split(",")[1] ?? null);
    };
    reader.readAsDataURL(file);
    setErrors((p) => ({ ...p, photo: "" }));
  }

  function useGps() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setErrors((p) => ({ ...p, address: "GPS is not available on this device." }));
      return;
    }
    setGpsBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsBusy(false);
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setAddress(
          `Lat ${pos.coords.latitude.toFixed(5)}, Lng ${pos.coords.longitude.toFixed(5)}`,
        );
        setErrors((p) => ({ ...p, address: "" }));
      },
      (err) => {
        setGpsBusy(false);
        const permDenied = err.code === err.PERMISSION_DENIED;
        setErrors((p) => ({
          ...p,
          address: permDenied
            ? "Location access denied. Allow it in your browser settings or type an address."
            : "Couldn't read your location. Type an address instead.",
        }));
      },
      { timeout: 6000 },
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!category) next.category = "Pick a category.";
    if (!address.trim() && !coords) next.address = "Add an address or use GPS.";
    if (!description.trim()) next.description = "Briefly describe the issue.";
    if (photoTab === "url" && photoUrl && !/^https?:\/\//i.test(photoUrl)) {
      next.photo = "Photo URL must start with http(s)://";
    }
    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      const created = await api.reports.create({
        category,
        urgency,
        address_description: address.trim() || undefined,
        latitude: coords?.lat,
        longitude: coords?.lng,
        photo_url: photoTab === "url" && photoUrl ? photoUrl : undefined,
        photo_base64:
          photoTab === "upload" && photoBase64 ? photoBase64 : undefined,
        description,
      });
      toast.success("Report submitted", {
        description: `Filed as #${created.id}. Your city team has been notified.`,
      });
      onCreated?.();
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        let dupId = "?";
        if (err.body && typeof err.body === "object" && "duplicate_id" in err.body) {
          const v = (err.body as { duplicate_id?: unknown }).duplicate_id;
          if (v != null) dupId = String(v);
        }
        setConflict(dupId);
      } else {
        toast.error("Couldn't submit report", {
          description: (err as Error).message,
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <form onSubmit={submit} className="relative space-y-5">
        {submitting ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-lg bg-card/85 backdrop-blur-sm">
            <Loader2 className="size-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Submitting your report…</p>
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue placeholder={categoriesQuery.isLoading ? "Loading…" : "Select category"} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.name}>
                    {c.name}
                    <span className="ml-2 text-xs text-muted-foreground">
                      · SLA {c.sla_hours}h
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedSla !== undefined && (
              <p className="text-[11px] text-muted-foreground">
                Response target: <span className="font-semibold">{selectedSla}h</span>
              </p>
            )}
            {errors.category ? (
              <p className="text-xs text-destructive">{errors.category}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label>Urgency</Label>
            <div className="grid grid-cols-4 gap-1 rounded-md border border-border bg-secondary p-0.5">
              {URGENCIES.map((u) => (
                <button
                  type="button"
                  key={u.value}
                  onClick={() => setUrgency(u.value)}
                  className={cn(
                    "rounded px-2 py-1.5 text-xs font-medium transition-colors",
                    urgency === u.value
                      ? "bg-card text-foreground shadow-elevated"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {u.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Photo</Label>
          <Tabs value={photoTab} onValueChange={(v) => setPhotoTab(v as "upload" | "url")}>
            <TabsList className="grid w-full grid-cols-2 bg-secondary">
              <TabsTrigger value="upload" className="gap-1.5">
                <Upload className="size-3.5" /> Upload file
              </TabsTrigger>
              <TabsTrigger value="url" className="gap-1.5">
                <Link2 className="size-3.5" /> Paste URL
              </TabsTrigger>
            </TabsList>
            <TabsContent value="upload" className="mt-3">
              {photoPreview ? (
                <div className="relative overflow-hidden rounded-lg border border-border">
                  <img src={photoPreview} alt="" className="h-40 w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoPreview(null);
                      setPhotoBase64(null);
                    }}
                    className="absolute right-2 top-2 inline-flex size-7 items-center justify-center rounded-full bg-card/90 hover:bg-card"
                    aria-label="Remove photo"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground hover:border-foreground/30">
                  <Upload className="size-5" />
                  <span>Tap to upload or take a photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFile}
                  />
                  <span className="text-[11px]">JPG, PNG — up to 8 MB</span>
                </label>
              )}
            </TabsContent>
            <TabsContent value="url" className="mt-3 space-y-2">
              <Input
                type="url"
                placeholder="https://…"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
              />
              {photoUrl && /^https?:\/\//i.test(photoUrl) ? (
                <div className="overflow-hidden rounded-lg border border-border">
                  <img
                    src={photoUrl}
                    alt=""
                    className="h-40 w-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              ) : null}
            </TabsContent>
          </Tabs>
          {errors.photo ? (
            <Alert variant="destructive">
              <AlertDescription>{errors.photo}</AlertDescription>
            </Alert>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="address">Address</Label>
          <div className="flex gap-2">
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 5th Ave & Pine St"
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={useGps}
              disabled={gpsBusy}
              className="shrink-0 gap-1.5"
            >
              {gpsBusy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <LocateFixed className="size-4" />
              )}
              Use GPS
            </Button>
          </div>
          {errors.address ? (
            <p className="text-xs text-destructive">{errors.address}</p>
          ) : null}
          {coords ? (
            <React.Suspense fallback={<div className="mt-2 h-32 w-full animate-pulse bg-muted rounded-md" />}>
              <MapPreview lat={coords.lat} lng={coords.lng} height="h-48" />
            </React.Suspense>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what you see, hazards, time of day…"
            maxLength={500}
          />
          {errors.description ? (
            <p className="text-xs text-destructive">{errors.description}</p>
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting} className="gap-2">
            <Camera className="size-4" />
            Submit report
          </Button>
        </div>
      </form>

      <Dialog open={!!conflict} onOpenChange={(v) => !v && setConflict(null)}>
        <DialogContent className="bg-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Already reported nearby</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This issue has already been reported (
            <span className="font-mono font-semibold text-foreground">#{conflict}</span>
            ). Track the existing report instead?
          </p>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setConflict(null)}>
              No, submit anyway
            </Button>
            <Button
              onClick={() => {
                setConflict(null);
                toast.success(`Following #${conflict}`);
                onClose();
              }}
            >
              Yes, track it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
