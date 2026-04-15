"use client";

import React from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useTranslation } from "@/hooks/useTranslation";

export default function DoctorSectionLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const { locale } = useTranslation();

  const displayName = user
    ? locale === "ar"
      ? (user.nameAr || user.name)
      : user.name
    : "Doctor";

  const currentDate = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 lg:space-y-6">
      {children}
    </div>
  );
}
