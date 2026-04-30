import * as React from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch } from "@/lib/auth";
import { Spinner } from "@/components/Spinner";
import { toast } from "sonner";
import { ArrowLeft, CreditCard } from "lucide-react";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

type Role = "Citizen" | "DistrictManager" | "Technician";

function RegisterPage() {
  const navigate = useNavigate();
  const t = useT();

  // Step 1 fields
  const [fullName, setFullName] = React.useState("");
  const [nationalId, setNationalId] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<Role>("Citizen");
  const [districtId, setDistrictId] = React.useState<string>("");
  const [districts, setDistricts] = React.useState<{id: number, name: string}[]>([]);

  // Step 2 fields
  const [otp, setOtp] = React.useState("");

  const [step, setStep] = React.useState<1 | 2>(1);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    apiFetch("/auth/districts", undefined)
      .then((data) => setDistricts(Array.isArray(data) ? data : data.districts ?? []))
      .catch((e) => console.error("Failed to load districts", e));
  }, []);

  const idLabel = role === "Citizen" ? "National ID" : "Employee ID";

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (!fullName || !nationalId || !password || !email || !districtId) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await apiFetch("/auth/register", undefined, {
        method: "POST",
        body: JSON.stringify({
          full_name: fullName,
          national_id: nationalId,
          password,
          email,
          role,
          district_id: parseInt(districtId, 10),
        }),
      });
      setStep(2);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error("Please enter the 6-digit OTP.");
      return;
    }

    setLoading(true);
    try {
      await apiFetch("/auth/verify-otp", undefined, {
        method: "POST",
        body: JSON.stringify({ national_id: nationalId, otp }),
      });
      toast.success("Registration successful! Please log in.");
      navigate({ to: "/login" });
    } catch (err) {
      toast.error("Invalid OTP, please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 px-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          {/* Back link */}
          <Link
            to="/login"
            className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {t.login}
          </Link>

          {/* Logo */}
          <div className="mb-6 flex flex-col items-center">
            <Logo />
            <h1 className="text-xl font-bold mt-2">{t.register_title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t.register_subtitle}</p>
          </div>

          {step === 1 ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <Label htmlFor="fullName">{t.full_name}</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  autoComplete="name"
                  placeholder="Enter your full name"
                />
              </div>

              {/* Role */}
              <div className="space-y-1.5">
                <Label htmlFor="role">{t.role}</Label>
                <Select
                  value={role}
                  onValueChange={(v) => setRole(v as Role)}
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Citizen">{t.role_citizen}</SelectItem>
                    <SelectItem value="DistrictManager">{t.role_manager}</SelectItem>
                    <SelectItem value="Technician">{t.role_technician}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* District */}
              <div className="space-y-1.5">
                <Label htmlFor="district">{t.district}</Label>
                <Select
                  value={districtId}
                  onValueChange={setDistrictId}
                >
                  <SelectTrigger id="district">
                    <SelectValue placeholder="Select your district" />
                  </SelectTrigger>
                  <SelectContent>
                    {districts.length === 0 ? (
                      <SelectItem value="none" disabled>{t.no_districts}</SelectItem>
                    ) : (
                      districts.map(d => (
                        <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* National ID / Employee ID */}
              <div className="space-y-1.5">
                <Label htmlFor="id">{role === "Citizen" ? t.national_id : t.employee_id}</Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input 
                    id="id" 
                    className="pl-10" 
                    value={nationalId} 
                    onChange={(e) => setNationalId(e.target.value)} 
                    required 
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email">{t.email}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password">{t.password}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="Create a password"
                />
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">{t.confirm_password}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 text-white hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? <Spinner className="text-white" /> : "Send OTP"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <p className="text-center text-sm text-muted-foreground">
                An OTP has been sent to your email address. Please enter it below to
                complete your registration.
              </p>

              <div className="space-y-1.5">
                <Label htmlFor="otp">OTP Code</Label>
                <Input
                  id="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  required
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter 6-digit code"
                  className="text-center tracking-widest text-lg"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 text-white hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? <Spinner className="text-white" /> : "Verify OTP"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full text-sm text-muted-foreground"
                onClick={() => setStep(1)}
                disabled={loading}
              >
                Go back and edit details
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
