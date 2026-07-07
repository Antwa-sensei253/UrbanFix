import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  MapPin,
  LayoutGrid,
  BarChart3,
  Users,
  Settings,
  HelpCircle,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  Languages,
  LogOut,
  UserCircle2,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationBell } from "@/components/notification-bell";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { roleLabel, type BackendRole } from "@/lib/api";

type RoleId = "citizen" | "technician" | "manager" | "governor";

const BACKEND_TO_ROLE: Record<BackendRole, RoleId> = {
  Citizen: "citizen",
  Technician: "technician",
  DistrictManager: "manager",
  Governor: "governor",
};

type Role = {
  id: RoleId;
  to: string;
  icon: typeof MapPin;
  tKey: "nav.citizen" | "nav.technician" | "nav.manager" | "nav.governor";
};

const ROLES: Role[] = [
  { id: "citizen", to: "/reports", icon: Users, tKey: "nav.citizen" },
  { id: "technician", to: "/technician", icon: LayoutGrid, tKey: "nav.technician" },
  { id: "manager", to: "/manager", icon: ClipboardList, tKey: "nav.manager" },
  { id: "governor", to: "/governor", icon: BarChart3, tKey: "nav.governor" },
];

const ROLE_PILL: Record<RoleId, string> = {
  citizen: "bg-blue-50 text-blue-700 border-blue-200",
  technician: "bg-violet-50 text-violet-700 border-violet-200",
  manager: "bg-amber-50 text-amber-800 border-amber-200",
  governor: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

function LanguageToggle() {
  const { lang, toggle } = useI18n();
  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-secondary"
      aria-label="Toggle language"
    >
      <Languages className="size-3.5 text-muted-foreground" />
      <span className={cn(lang === "en" && "text-primary")}>EN</span>
      <span className="text-border">/</span>
      <span className={cn(lang === "ar" && "text-primary")}>AR</span>
    </button>
  );
}

function UserMenu({ role }: { role: RoleId }) {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const initials = (user?.full_name ?? "??")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex h-8 items-center gap-2 rounded-md border border-border bg-card pl-1 pr-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary">
        <span className="flex size-6 items-center justify-center rounded-[5px] bg-primary text-[10px] font-bold text-primary-foreground">
          {initials}
        </span>
        <span className="hidden sm:inline">{user?.full_name ?? "Guest"}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex items-center justify-between gap-2">
          <span className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">
              {user?.full_name ?? "Guest"}
            </span>
            <span className="text-xs font-normal text-muted-foreground">
              ID #{user?.user_id ?? "—"}
            </span>
          </span>
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold",
              ROLE_PILL[role],
            )}
          >
            {user ? roleLabel(user.role) : ""}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <UserCircle2 className="size-4" />
          {t("nav.profile")}
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className="size-4" />
          {t("nav.settings")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-600 focus:text-red-700"
          onClick={() => {
            logout();
            navigate({ to: "/login" });
          }}
        >
          <LogOut className="size-4" />
          {t("nav.signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppShell({
  children,
  title,
  actions,
  role,
}: {
  children: ReactNode;
  title?: string;
  actions?: ReactNode;
  role?: RoleId;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuth();
  const { t } = useI18n();

  const inferredRole: RoleId =
    role ??
    (user ? BACKEND_TO_ROLE[user.role] : null) ??
    (pathname.startsWith("/technician")
      ? "technician"
      : pathname.startsWith("/manager")
        ? "manager"
        : pathname.startsWith("/governor")
          ? "governor"
          : "citizen");

  const showBell = inferredRole === "citizen" || inferredRole === "technician";

  return (
    <div className="flex h-screen w-full bg-canvas">
      <aside
        className={cn(
          "hidden shrink-0 flex-col border-r border-border bg-card transition-[width] md:flex",
          collapsed ? "w-[60px]" : "w-[232px]",
        )}
      >
        <div className="flex h-14 items-center gap-2 border-b border-border px-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <MapPin className="size-3.5" />
            </span>
            {!collapsed && (
              <span className="text-sm font-semibold tracking-tight text-foreground">
                UrbanFix
              </span>
            )}
          </Link>
        </div>

        <nav className="flex-1 space-y-0.5 px-2 py-2 pt-4">
          {ROLES.filter((r) => r.id === inferredRole).map((r) => {
            const active = pathname.startsWith(r.to);
            const Icon = r.icon;
            const label = t(r.tKey);
            return (
              <Link
                key={r.id}
                to={r.to}
                className={cn(
                  "group flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
                title={collapsed ? label : undefined}
              >
                <Icon className={cn("size-4 shrink-0", active && "text-primary")} />
                {!collapsed && <span className="flex-1 truncate">{label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-0.5 border-t border-border px-2 py-2">
          {[
            { name: t("nav.settings"), icon: Settings },
            { name: t("nav.help"), icon: HelpCircle },
          ].map((i) => {
            const Icon = i.icon;
            return (
              <button
                key={i.name}
                className="flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                title={collapsed ? i.name : undefined}
              >
                <Icon className="size-4 shrink-0" />
                {!collapsed && <span className="truncate">{i.name}</span>}
              </button>
            );
          })}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            {collapsed ? (
              <ChevronsRight className="size-4" />
            ) : (
              <>
                <ChevronsLeft className="size-4 shrink-0" />
                <span>{t("nav.collapse")}</span>
              </>
            )}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-5">
          <div className="flex min-w-0 items-center gap-3">
            {title && (
              <h1 className="truncate text-[15px] font-semibold tracking-tight text-foreground">
                {title}
              </h1>
            )}
          </div>
          <div className="flex items-center gap-2">
            {actions}
            <LanguageToggle />
            {showBell && <NotificationBell />}
            <UserMenu role={inferredRole} />
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
