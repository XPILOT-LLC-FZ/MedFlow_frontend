"use client";

import { Sidebar } from "@/components/shared/Sidebar";
import { Navbar } from "@/components/shared/Navbar";
import { AuthGuard } from "@/components/shared/AuthGuard";

export default function MedicalLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={["MEDICAL_ADMIN", "DOCTOR", "RECEPTION"]}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar showSidebarToggle />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
