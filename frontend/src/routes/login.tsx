import * as React from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { apiFetch, useAuth, roleHome, type Role } from "@/lib/auth";
import { Spinner } from "@/components/Spinner";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { user, login, hydrated } = useAuth();
  const navigate = useNavigate();
  const t = useT();
  const [nationalId, setNationalId] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (hydrated && user) navigate({ to: roleHome(user.role) });
  }, [hydrated, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await apiFetch("/auth/login", undefined, {
        method: "POST",
        body: JSON.stringify({ national_id: nationalId, password }),
      });
      const role = (data.role ?? data.user?.role) as Role;
      const u = {
        token: data.token ?? data.access_token,
        role,
        user_id: data.user_id ?? data.user?.id ?? data.id,
        full_name: data.full_name ?? data.user?.full_name ?? data.name ?? "User",
      };
      if (!u.token || !u.role) throw new Error("Invalid login response");
      login(u);
      navigate({ to: roleHome(u.role) });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-50 via-slate-50 to-indigo-50 px-4 overflow-hidden dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      {/* Decorative Blur Blobs */}
      <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl dark:bg-blue-600/20" />
      <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-indigo-400/20 blur-3xl dark:bg-indigo-600/20" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md z-10"
      >
        <Card className="w-full shadow-2xl border-white/40 bg-white/70 backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-900/70">
          <CardContent className="p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-8 flex flex-col items-center gap-2"
            >
              <Logo />
              <h1 className="text-2xl font-bold mt-2 text-slate-800 dark:text-slate-100">{t.login_title}</h1>
              <p className="text-sm text-slate-500 text-center">{t.login_subtitle}</p>
            </motion.div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="nid" className="text-slate-700 dark:text-slate-300">{t.national_id}</Label>
                <Input
                  id="nid"
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  required
                  autoComplete="username"
                  className="bg-white/50 dark:bg-slate-950/50 focus:bg-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pwd" className="text-slate-700 dark:text-slate-300">{t.password}</Label>
                <Input
                  id="pwd"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="bg-white/50 dark:bg-slate-950/50 focus:bg-white"
                />
              </div>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="rounded-md border border-red-200 bg-red-50/80 px-3 py-2 text-sm text-red-700 backdrop-blur-sm"
                >
                  {error}
                </motion.div>
              )}
              <Button
                type="submit"
                className="w-full bg-blue-600 text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg active:scale-[0.98] h-11"
                disabled={loading}
              >
                {loading ? <Spinner className="text-white" /> : t.login}
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-slate-500">
              {t.no_account}{" "}
              <Link to="/register" className="font-semibold text-blue-600 transition-colors hover:text-blue-800 hover:underline">
                {t.register}
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
