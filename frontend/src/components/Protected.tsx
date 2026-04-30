import * as React from "react";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useAuth, roleHome, type Role } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { CenterSpinner } from "@/components/Spinner";
import { NotificationBell } from "@/components/NotificationBell";

interface ProtectedProps {
  allow: Role;
  showBell?: boolean;
  children: React.ReactNode;
}

export function Protected({ allow, showBell, children }: ProtectedProps) {
  const { user, hydrated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      navigate({ to: "/login" });
    } else if (user.role !== allow) {
      navigate({ to: roleHome(user.role) });
    }
  }, [hydrated, user, allow, navigate]);

  if (!hydrated || !user || user.role !== allow) {
    return <CenterSpinner />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Navbar rightSlot={showBell ? <NotificationBell /> : null} />
      <motion.main
        key={location.pathname}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="mx-auto max-w-7xl px-4 py-8"
      >
        {children}
      </motion.main>
    </div>
  );
}
