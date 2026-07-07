import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, MapPin, ShieldCheck, Clock, Users, Camera, CheckCircle2, Loader2, TrendingUp, Bell, CheckCheck } from "lucide-react";
import { motion } from "framer-motion";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { api, type CommunityReportResponse } from "@/lib/api";

const HeatmapView = React.lazy(() => import("@/components/HeatmapView"));

const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } } };

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "UrbanFix — Report city issues, fixed faster." },
      {
        name: "description",
        content:
          "UrbanFix is the modern civic reporting platform. Drop a pin, snap a photo, and track repairs in your neighborhood.",
      },
      { property: "og:title", content: "UrbanFix — Report city issues, fixed faster." },
      {
        property: "og:description",
        content:
          "Drop a pin, snap a photo, and track municipal repairs across your city — built for citizens.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { t, dir } = useI18n();
  return (
    <div className="min-h-screen bg-canvas">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-50 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
        <div className="relative mx-auto max-w-6xl px-6 pt-20 pb-24 sm:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full hairline bg-card px-3 py-1 text-xs font-medium text-muted-foreground"
            >
              <span className="inline-block size-1.5 rounded-full bg-success animate-pulse" />
              {t("hero_badge")}
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="text-5xl font-semibold tracking-tight text-foreground sm:text-6xl lg:text-7xl"
            >
              {t("hero_headline_1")}{" "}
              <span className="relative whitespace-nowrap">
                <span className="relative z-10">{t("hero_headline_2")}</span>
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.55, duration: 0.6, ease: "easeOut" }}
                  style={{ transformOrigin: "left" }}
                  className="absolute inset-x-0 bottom-1 -z-0 h-3 bg-primary/15"
                />
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground"
            >
              {t("hero_sub")}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
            >
              <Button asChild size="lg" className="h-12 px-6 text-base group">
                <Link to="/reports">
                  {t("hero_cta_report")}
                  <ArrowRight className="ml-1.5 size-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-6 text-base">
                <Link to="/login">{t("hero_cta_signin")}</Link>
              </Button>
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="mt-4 text-xs text-muted-foreground"
            >
              {t("hero_disclaimer")}
            </motion.p>
          </div>

          {/* Hero device mock + side text */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.7, ease: "easeOut" }}
            className="relative mx-auto mt-16 max-w-6xl"
          >
            <div className="grid gap-8 lg:grid-cols-5 lg:items-center">
              {/* Side text panel — appears on opposite side from map (RTL-aware via flex order) */}
              <div className="flex flex-col gap-5 lg:col-span-2">
                <SideFeatureItem
                  icon={MapPin}
                  heading={dir === "rtl" ? "تتبع في الوقت الفعلي" : "Live on the map"}
                  body={dir === "rtl" ? "كل بلاغ يظهر فوراً على خريطة المجتمع بلون يعكس مستوى خطورته." : "Every report you submit appears instantly on the community map, colour-coded by urgency."}
                />
                <SideFeatureItem
                  icon={Bell}
                  heading={dir === "rtl" ? "إشعارات فورية" : "Instant notifications"}
                  body={dir === "rtl" ? "نُعلمك فور تغيُّر حالة بلاغك — من الإبلاغ حتى الإصلاح." : "Get notified the moment your report moves — from Reported to In Progress to Resolved."}
                />
                <SideFeatureItem
                  icon={CheckCheck}
                  heading={dir === "rtl" ? "دليل مصوّر على الإنجاز" : "Proof of completion"}
                  body={dir === "rtl" ? "يغلق الفنيون البلاغ بصورة توضح العمل المنجز. لا بيروقراطية." : "Technicians close every issue with a photo. No bureaucracy, no black boxes."}
                />
                <SideFeatureItem
                  icon={TrendingUp}
                  heading={dir === "rtl" ? "بيانات تُحاسب المدينة" : "Data that holds cities accountable"}
                  body={dir === "rtl" ? "كل إحصائية حقيقية. أوقات الاستجابة وأهداف الخدمة متاحة للجميع." : "Every stat is real. Response times and SLA targets are visible to everyone."}
                />
              </div>

              {/* Device mock — full-width live map */}
              <div className="lg:col-span-3">
                <div className="surface-card overflow-hidden shadow-pop">
                  <div className="flex items-center gap-1.5 border-b border-border bg-card px-4 py-3">
                    <span className="size-2.5 rounded-full bg-border" />
                    <span className="size-2.5 rounded-full bg-border" />
                    <span className="size-2.5 rounded-full bg-border" />
                    <span className="ms-3 text-xs text-muted-foreground">urbanfix.app/reports</span>
                  </div>
                  <React.Suspense fallback={
                    <div className="flex h-[280px] items-center justify-center bg-muted/30">
                      <Loader2 className="size-5 animate-spin text-muted-foreground" />
                    </div>
                  }>
                    <HeroMap />
                  </React.Suspense>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {t("feat_title")}
          </h2>
          <p className="mt-4 text-muted-foreground">
            {t("feat_sub")}
          </p>
        </motion.div>
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          className="mt-14 grid gap-4 md:grid-cols-3"
        >
          {[
            { i: Camera, t: t("feat_1_t"), d: t("feat_1_d") },
            { i: ShieldCheck, t: t("feat_2_t"), d: t("feat_2_d") },
            { i: Clock, t: t("feat_3_t"), d: t("feat_3_d") },
            { i: MapPin, t: t("feat_4_t"), d: t("feat_4_d") },
            { i: Users, t: t("feat_5_t"), d: t("feat_5_d") },
            { i: CheckCircle2, t: t("feat_6_t"), d: t("feat_6_d") },
          ].map((f) => (
            <motion.div
              key={f.t}
              variants={fadeUp}
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="surface-card p-6"
            >
              <div className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <f.i className="size-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-foreground">{f.t}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.d}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* STATS */}
      <section id="cities" className="border-t border-border bg-card">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          className="mx-auto grid max-w-6xl grid-cols-2 gap-px overflow-hidden bg-border md:grid-cols-4"
        >
          {[
            [t("stat_1_val"), t("stat_1_lbl")],
            [t("stat_2_val"), t("stat_2_lbl")],
            [t("stat_3_val"), t("stat_3_lbl")],
            [t("stat_4_val"), t("stat_4_lbl")],
          ].map(([n, l]) => (
            <motion.div key={l} variants={fadeUp} className="bg-card p-8 text-center">
              <div className="text-3xl font-semibold tracking-tight text-foreground">{n}</div>
              <div className="mt-1 text-sm text-muted-foreground">{l}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="surface-card flex flex-col items-center gap-6 p-12 text-center md:p-16"
        >
          <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {t("cta_title")}
          </h2>
          <p className="max-w-xl text-muted-foreground">
            {t("cta_sub")}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 px-6 text-base">
              <Link to="/register">{t("cta_btn_1")}</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-6 text-base bg-transparent hover:bg-muted/50">
              <Link to="/reports">{t("cta_btn_2")}</Link>
            </Button>
          </div>
        </motion.div>
      </section>

      <SiteFooter />
    </div>
  );
}


// Static demo pins shown even with no API data
const DUMMY_REPORTS = [
  { id: -1, latitude: 30.0444, longitude: 31.2357, urgency: "Critical", status: "Reported", category: "Road", description: "Pothole on main street", address_description: "Main St", created_at: new Date().toISOString(), is_public: true },
  { id: -2, latitude: 30.0520, longitude: 31.2280, urgency: "High", status: "InProgress", category: "Lighting", description: "Street light out", address_description: "Park Ave", created_at: new Date().toISOString(), is_public: true },
  { id: -3, latitude: 30.0380, longitude: 31.2450, urgency: "Medium", status: "Verified", category: "Sanitation", description: "Overflow bin", address_description: "River Rd", created_at: new Date().toISOString(), is_public: true },
  { id: -4, latitude: 30.0600, longitude: 31.2500, urgency: "Low", status: "Resolved", category: "Parks", description: "Broken bench", address_description: "Central Park", created_at: new Date().toISOString(), is_public: true },
  { id: -5, latitude: 30.0310, longitude: 31.2200, urgency: "Critical", status: "Assigned", category: "Road", description: "Cracked pavement", address_description: "West Blvd", created_at: new Date().toISOString(), is_public: true },
  { id: -6, latitude: 30.0490, longitude: 31.2620, urgency: "High", status: "Reported", category: "Water", description: "Water main leak", address_description: "East St", created_at: new Date().toISOString(), is_public: true },
];

function HeroMap() {
  const [reports, setReports] = React.useState<CommunityReportResponse[]>([]);
  React.useEffect(() => {
    api.reports.community().then(setReports).catch(() => {});
  }, []);

  // Merge real + dummy; if real data has valid coords, prefer it — otherwise use dummies
  const realValid = reports.filter((r) => r.latitude && r.longitude);
  const merged = realValid.length > 0 ? realValid : (DUMMY_REPORTS as unknown as CommunityReportResponse[]);

  return (
    <div className="h-[280px] w-full relative z-0">
      <HeatmapView reports={merged} />
    </div>
  );
}

function SideFeatureItem({
  icon: Icon,
  heading,
  body,
}: {
  icon: React.ElementType;
  heading: string;
  body: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.4 }}
      className="flex gap-4"
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-5" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{heading}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{body}</p>
      </div>
    </motion.div>
  );
}
