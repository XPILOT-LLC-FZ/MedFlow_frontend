"use client";

import React, { useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { motion } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { doctors } from "@/data/doctors";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function DoctorSlider() {
  const { t, locale, isRTL } = useTranslation();
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    slidesToScroll: 1,
    direction: isRTL ? "rtl" : "ltr",
  });

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold">{t("doctorsTitle")}</h2>
          <p className="text-muted-foreground mt-1">{t("doctorsSubtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={scrollPrev} className="rounded-full">
            {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="icon" onClick={scrollNext} className="rounded-full">
            {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-6">
          {doctors.map((doctor, i) => (
            <motion.div
              key={doctor.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex-[0_0_300px] min-w-0"
            >
              <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                {/* Image */}
                <div className="relative h-48 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                  <img
                    src={doctor.image}
                    alt={locale === "ar" ? doctor.nameAr : doctor.name}
                    className="h-32 w-32 rounded-full border-4 border-white shadow-lg"
                  />
                  <Badge
                    variant={doctor.available ? "success" : "secondary"}
                    className="absolute top-3 right-3 rtl:right-auto rtl:left-3"
                  >
                    {doctor.available ? t("available") : t("unavailable")}
                  </Badge>
                </div>

                {/* Info */}
                <div className="p-5 space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {locale === "ar" ? doctor.nameAr : doctor.name}
                    </h3>
                    <p className="text-sm text-primary font-medium">
                      {locale === "ar" ? doctor.specialtyAr : doctor.specialty}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="font-semibold">{doctor.rating}</span>
                      <span className="text-muted-foreground">
                        ({doctor.reviewCount} {t("reviews")})
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span>
                        {doctor.experience} {t("yearsExp")}
                      </span>
                    </div>
                  </div>

                  <Link href="/appointments">
                    <Button className="w-full mt-2" size="sm">
                      {t("bookNow")}
                    </Button>
                  </Link>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
