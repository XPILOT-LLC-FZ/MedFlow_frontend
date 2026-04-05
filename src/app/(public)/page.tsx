"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock3,
  Heart,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  Stethoscope,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { Navbar } from "@/components/shared/Navbar";
import { DoctorSlider } from "@/components/shared/DoctorSlider";
import { useTranslation } from "@/hooks/useTranslation";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

const services = [
  { icon: Heart, color: "text-red-500 bg-red-50 dark:bg-red-950/30" },
  { icon: Stethoscope, color: "text-blue-500 bg-blue-50 dark:bg-blue-950/30" },
  { icon: Shield, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30" },
  { icon: Users, color: "text-purple-500 bg-purple-50 dark:bg-purple-950/30" },
];

const steps = [
  { icon: Stethoscope, number: "01" },
  { icon: Calendar, number: "02" },
  { icon: CheckCircle2, number: "03" },
];

const testimonials = [
  { name: "Sarah Johnson", role: "Patient", avatar: "Sarah", rating: 5, text: "MedFlow made booking my cardiology appointment so easy. The doctor was amazing and the whole process was seamless." },
  { name: "Mohammed Ali", role: "Patient", avatar: "Mohammed", rating: 5, text: "Best clinic experience I've ever had. The Arabic support makes everything so convenient. Highly recommended!" },
  { name: "Emma Davis", role: "Patient", avatar: "Emma", rating: 5, text: "From booking to follow-up, everything was handled professionally. The WhatsApp notifications are a great touch." },
];

export default function LandingPage() {
  const { t, locale } = useTranslation();
  const rtl = locale === "ar";

  const serviceData = [
    { title: locale === "ar" ? "أمراض القلب" : "Cardiology", desc: locale === "ar" ? "رعاية قلبية شاملة" : "Comprehensive cardiac care" },
    { title: locale === "ar" ? "طب عام" : "General Medicine", desc: locale === "ar" ? "رعاية صحية أولية" : "Primary healthcare services" },
    { title: locale === "ar" ? "طب الأطفال" : "Pediatrics", desc: locale === "ar" ? "رعاية صحية للأطفال" : "Healthcare for children" },
    { title: locale === "ar" ? "الأمراض الجلدية" : "Dermatology", desc: locale === "ar" ? "علاجات الجلد المتقدمة" : "Advanced skin treatments" },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="hero-future relative overflow-hidden border-b border-border/60">
        <div className="hero-future-grid absolute inset-0 opacity-50" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background via-background/85 to-transparent" />
        <div className="absolute left-[8%] top-28 h-72 w-72 rounded-full bg-cyan-400/18 blur-3xl" />
        <div className="absolute right-[10%] top-20 h-64 w-64 rounded-full bg-primary/18 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-emerald-300/14 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-18 sm:px-6 md:py-24 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
            <motion.div {...fadeUp} className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-background/80 px-4 py-2 text-sm font-medium text-primary shadow-[0_20px_60px_-40px_rgba(14,165,233,0.85)] backdrop-blur">
                <Sparkles className="h-4 w-4" />
                <span>{locale === "ar" ? "رعاية ذكية بسرعة أعلى" : "AI-orchestrated care, built for speed"}</span>
              </div>

              <div className="mt-7 flex items-center gap-3">
                <BrandLogo showCaption theme="light" />
                <div className="hidden h-8 w-px bg-border/80 sm:block" />
                <p className="hidden text-sm text-muted-foreground sm:block">
                  {locale === "ar" ? "منصة طبية عصرية للحجز والمتابعة والتنسيق" : "A modern care platform for booking, follow-up, and clinical coordination."}
                </p>
              </div>

              <h1 className="mt-8 max-w-4xl text-5xl font-semibold tracking-[-0.05em] text-balance text-slate-950 md:text-6xl lg:text-7xl">
                {t("heroTitle")}
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground md:text-xl">
                {t("heroSubtitle")}
              </p>

              <div className="mt-8 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
                <Link href="/appointments">
                  <Button size="xl" className="group min-w-[210px] gap-2 rounded-2xl px-8 shadow-[0_20px_50px_-20px_rgba(37,99,235,0.8)]">
                    {t("heroBtn")}
                    <ArrowRight className={`h-5 w-5 transition-transform duration-200 ${rtl ? "group-hover:-translate-x-1" : "group-hover:translate-x-1"}`} />
                  </Button>
                </Link>
                <Link href="#services">
                  <Button
                    variant="outline"
                    size="xl"
                    className="min-w-[190px] rounded-2xl border-white/60 bg-background/70 shadow-[0_10px_40px_-28px_rgba(15,23,42,0.5)] backdrop-blur"
                  >
                    {t("heroSecondaryBtn")}
                  </Button>
                </Link>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                <div className="hero-stat-card">
                  <div className="hero-stat-icon bg-primary/12 text-primary">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">10,000+</p>
                    <p className="text-sm text-muted-foreground">{locale === "ar" ? "مريض نشط" : "Active patients"}</p>
                  </div>
                </div>
                <div className="hero-stat-card">
                  <div className="hero-stat-icon bg-emerald-500/12 text-emerald-600">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">99.9%</p>
                    <p className="text-sm text-muted-foreground">{locale === "ar" ? "جاهزية النظام" : "System uptime"}</p>
                  </div>
                </div>
                <div className="hero-stat-card">
                  <div className="hero-stat-icon bg-amber-500/12 text-amber-600">
                    <Clock3 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold tracking-[-0.03em] text-slate-950">&lt; 2 min</p>
                    <p className="text-sm text-muted-foreground">{locale === "ar" ? "متوسط الحجز" : "Average booking time"}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="relative mx-auto w-full max-w-[560px]"
            >
              <div className="hero-panel rounded-[32px] p-5 sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/80">
                      {locale === "ar" ? "مركز التنسيق" : "Care Command Center"}
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                      {locale === "ar" ? "دفق علاجي واضح وسريع" : "A faster, clearer patient journey"}
                    </h3>
                  </div>
                  <div className="rounded-2xl border border-primary/15 bg-primary/10 p-3 text-primary">
                    <Activity className="h-6 w-6" />
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-[1.1fr_0.9fr]">
                  <div className="hero-mini-card">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">
                        {locale === "ar" ? "تدفق المواعيد" : "Appointment flow"}
                      </span>
                      <span className="rounded-full bg-emerald-500/12 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                        {locale === "ar" ? "مستقر" : "Stable"}
                      </span>
                    </div>
                    <div className="mt-5 space-y-3">
                      {[
                        { label: locale === "ar" ? "الحجوزات اليوم" : "Booked today", value: "128", width: "w-[86%]" },
                        { label: locale === "ar" ? "التأكيد الفوري" : "Instant confirmations", value: "96%", width: "w-[72%]" },
                        { label: locale === "ar" ? "رضا المرضى" : "Patient satisfaction", value: "4.9/5", width: "w-[64%]" },
                      ].map((item) => (
                        <div key={item.label}>
                          <div className="mb-2 flex items-center justify-between text-sm">
                            <span className="text-slate-600">{item.label}</span>
                            <span className="font-semibold text-slate-950">{item.value}</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-200/80">
                            <div className={`h-2 rounded-full bg-[linear-gradient(90deg,#2563eb,#22c55e)] ${item.width}`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="hero-mini-card">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">
                          {locale === "ar" ? "استجابة الفريق" : "Clinical response"}
                        </span>
                        <Heart className="h-4 w-4 text-rose-500" />
                      </div>
                      <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-950">18s</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {locale === "ar" ? "متوسط زمن التنبيه للجلسات المهمة" : "Average alert time for priority care moments."}
                      </p>
                    </div>

                    <div className="hero-mini-card">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500/12 text-sky-600">
                          <Calendar className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-700">
                            {locale === "ar" ? "الجلسة التالية" : "Next live slot"}
                          </p>
                          <p className="text-lg font-semibold tracking-[-0.03em] text-slate-950">Dr. Sarah Mitchell</p>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-950 px-4 py-3 text-white">
                        <div>
                          <p className="text-xs uppercase tracking-[0.24em] text-white/60">
                            {locale === "ar" ? "الزمن" : "Time"}
                          </p>
                          <p className="mt-1 text-sm font-medium">09:30 AM</p>
                        </div>
                        <div className="h-8 w-px bg-white/15" />
                        <div>
                          <p className="text-xs uppercase tracking-[0.24em] text-white/60">
                            {locale === "ar" ? "النوع" : "Type"}
                          </p>
                          <p className="mt-1 text-sm font-medium">{locale === "ar" ? "متابعة" : "Follow-up"}</p>
                        </div>
                        <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(74,222,128,0.8)]" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {[
                    { icon: Stethoscope, label: locale === "ar" ? "أطباء متصلون" : "Doctors online", value: "48" },
                    { icon: Star, label: locale === "ar" ? "جودة الخدمة" : "Care quality", value: "4.9" },
                    { icon: Shield, label: locale === "ar" ? "أمان البيانات" : "Secure records", value: "100%" },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.55)]">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Icon className="h-4 w-4 text-primary" />
                          <span className="text-sm">{item.label}</span>
                        </div>
                        <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-950">{item.value}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <motion.div {...fadeUp} className="mb-12 text-center">
            <h2 className="text-3xl font-bold">{t("servicesTitle")}</h2>
            <p className="mt-2 text-muted-foreground">{t("servicesSubtitle")}</p>
          </motion.div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {serviceData.map((svc, i) => {
              const Icon = services[i].icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="group p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                    <CardContent className="space-y-4 p-0">
                      <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${services[i].color} transition-transform group-hover:scale-110`}>
                        <Icon className="h-7 w-7" />
                      </div>
                      <h3 className="text-lg font-semibold">{svc.title}</h3>
                      <p className="text-sm text-muted-foreground">{svc.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <motion.div {...fadeUp} className="mb-12 text-center">
            <h2 className="text-3xl font-bold">{t("howItWorksTitle")}</h2>
            <p className="mt-2 text-muted-foreground">{t("howItWorksSubtitle")}</p>
          </motion.div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[t("step1Title"), t("step2Title"), t("step3Title")].map((title, i) => {
              const desc = [t("step1Desc"), t("step2Desc"), t("step3Desc")][i];
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="relative text-center"
                >
                  <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground shadow-lg shadow-primary/25">
                    {steps[i].number}
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{title}</h3>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Doctor Slider */}
      <section className="bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <DoctorSlider />
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <motion.div {...fadeUp} className="mb-12 text-center">
            <h2 className="text-3xl font-bold">{t("testimonialsTitle")}</h2>
            <p className="mt-2 text-muted-foreground">{t("testimonialsSubtitle")}</p>
          </motion.div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {testimonials.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full p-6 transition-shadow hover:shadow-lg">
                  <CardContent className="space-y-4 p-0">
                    <div className="flex gap-0.5">
                      {Array.from({ length: item.rating }).map((_, j) => (
                        <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">&ldquo;{item.text}&rdquo;</p>
                    <div className="flex items-center gap-3 pt-2">
                      <img
                        src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${item.avatar}`}
                        className="h-10 w-10 rounded-full"
                        alt={item.name}
                      />
                      <div>
                        <p className="text-sm font-semibold">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary to-blue-600 p-12 text-center md:p-16"
          >
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=60 height=60 viewBox=%270 0 60 60%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cg fill=%27none%27 fill-rule=%27evenodd%27%3E%3Cg fill=%27%23ffffff%27 fill-opacity=%270.05%27%3E%3Cpath d=%27M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%27/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]" />
            <div className="relative">
              <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">{t("ctaTitle")}</h2>
              <p className="mx-auto mb-8 max-w-2xl text-lg text-blue-100">{t("ctaSubtitle")}</p>
              <Link href="/signup">
                <Button size="xl" variant="secondary" className="gap-2 shadow-xl">
                  {t("ctaBtn")}
                  <ArrowRight className={`h-5 w-5 ${rtl ? "rotate-180" : ""}`} />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <Link href="/main" className="flex items-center">
            <BrandLogo iconClassName="h-8 w-8 rounded-lg" textClassName="text-base" />
          </Link>
          <p className="text-sm text-muted-foreground">&copy; 2026 {t("footer")}</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="#" className="transition-colors hover:text-foreground">Privacy</Link>
            <Link href="#" className="transition-colors hover:text-foreground">Terms</Link>
            <Link href="#" className="transition-colors hover:text-foreground">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
