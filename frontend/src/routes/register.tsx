import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { api, type BackendRole } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create account — UrbanFix" },
      {
        name: "description",
        content: "Create your UrbanFix account with your National ID and start reporting city issues.",
      },
    ],
  }),
  component: RegisterPage,
});

const ROLES: { value: BackendRole; label: string }[] = [
  { value: "Citizen", label: "Citizen" },
  { value: "Technician", label: "Technician" },
  { value: "DistrictManager", label: "District Manager" },
  { value: "Governor", label: "Governor" },
];

function RegisterPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const districtsQuery = useQuery({
    queryKey: ["districts"],
    queryFn: () => api.auth.districts(),
  });
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [districtId, setDistrictId] = useState<string>("");
  const [role, setRole] = useState<BackendRole>("Citizen");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !nationalId.trim() || !email.trim() || !password) {
      setError("All fields are required.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    try {
      await api.auth.register({
        full_name: name.trim(),
        national_id: nationalId.trim(),
        password,
        email: email.trim(),
        role,
        district_id: districtId ? Number(districtId) : null,
      });
      navigate({
        to: "/verify-otp",
        search: { national_id: nationalId.trim() } as never,
      });
    } catch (err) {
      setError((err as Error).message || "Couldn't create your account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title={t("reg_title")}
      description={t("reg_sub")}
      footer={
        <>
          {t("reg_already")}{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            {t("reg_signin")}
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <div className="space-y-1.5">
          <Label htmlFor="name">{t("reg_fullname")}</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Citizen"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">{t("reg_email")}</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nationalId">{t("reg_nationalid")}</Label>
          <Input
            id="nationalId"
            inputMode="numeric"
            value={nationalId}
            onChange={(e) => setNationalId(e.target.value)}
            placeholder="e.g. 1990-2031-7745"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="role">{t("reg_role")}</Label>
            <Select value={role} onValueChange={(v) => setRole(v as BackendRole)}>
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="district">{t("reg_district")}</Label>
            <Select value={districtId} onValueChange={setDistrictId}>
              <SelectTrigger id="district">
                <SelectValue
                  placeholder={
                    districtsQuery.isLoading ? "Loading…" : "Select district"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {(districtsQuery.data ?? []).map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">{t("reg_password")}</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:bg-secondary hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm">{t("reg_confirm")}</Label>
          <Input
            id="confirm"
            type={showPassword ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Re-enter password"
          />
        </div>
        <Button type="submit" className="h-11 w-full" disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : t("reg_btn")}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          {t("reg_terms")}{" "}
          <a href="#" className="text-foreground hover:underline">
            {t("reg_terms_link")}
          </a>{" "}
          and{" "}
          <a href="#" className="text-foreground hover:underline">
            {t("reg_privacy_link")}
          </a>
          .
        </p>
      </form>
    </AuthShell>
  );
}
