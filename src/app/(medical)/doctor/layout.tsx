"use client";

import React from "react";
import { Bell, Moon, Search } from "lucide-react";
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
      <section className="rounded-2xl border bg-white px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-[28px] font-semibold tracking-tight text-slate-900">
              {`${locale === "ar" ? "صباح الخير" : "Good Morning"}, ${displayName}`}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {locale === "ar"
                ? `${currentDate} • لديك 12 موعدًا اليوم`
                : `${currentDate} • You have 12 appointments today`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Notifications"
              className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100"
            >
              <Bell className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Theme"
              className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100"
            >
              <Moon className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-3.5 sm:mt-4">
          <label className="relative block">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={
                locale === "ar"
                  ? "ابحث عن المرضى أو المواعيد أو السجلات الطبية..."
                  : "Search patients, appointments, or medical records..."
              }
              className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </label>
        </div>
      </section>

      {children}
    </div>
  );
}
