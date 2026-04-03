"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight, Stethoscope, Heart, Shield, Calendar, Star,
  CheckCircle2, Users, Clock, Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  { name: "Sarah Johnson", role: "Patient", avatar: "Sarah", rating: 5, text: "ClinicOS made booking my cardiology appointment so easy. The doctor was amazing and the whole process was seamless." },
  { name: "Mohammed Ali", role: "Patient", avatar: "Mohammed", rating: 5, text: "Best clinic experience I've ever had. The Arabic support makes everything so convenient. Highly recommended!" },
  { name: "Emma Davis", role: "Patient", avatar: "Emma", rating: 5, text: "From booking to follow-up, everything was handled professionally. The WhatsApp notifications are a great touch." },
];

export default function LandingPage() {
  const { t, locale } = useTranslation();

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
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
        <div className="absolute top-20 -left-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-20 -right-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-24 md:py-36">
          <motion.div {...fadeUp} className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Heart className="h-4 w-4" />
              <span>{locale === "ar" ? "منصة الرعاية الصحية #1" : "#1 Healthcare Platform"}</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight mb-6">
              {t("heroTitle")}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
              {t("heroSubtitle")}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/appointments">
                <Button size="xl" className="gap-2 shadow-lg shadow-primary/25">
                  {t("heroBtn")}
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="#services">
                <Button variant="outline" size="xl">
                  {t("heroSecondaryBtn")}
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="flex items-center justify-center gap-8 mt-12 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span>10,000+ {locale === "ar" ? "مريض" : "Patients"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-primary" />
                <span>50+ {locale === "ar" ? "طبيب" : "Doctors"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500" />
                <span>4.9 {locale === "ar" ? "تقييم" : "Rating"}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-3xl font-bold">{t("servicesTitle")}</h2>
            <p className="text-muted-foreground mt-2">{t("servicesSubtitle")}</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
                  <Card className="text-center p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
                    <CardContent className="p-0 space-y-4">
                      <div className={`h-14 w-14 rounded-2xl flex items-center justify-center mx-auto ${services[i].color} group-hover:scale-110 transition-transform`}>
                        <Icon className="h-7 w-7" />
                      </div>
                      <h3 className="font-semibold text-lg">{svc.title}</h3>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-3xl font-bold">{t("howItWorksTitle")}</h2>
            <p className="text-muted-foreground mt-2">{t("howItWorksSubtitle")}</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[t("step1Title"), t("step2Title"), t("step3Title")].map((title, i) => {
              const desc = [t("step1Desc"), t("step2Desc"), t("step3Desc")][i];
              const Icon = steps[i].icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="relative text-center"
                >
                  <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary text-primary-foreground text-xl font-bold mb-4 shadow-lg shadow-primary/25">
                    {steps[i].number}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{title}</h3>
                  <p className="text-muted-foreground text-sm">{desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Doctor Slider */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <DoctorSlider />
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-3xl font-bold">{t("testimonialsTitle")}</h2>
            <p className="text-muted-foreground mt-2">{t("testimonialsSubtitle")}</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="p-6 h-full hover:shadow-lg transition-shadow">
                  <CardContent className="p-0 space-y-4">
                    <div className="flex gap-0.5">
                      {Array.from({ length: item.rating }).map((_, j) => (
                        <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">&ldquo;{item.text}&rdquo;</p>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative rounded-3xl bg-gradient-to-r from-primary to-blue-600 p-12 md:p-16 text-center overflow-hidden"
          >
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=60 height=60 viewBox=%270 0 60 60%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cg fill=%27none%27 fill-rule=%27evenodd%27%3E%3Cg fill=%27%23ffffff%27 fill-opacity=%270.05%27%3E%3Cpath d=%27M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%27/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]" />
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t("ctaTitle")}</h2>
              <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">{t("ctaSubtitle")}</p>
              <Link href="/signup">
                <Button size="xl" variant="secondary" className="gap-2 shadow-xl">
                  {t("ctaBtn")}
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
              <Heart className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">ClinicOS</span>
          </div>
          <p className="text-sm text-muted-foreground">&copy; 2026 {t("footer")}</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="#" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
