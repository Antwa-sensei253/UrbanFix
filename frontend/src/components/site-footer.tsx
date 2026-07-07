import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function SiteFooter() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row">
          <div className="max-w-sm">
            <Link to="/" className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <MapPin className="size-4" />
              </span>
              <span className="text-base font-semibold tracking-tight text-foreground">
                UrbanFix
              </span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">
              {t("footer_tagline")}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-12 text-sm sm:grid-cols-3">
            <div>
              <h4 className="font-medium text-foreground">{t("footer_product")}</h4>
              <ul className="mt-3 space-y-2 text-muted-foreground">
                <li><Link to="/reports" className="hover:text-foreground">{t("nav_community_map")}</Link></li>
                <li><Link to="/how-it-works" className="hover:text-foreground">{t("nav_how_it_works")}</Link></li>
                <li><Link to="/for-cities" className="hover:text-foreground">{t("nav_for_cities")}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-foreground">{t("footer_company")}</h4>
              <ul className="mt-3 space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">{t("footer_about")}</a></li>
                <li><a href="#" className="hover:text-foreground">{t("footer_careers")}</a></li>
                <li><a href="#" className="hover:text-foreground">{t("footer_contact")}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-foreground">{t("footer_legal")}</h4>
              <ul className="mt-3 space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">{t("footer_privacy")}</a></li>
                <li><a href="#" className="hover:text-foreground">{t("footer_terms")}</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-10 border-t border-border pt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} UrbanFix. {t("footer_rights")}
        </div>
      </div>
    </footer>
  );
}
