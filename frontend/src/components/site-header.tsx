import { Link, useNavigate } from "@tanstack/react-router";
import { MapPin, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";
import { rolePath } from "@/lib/api";
import { LanguageToggle } from "@/components/language-toggle";

export function SiteHeader() {
  const { t, toggle, lang } = useI18n();
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <MapPin className="size-4" />
          </span>
          <span className="text-base font-semibold tracking-tight text-foreground">
            UrbanFix
          </span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          <Link
            to="/reports"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            {t("nav_community_map")}
          </Link>
          <Link
            to="/how-it-works"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            {t("nav_how_it_works")}
          </Link>
          <Link
            to="/for-cities"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            {t("nav_for_cities")}
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          {isAuthenticated && user ? (
            <>
              <Button asChild size="sm" className="gap-1.5 shadow-2xs font-medium">
                <Link to={rolePath(user.role)}>
                  <User className="size-3.5" />
                  <span>{user.full_name}</span>
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  logout();
                  navigate({ to: "/login" });
                }}
                title="Sign out / تسجيل خروج"
              >
                <LogOut className="size-4" />
                <span className="hidden sm:inline">{t("nav.signOut")}</span>
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">{t("nav_sign_in")}</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/register">{t("nav_get_started")}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
