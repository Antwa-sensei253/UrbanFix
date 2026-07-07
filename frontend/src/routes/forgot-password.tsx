import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, Loader2 } from "lucide-react";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset password — UrbanFix" },
      { name: "description", content: "We'll send a reset link to your email so you can get back into UrbanFix." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email) {
      setError("Please enter the email on your account.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 600);
  }

  return (
    <AuthShell
      title="Reset your password"
      description="Enter your email and we'll send you a secure reset link."
      footer={
        <>
          Remembered it?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Back to sign in
          </Link>
        </>
      }
    >
      {sent ? (
        <Alert className="border-success/30 bg-success/10">
          <CheckCircle2 className="size-4 text-success" />
          <AlertDescription>
            If an account exists for <strong>{email}</strong>, a reset link is on its way.
            Check your inbox.
          </AlertDescription>
        </Alert>
      ) : (
        <form onSubmit={onSubmit} className="space-y-5">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
            />
          </div>
          <Button type="submit" className="h-11 w-full" disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : "Send reset link"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
