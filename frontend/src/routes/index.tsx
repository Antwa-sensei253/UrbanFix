import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth, roleHome } from "@/lib/auth";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { user, hydrated } = useAuth();
  if (!hydrated) return null;
  if (user) return <Navigate to={roleHome(user.role)} />;
  return <Navigate to="/login" />;
}
