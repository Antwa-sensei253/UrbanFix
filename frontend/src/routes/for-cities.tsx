import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  BarChart3,
  ShieldCheck,
  Users,
  Layers,
  Gauge,
  Database,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/for-cities")({
  head: () => ({
    meta: [
      { title: "UrbanFix for Cities — the operating system for civic repair" },
      {
        name: "description",
        content:
          "Give district managers, technicians, and leadership one accountable workflow — with dashboards, SLAs, and API access.",
      },
      { property: "og:title", content: "UrbanFix for Cities" },
      {
        property: "og:description",
        content:
          "The operating system for civic repair. Dashboards, SLAs, roles, and open APIs.",
      },
    ],
  }),
  component: ForCitiesPage,
});

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};




function ForCitiesPage() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-canvas">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-40 [mask-image:radial-gradient(ellipse_at_top,black_25%,transparent_75%)]" />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-6 pt-20 pb-20 sm:pt-28 lg:grid-cols-2 lg:items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full hairline bg-card px-3 py-1 text-xs font-medium text-muted-foreground"
            >
              <span className="inline-block size-1.5 rounded-full bg-success" />
              {t("fc_badge")}
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="text-5xl font-semibold tracking-tight text-foreground sm:text-6xl"
            >
              {t("fc_headline_1")}{" "}
              <span className="relative whitespace-nowrap">
                <span className="relative z-10">{t("fc_headline_2")}</span>
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                  style={{ transformOrigin: "left" }}
                  className="absolute inset-x-0 bottom-1 -z-0 h-3 bg-primary/15"
                />
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mt-6 max-w-lg text-lg text-muted-foreground"
            >
              {t("fc_sub")}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              className="mt-9 flex flex-col gap-3 sm:flex-row"
            >
              <Button asChild size="lg" className="h-12 px-6 text-base">
                <Link to="/register">
                  {t("fc_cta_primary")}
                  <ArrowRight className="ml-1.5 size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-6 text-base">
                <Link to="/how-it-works">{t("fc_cta_secondary")}</Link>
              </Button>
            </motion.div>
          </div>

          {/* Dashboard mock */}
          <motion.div
            initial={{ opacity: 0, y: 24, rotate: -1 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ delay: 0.15, duration: 0.7, ease: "easeOut" }}
            className="surface-card overflow-hidden shadow-pop"
          >
            <div className="flex items-center gap-1.5 border-b border-border bg-card px-4 py-3">
              <span className="size-2.5 rounded-full bg-border" />
              <span className="size-2.5 rounded-full bg-border" />
              <span className="size-2.5 rounded-full bg-border" />
              <span className="ml-3 text-xs text-muted-foreground">
                urbanfix.app/governor
              </span>
            </div>
            <div className="grid grid-cols-2 gap-px bg-border">
              {[
                ["1,284", "Open"],
                ["312", "In progress"],
                ["94%", "SLA met"],
                ["3.2d", "Avg. fix"],
              ].map(([n, l]) => (
                <div key={l} className="bg-card p-5">
                  <div className="text-2xl font-semibold tracking-tight text-foreground">
                    {n}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{l}</div>
                </div>
              ))}
            </div>
            <div className="border-t border-border bg-card p-5">
              <div className="flex items-end gap-1.5">
                {[42, 68, 55, 80, 62, 90, 74, 88, 66, 95, 78, 84].map((h, i) => (
                  <motion.span
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{
                      delay: 0.4 + i * 0.04,
                      duration: 0.5,
                      ease: "easeOut",
                    }}
                    className="w-full rounded-t bg-primary/70"
                    style={{ minHeight: 4 }}
                  />
                ))}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Resolutions — last 12 weeks
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
          >
            {t("fc_capabilities_title")}
          </motion.h2>
          <p className="mt-4 text-muted-foreground">
            {t("fc_capabilities_sub")}
          </p>
        </div>
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          className="mt-14 grid gap-4 md:grid-cols-3"
        >
          {[
            { i: Gauge, t: t("cap_1_t"), d: t("cap_1_d") },
            { i: Layers, t: t("cap_2_t"), d: t("cap_2_d") },
            { i: Users, t: t("cap_3_t"), d: t("cap_3_d") },
            { i: ShieldCheck, t: t("cap_4_t"), d: t("cap_4_d") },
            { i: BarChart3, t: t("cap_5_t"), d: t("cap_5_d") },
            { i: Database, t: t("cap_6_t"), d: t("cap_6_d") },
          ].map((c) => (
            <motion.div
              key={c.t}
              variants={fadeUp}
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="surface-card p-6"
            >
              <div className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <c.i className="size-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-foreground">
                {c.t}
              </h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{c.d}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Outcomes */}
      <section className="border-y border-border bg-card">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="mx-auto grid max-w-6xl grid-cols-2 gap-px overflow-hidden bg-border md:grid-cols-4"
        >
          {[
            ["3.2 days", t("outcomes_time")],
            ["94%", t("outcomes_sat")],
            ["68%", t("outcomes_sla")],
            ["12h", t("outcomes_onboarding")],
          ].map(([n, l]) => (
            <motion.div
              key={l}
              variants={fadeUp}
              className="bg-card p-8 text-center"
            >
              <div className="text-3xl font-semibold tracking-tight text-foreground">
                {n}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">{l}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Compliance / checklist */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {t("fc_compliance_title")}
            </h2>
            <p className="mt-4 text-muted-foreground">
              {t("fc_compliance_sub")}
            </p>
          </div>
          <motion.ul
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="grid gap-3"
          >
            {[
              t("comp_1"),
              t("comp_2"),
              t("comp_3"),
              t("comp_4"),
              t("comp_5"),
              t("comp_6"),
            ].map((line) => (
              <motion.li
                key={line}
                variants={fadeUp}
                className="flex items-start gap-3 rounded-lg hairline bg-card p-4"
              >
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
                <span className="text-sm text-foreground">{line}</span>
              </motion.li>
            ))}
          </motion.ul>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="surface-card flex flex-col items-center gap-6 p-12 text-center md:p-16"
        >
          <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {t("fc_cta_headline")}
          </h2>
          <p className="max-w-xl text-muted-foreground">
            {t("fc_cta_sub")}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 px-6 text-base">
              <Link to="/register">{t("fc_cta_start")}</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-6 text-base">
              <Link to="/reports">{t("fc_cta_map")}</Link>
            </Button>
          </div>
        </motion.div>
      </section>

      <SiteFooter />
    </div>
  );
}
