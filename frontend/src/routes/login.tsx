import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { rolePath } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — UrbanFix" },
      {
        name: "description",
        content: "Sign in with your National ID to access your UrbanFix dashboard.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuth();
  const { t } = useI18n();
  const [nationalId, setNationalId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Already signed in? Bounce to role's dashboard.
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate({ to: rolePath(user.role) });
    }
  }, [isAuthenticated, user, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!nationalId.trim() || !password) {
      setError("Please enter your National ID and password.");
      return;
    }
    setLoading(true);
    try {
      const u = await login({ national_id: nationalId.trim(), password });
      navigate({ to: rolePath(u.role) });
    } catch (err) {
      setError((err as Error).message || "Sign-in failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title={t("login_title")}
      description={t("login_sub")}
      footer={
        <>
          {t("login_no_account")}{" "}
          <Link to="/register" className="font-medium text-primary hover:underline">
            {t("login_create")}
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <div className="space-y-1.5">
          <Label htmlFor="nationalId">{t("login_national_id")}</Label>
          <Input
            id="nationalId"
            inputMode="numeric"
            autoComplete="username"
            placeholder="e.g. 1990-2031-7745"
            value={nationalId}
            onChange={(e) => setNationalId(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t("login_password")}</Label>
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-primary hover:underline"
            >
              {t("login_forgot")}
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
        <Button type="submit" className="h-11 w-full" disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : t("login_btn")}
        </Button>
        <div className="mt-4 rounded-lg bg-muted/50 p-4 text-xs">
          <p className="mb-2 font-semibold text-muted-foreground">{t("login_demo_title")}</p>
          <div className="flex flex-wrap gap-2">
            {[
              { role: "Citizen", id: "400400" },
              { role: "Technician", id: "300300" },
              { role: "Manager", id: "200200" },
              { role: "Governor", id: "100100" },
            ].map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => {
                  setNationalId(u.id);
                  setPassword("Pass123");
                }}
                className="rounded border border-border bg-card px-2 py-1 transition-colors hover:bg-secondary hover:text-foreground"
              >
                {u.role}
              </button>
            ))}
          </div>
        </div>
      </form>
    </AuthShell>
  );
}
