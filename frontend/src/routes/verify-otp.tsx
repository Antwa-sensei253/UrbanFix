import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

export const Route = createFileRoute("/verify-otp")({
  head: () => ({
    meta: [
      { title: "Verify your account — UrbanFix" },
      {
        name: "description",
        content: "Enter the 6-digit code we sent to finish creating your UrbanFix account.",
      },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    national_id: typeof search.national_id === "string" ? search.national_id : "",
  }),
  component: VerifyOtpPage,
});

function VerifyOtpPage() {
  const navigate = useNavigate();
  const { national_id: preset } = Route.useSearch();
  const [nationalId, setNationalId] = useState(preset ?? "");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [resendTick, setResendTick] = useState(0);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft, resendTick]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!nationalId.trim()) {
      setError("Enter your National ID.");
      return;
    }
    if (code.length !== 6) {
      setError("Please enter the full 6-digit code.");
      return;
    }
    setLoading(true);
    try {
      await api.auth.verifyOtp({ national_id: nationalId.trim(), otp: code });
      setSuccess(true);
      setTimeout(() => navigate({ to: "/login" }), 800);
    } catch (err) {
      setError((err as Error).message || "Verification failed.");
    } finally {
      setLoading(false);
    }
  }

  function resend() {
    setError(null);
    setCode("");
    setSecondsLeft(60);
    setResendTick((n) => n + 1);
  }

  return (
    <AuthShell
      title="Verify your account"
      description="Enter the 6-digit code we sent to the contact linked to your National ID."
      footer={
        <>
          Wrong details?{" "}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Go back
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-6">
        {success ? (
          <Alert className="border-success/30 bg-success/10">
            <CheckCircle2 className="size-4 text-success" />
            <AlertDescription>Verified! Redirecting…</AlertDescription>
          </Alert>
        ) : error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-1.5">
          <Label htmlFor="nationalId">National ID</Label>
          <Input
            id="nationalId"
            inputMode="numeric"
            value={nationalId}
            onChange={(e) => setNationalId(e.target.value)}
            placeholder="e.g. 1990-2031-7745"
          />
        </div>

        <div className="flex justify-center">
          <InputOTP maxLength={6} value={code} onChange={setCode}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <Button type="submit" className="h-11 w-full" disabled={loading || success}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : "Verify and continue"}
        </Button>

        <div className="text-center text-sm text-muted-foreground">
          Didn't get a code?{" "}
          {secondsLeft > 0 ? (
            <span>Resend in {secondsLeft}s</span>
          ) : (
            <button
              type="button"
              onClick={resend}
              className="font-medium text-primary hover:underline"
            >
              Resend code
            </button>
          )}
        </div>
      </form>
    </AuthShell>
  );
}
