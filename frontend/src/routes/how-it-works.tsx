import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  MapPin,
  Camera,
  Send,
  ShieldCheck,
  Wrench,
  CheckCircle2,
  ArrowRight,
  Clock,
  Bell,
  Users,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How UrbanFix works — from pin to fix" },
      {
        name: "description",
        content:
          "See how UrbanFix turns a 30-second citizen report into an accountable, SLA-tracked repair — with live updates every step of the way.",
      },
    ],
  }),
  component: HowItWorksPage,
});

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

function HowItWorksPage() {
  const { t } = useI18n();

  const steps = [
    { i: Camera, t: t("hiw_badge") === "كيف يعمل UrbanFix" ? "التقط وأرسل" : "Spot & snap", d: t("hiw_badge") === "كيف يعمل UrbanFix" ? "شاهد حفرة أو ضوءاً مكسوراً. افتح UrbanFix، انقر على الكاميرا." : "See a pothole, broken light, or graffiti. Open UrbanFix, tap the camera.", tone: "primary" as const },
    { i: MapPin, t: t("hiw_badge") === "كيف يعمل UrbanFix" ? "ضع الدبوس" : "Drop the pin", d: t("hiw_badge") === "كيف يعمل UrbanFix" ? "GPS يحدد الموقع بدقة. أضف وصفاً مختصراً — هذا كل شيء." : "GPS locks the exact spot. Add a short description — that's it.", tone: "primary" as const },
    { i: Send, t: t("hiw_badge") === "كيف يعمل UrbanFix" ? "أرسل في 30 ثانية" : "Submit in 30s", d: t("hiw_badge") === "كيف يعمل UrbanFix" ? "بلاغك مختوم بالوقت ومصنّف وموجَّه للفريق المختص." : "Your report is timestamped, categorized, and routed to the right district team.", tone: "primary" as const },
    { i: ShieldCheck, t: t("hiw_badge") === "كيف يعمل UrbanFix" ? "مراجعة وتحقق" : "Triaged & verified", d: t("hiw_badge") === "كيف يعمل UrbanFix" ? "مدير المنطقة يراجع خلال ساعات. البلاغات المكررة تُدمج تلقائياً." : "A district manager reviews within hours. Duplicates merge automatically.", tone: "warning" as const },
    { i: Wrench, t: t("hiw_badge") === "كيف يعمل UrbanFix" ? "إرسال فني" : "Technician dispatched", d: t("hiw_badge") === "كيف يعمل UrbanFix" ? "يُسند لأقرب فريق لديه طاقة. تحصل على تتبع مباشر." : "Assigned to the nearest crew with capacity. You get a live status feed.", tone: "warning" as const },
    { i: CheckCircle2, t: t("hiw_badge") === "كيف يعمل UrbanFix" ? "إصلاح وتوثيق" : "Fixed & photographed", d: t("hiw_badge") === "كيف يعمل UrbanFix" ? "يُغلق مع صورة إثباتية — لا بيروقراطية." : "Closed with a proof photo — no black-box bureaucracy.", tone: "success" as const },
  ];

  const perks = [
    { i: Clock, t: t("hiw_badge") === "كيف يعمل UrbanFix" ? "جداول زمنية مضمونة" : "SLA-backed timelines", d: t("hiw_badge") === "كيف يعمل UrbanFix" ? "لكل فئة موعد خدمة. المدن تُقاس عليه." : "Every category has a service deadline. Cities are measured on it." },
    { i: Bell, t: t("hiw_badge") === "كيف يعمل UrbanFix" ? "إشعارات فورية" : "Real-time notifications", d: t("hiw_badge") === "كيف يعمل UrbanFix" ? "تغييرات الحالة تصلك فور حدوثها." : "Status changes ping you the moment they happen." },
    { i: Users, t: t("hiw_badge") === "كيف يعمل UrbanFix" ? "تصويت المجتمع" : "Community upvotes", d: t("hiw_badge") === "كيف يعمل UrbanFix" ? "الجيران يُبرزون ما يهم. الأولوية تتبع الناس." : "Neighbors amplify what matters. Priority follows people." },
  ];

  return (
    <div className="min-h-screen bg-canvas">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-40 [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]" />
        <div className="relative mx-auto max-w-4xl px-6 pt-20 pb-16 text-center sm:pt-28">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full hairline bg-card px-3 py-1 text-xs font-medium text-muted-foreground"
          >
            <span className="inline-block size-1.5 rounded-full bg-primary" />
            {t("hiw_badge")}
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-5xl font-semibold tracking-tight text-foreground sm:text-6xl"
          >
            {t("hiw_headline_1")}{" "}
            <span className="relative whitespace-nowrap">
              <span className="relative z-10">{t("hiw_headline_2")}</span>
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.5, duration: 0.6, ease: "easeOut" }}
                style={{ transformOrigin: "left" }}
                className="absolute inset-x-0 bottom-1 -z-0 h-3 bg-primary/15"
              />
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground"
          >
            {t("hiw_sub")}
          </motion.p>
        </div>
      </section>

      {/* Timeline */}
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <motion.ol
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          className="relative space-y-6 border-l border-border pl-8 sm:pl-12"
        >
          {steps.map((s, i) => (
            <motion.li key={s.t} variants={fadeUp} className="relative">
              <span
                className={`absolute -left-[41px] sm:-left-[57px] flex size-10 items-center justify-center rounded-full border-2 border-card shadow-pop ${
                  s.tone === "warning"
                    ? "bg-warning text-warning-foreground"
                    : s.tone === "success"
                      ? "bg-success text-success-foreground"
                      : "bg-primary text-primary-foreground"
                }`}
              >
                <s.i className="size-4" />
              </span>
              <motion.div
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="surface-card p-5"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t("hiw_step")} {i + 1}
                  </span>
                </div>
                <h3 className="mt-1 text-lg font-semibold text-foreground">
                  {s.t}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
              </motion.div>
            </motion.li>
          ))}
        </motion.ol>
      </section>

      {/* Perks */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
          >
            {t("hiw_perks_title")}
          </motion.h2>
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="mt-12 grid gap-4 md:grid-cols-3"
          >
            {perks.map((p) => (
              <motion.div
                key={p.t}
                variants={fadeUp}
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="hairline rounded-lg bg-canvas p-6"
              >
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <p.i className="size-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-foreground">
                  {p.t}
                </h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{p.d}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="surface-card flex flex-col items-center gap-6 p-12 text-center md:p-16"
        >
          <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {t("hiw_cta_headline")}
          </h2>
          <p className="max-w-xl text-muted-foreground">
            {t("hiw_cta_sub")}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 px-6 text-base">
              <Link to="/reports">
                {t("hiw_cta_btn")}
                <ArrowRight className="ml-1.5 size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-6 text-base">
              <Link to="/for-cities">{t("hiw_cta_secondary")}</Link>
            </Button>
          </div>
        </motion.div>
      </section>

      <SiteFooter />
    </div>
  );
}
