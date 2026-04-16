"use client";

import React from "react";
import { SettingsSidebar } from "@/components/doctor/SettingsSidebar";
import { PageHeader } from "@/components/shared/PageHeader";
import { useTranslation } from "@/hooks/useTranslation";

// Metadata is not supported in Client Components
// export const metadata: Metadata = {
//   title: "Settings | MedFlow",
//   description: "Manage your doctor profile and preferences",
// };

export default function DoctorSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { locale } = useTranslation();
  return (
    <div className="doctor-dashboard space-y-6">
      <PageHeader
        title={locale === "ar" ? "الإعدادات" : "Settings"}
        description={
          locale === "ar" 
            ? "إدارة ملفك الشخصي وجدولك وتفضيلات العيادة" 
            : "Manage your profile, schedule, and clinic preferences"
        }
      />

      <div className="flex flex-col sm:flex-row gap-6">
        {/* Sidebar */}
        <aside className="w-full sm:w-64 flex-shrink-0">
          <SettingsSidebar />
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 w-full min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
