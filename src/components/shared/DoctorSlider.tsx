"use client";

import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import { motion } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FilePreviewDialog } from "@/components/shared/FilePreviewDialog";
import { useTranslation } from "@/hooks/useTranslation";
import Link from "next/link";
import { staffService } from "@/services/staffService";
import type { ApiDoctorCredential, ApiPublicDoctor } from "@/types";

export function DoctorSlider() {
  const { t, locale, isRTL } = useTranslation();
  const [doctors, setDoctors] = useState<ApiPublicDoctor[]>([]);
  const [credentialDoctor, setCredentialDoctor] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [credentialItems, setCredentialItems] = useState<ApiDoctorCredential[]>([]);
  const [credentialLoading, setCredentialLoading] = useState(false);
  const [previewingCredentialId, setPreviewingCredentialId] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<{
    name: string;
    fileUrl: string;
    fileType: string;
  } | null>(null);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    slidesToScroll: 1,
    direction: isRTL ? "rtl" : "ltr",
  });

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    let isMounted = true;

    void staffService
      .getPublicDoctors()
      .then((data) => {
        if (isMounted) {
          setDoctors(data);
        }
      })
      .catch(() => {
        if (isMounted) {
          setDoctors([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const openCredentialDialog = (doctor: ApiPublicDoctor) => {
    setCredentialDoctor({ id: doctor.id, name: doctor.fullName });
    
    // Construct items from the pre-signed summary data
    const items: ApiDoctorCredential[] = [];
    
    if (doctor.credentialSummary.ministryOfHealthId) {
      items.push({
        ...doctor.credentialSummary.ministryOfHealthId,
        doctorId: doctor.id,
        credentialType: "MINISTRY_OF_HEALTH_ID",
      } as ApiDoctorCredential);
    }
    
    if (doctor.credentialSummary.qualifications) {
      doctor.credentialSummary.qualifications.forEach((q) => {
        items.push(q);
      });
    }
    
    setCredentialItems(items);
    setCredentialLoading(false);
  };

  const openCredentialPreview = async (item: ApiDoctorCredential) => {
    if (!credentialDoctor) {
      return;
    }

    // Try to use pre-signed URL first
    if (item.previewUrl) {
      setPreviewFile({
        name: item.name,
        fileUrl: item.previewUrl,
        fileType: item.fileType || "application/pdf",
      });
      return;
    }

    setPreviewingCredentialId(item.id);
    try {
      const response = await staffService.getPublicDoctorCredentialPreview(
        credentialDoctor.id,
        item.id,
      );
      setPreviewFile({
        name: item.name,
        fileUrl: response.previewUrl,
        fileType: item.fileType || "application/pdf",
      });
    } catch {
      // Keep UX simple on public page; failed previews are ignored quietly.
    } finally {
      setPreviewingCredentialId(null);
    }
  };

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
                  <Image
                    src={doctor.user?.avatarUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${doctor.id}`}
                    alt={doctor.fullName}
                    width={128}
                    height={128}
                    className="h-32 w-32 rounded-full border-4 border-white shadow-lg"
                    unoptimized
                  />
                  <Badge
                    variant={doctor.status === "ACTIVE" ? "success" : "secondary"}
                    className="absolute top-3 right-3 rtl:right-auto rtl:left-3"
                  >
                    {doctor.status === "ACTIVE" ? (locale === "ar" ? "متوفر" : "available") : (locale === "ar" ? "غير متوفر" : "unavailable")}
                  </Badge>
                </div>

                {/* Info */}
                <div className="p-5 space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {doctor.fullName}
                    </h3>
                    <p className="text-sm text-primary font-medium">
                      {doctor.specialization || (locale === "ar" ? "تخصص عام" : "General")}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="font-semibold">{doctor.rating}</span>
                      <span className="text-muted-foreground">
                        ({t("reviews")})
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span>
                        {doctor.experienceYears} {t("yearsExp")}
                      </span>
                    </div>
                  </div>

                  {(doctor.credentialSummary.hasVerifiedMinistryId ||
                    doctor.credentialSummary.qualificationCount > 0) && (
                    <div className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs text-emerald-700">
                      {locale === "ar"
                        ? `اعتمادات موثقة: ${doctor.credentialSummary.qualificationCount + (doctor.credentialSummary.hasVerifiedMinistryId ? 1 : 0)}`
                        : `Verified credentials: ${doctor.credentialSummary.qualificationCount + (doctor.credentialSummary.hasVerifiedMinistryId ? 1 : 0)}`}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Link href="/appointments">
                      <Button className="w-full" size="sm">
                        {t("bookNow")}
                      </Button>
                    </Link>
                    <Button
                      className="w-full"
                      size="sm"
                      variant="outline"
                      disabled={
                        !doctor.credentialSummary.hasVerifiedMinistryId &&
                        doctor.credentialSummary.qualificationCount === 0
                      }
                      onClick={() => void openCredentialDialog(doctor)}
                    >
                      {locale === "ar" ? "اعتمادات" : "Credentials"}
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      <Dialog
        open={Boolean(credentialDoctor)}
        onOpenChange={(open) => {
          if (!open) {
            setCredentialDoctor(null);
            setCredentialItems([]);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {locale === "ar"
                ? `اعتمادات الطبيب ${credentialDoctor?.name || ""}`
                : `Doctor Credentials${credentialDoctor ? `: ${credentialDoctor.name}` : ""}`}
            </DialogTitle>
            <DialogDescription>
              {locale === "ar"
                ? "هذه الملفات معتمدة ومرئية للعرض العام."
                : "These files are verified and visible on the public profile."}
            </DialogDescription>
          </DialogHeader>

          {credentialLoading ? (
            <p className="text-sm text-muted-foreground">
              {locale === "ar" ? "جاري تحميل الاعتمادات..." : "Loading credentials..."}
            </p>
          ) : credentialItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {locale === "ar"
                ? "لا توجد ملفات اعتماد متاحة حالياً."
                : "No credential files are currently available."}
            </p>
          ) : (
            <div className="space-y-3">
              {credentialItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.credentialType === "MINISTRY_OF_HEALTH_ID"
                        ? locale === "ar"
                          ? "ترخيص وزارة الصحة"
                          : "Ministry of Health License"
                        : locale === "ar"
                          ? "شهادة تأهيل"
                          : "Qualification"}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={previewingCredentialId === item.id}
                    onClick={() => void openCredentialPreview(item)}
                  >
                    {previewingCredentialId === item.id
                      ? locale === "ar"
                        ? "جاري الفتح..."
                        : "Opening..."
                      : locale === "ar"
                        ? "معاينة"
                        : "Preview"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Unified File Preview Dialog */}
      <FilePreviewDialog
        open={Boolean(previewFile)}
        onOpenChange={(open) => !open && setPreviewFile(null)}
        file={previewFile}
      />
    </div>
  );
}
