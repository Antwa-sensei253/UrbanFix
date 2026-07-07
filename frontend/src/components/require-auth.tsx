import { useEffect } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { rolePath, type BackendRole } from "@/lib/api";

interface Props {
  roles?: BackendRole[];
  children: React.ReactNode;
}

/**
 * Client-side route guard. Redirects unauthenticated users to /login and
 * users with the wrong role to their own dashboard. Keeps everything inside
 * React Context so we don't have to plumb auth into beforeLoad.
 */
export function RequireAuth({ roles, children }: Props) {
  const { isAuthenticated, loading, user } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const wrongRole = !!roles && !!user && !roles.includes(user.role);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      navigate({ to: "/login", search: { redirect: pathname } as never });
      return;
    }
    if (wrongRole && user) {
      navigate({ to: rolePath(user.role) });
    }
  }, [loading, isAuthenticated, wrongRole, user, navigate, pathname]);

  if (loading || !isAuthenticated || wrongRole) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-canvas">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  return <>{children}</>;
}
