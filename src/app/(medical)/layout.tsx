"use client";

import { Sidebar } from "@/components/shared/Sidebar";
import { RoleGuard } from "@/components/shared/RoleGuard";

export default function MedicalLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={["ADMIN", "DOCTOR", "STAFF"]}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
        </div>
      </div>
    </RoleGuard>
  );
}
