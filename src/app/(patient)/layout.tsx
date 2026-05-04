"use client";

import { Sidebar } from "@/components/shared/Sidebar";
import { DashboardTopbar } from "@/components/shared/DashboardTopbar";
import { MobileBottomNav } from "@/components/shared/MobileBottomNav";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { usePathname, useSearchParams } from "next/navigation";
import { useProfileUiStore } from "@/stores/useProfileUiStore";
import { useTranslation } from "@/hooks/useTranslation";
import { Bell } from "lucide-react";
import { notificationsService } from "@/services/notificationsService";
import { useState, useCallback, useEffect, Suspense } from "react";
import type { InAppNotification, ApiService, ApiPublicDoctor } from "@/types";
import { PatientNotificationsDialog } from "@/components/shared/PatientNotificationsDialog";
import { cn } from "@/lib/utils";

// New multi-step booking components & stores
import { useBookingFlowStore } from "@/stores/useBookingFlowStore";
import { useBookingStore } from "@/stores/useBookingStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePatientStore } from "@/stores/usePatientStore";
import { useToastStore } from "@/stores/useToastStore";
import { servicesCatalogService } from "@/services/servicesCatalogService";
import { staffService } from "@/services/staffService";
import { PatientSpecializationsDialog } from "@/components/shared/PatientSpecializationsDialog";
import { PatientDoctorsDialog } from "@/components/shared/PatientDoctorsDialog";
import { BookAppointmentDialog } from "@/components/shared/BookAppointmentDialog";
import { CheckoutDialog } from "@/components/shared/CheckoutDialog";

function MobileBottomNavWrapper() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isDeepFlow = useProfileUiStore((state) => state.isDeepFlow);
  const profileSection = searchParams.get("section");
  const conversationId = searchParams.get("conversationId");
  const appointmentId = searchParams.get("appointmentId");
  const doctorId = searchParams.get("doctorId");
  const shouldHideMobileBottomNav =
    (pathname === "/profile" && (isDeepFlow || (profileSection && profileSection !== "profile"))) ||
    (pathname.startsWith("/chat") && (conversationId || appointmentId || doctorId));

  if (shouldHideMobileBottomNav) return null;
  return <MobileBottomNav />;
}

function MobileSettingsToggles({
  pathname,
  setNotifOpen,
  unreadCount,
}: {
  pathname: string;
  setNotifOpen: (open: boolean) => void;
  unreadCount: number;
}) {
  const searchParams = useSearchParams();
  const conversationId = searchParams.get("conversationId");
  const appointmentId = searchParams.get("appointmentId");
  const doctorId = searchParams.get("doctorId");

  if (pathname.includes("/dashboard")) return null;
  if (pathname.startsWith("/chat") && (conversationId || appointmentId || doctorId)) return null;

  return (
    <div className="lg:hidden fixed top-4 right-4 rtl:right-auto rtl:left-4 z-[100] flex items-center gap-3 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-2 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-2xl shadow-slate-400/20 dark:shadow-none">
        <button
          onClick={() => setNotifOpen(true)}
          className="relative h-8 w-8 rounded-xl flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:scale-105 transition-transform"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-500 border-1.5 border-white dark:border-slate-900 animate-pulse" />
          )}
        </button>
      </div>
    </div>
  );
}

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const { locale } = useTranslation();
  const pathname = usePathname();

  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);

  // Booking Flow Data State
  const [services, setServices] = useState<ApiService[]>([]);
  const [doctors, setDoctors] = useState<ApiPublicDoctor[]>([]);
  const toast = useToastStore();

  const {
    isSpecOpen, isDocsOpen, isBookOpen, isCheckoutOpen,
    selectedSpecialization, selectedDoctor, pendingBooking,
    setSpecOpen, setDocsOpen, setBookOpen, setCheckoutOpen,
    openDocs, openBook, openCheckout, closeAll, goBack
  } = useBookingFlowStore();

  const { addAppointment } = useBookingStore();
  const { user } = useAuthStore();
  const { currentPatient, fetchMe } = usePatientStore();

  const refreshNotifications = useCallback(async () => {
    try {
      const data = await notificationsService.getInAppNotifications();
      setNotifications(data);
    } catch (err) {
      if (err instanceof Error && err.message.includes("Session expired")) {
        console.warn("Session expired while refreshing notifications");
      } else {
        console.error("Failed to fetch notifications in Layout", err);
      }
    }
  }, []);

  useEffect(() => {
    const initNotifications = async () => {
      await refreshNotifications();
    };
    initNotifications();

    const interval = setInterval(() => {
      refreshNotifications();
    }, 60000);
    return () => clearInterval(interval);
  }, [refreshNotifications]);

  // Load Specializations and Doctors
  useEffect(() => {
    const loadBookingData = async () => {
      try {
        const [docsData, servData] = await Promise.all([
          staffService.getPublicDoctors(),
          servicesCatalogService.getAll()
        ]);
        setDoctors(docsData || []);
        setServices(servData || []);
      } catch (err) {
        console.error("Failed to fetch booking data", err);
      }
    };
    if (user?.id) {
      void loadBookingData();
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      void fetchMe();
    }
  }, [fetchMe, user?.id]);

  const getVerifiedInsuranceDiscount = () => {
    const medicalHistory = (currentPatient?.medicalHistory as Record<string, unknown>) || {};
    const insuranceDetails = (medicalHistory.insuranceDetails as Record<string, unknown>) || {};

    if (insuranceDetails.verificationStatus !== "verified") {
      return 0;
    }

    const rawDiscount = Number(insuranceDetails.discountPercent ?? 0);
    if (!Number.isFinite(rawDiscount)) {
      return 0;
    }

    return Math.max(0, Math.min(100, rawDiscount));
  };

  const handleBookNow = async (data: { redeemPoints: boolean; notes?: string; paymentMethodType?: "ONSITE_CASH" | "ONSITE_CARD" | "ONLINE_CARD" | "ONLINE_WALLET" }) => {
    if (!selectedDoctor || !pendingBooking) return;

    const patientId = currentPatient?.id || user?.id || "guest";
    const patientName = currentPatient?.fullName || user?.name || "Patient";

    try {
      await addAppointment({
        patientId,
        patientName,
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.fullName,
        specialty: selectedDoctor.specialization || "Generalist",
        date: pendingBooking.date,
        time: pendingBooking.time,
        status: "scheduled",
        type: "Consultation",
        mode: pendingBooking.mode,
        notes: data.notes,
        redeemPoints: data.redeemPoints,
        paymentMethodType: data.paymentMethodType,
      });

      toast.success(locale === "ar" ? "تم حجز الموعد بنجاح" : "Appointment booked successfully");
      closeAll();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to book appointment";
      toast.error(message);
    }
  };

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <RoleGuard allowedRoles={["PATIENT"]}>
      <div className="flex h-screen h-[100dvh] overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <DashboardTopbar />

          {/* Mobile Settings Toggles */}
          <Suspense fallback={null}>
            <MobileSettingsToggles
              pathname={pathname}
              setNotifOpen={setNotifOpen}
              unreadCount={unreadCount}
            />
          </Suspense>

          <main
            className={cn(
              "flex-1",
              pathname.startsWith("/chat") ? "overflow-hidden" : "overflow-y-auto p-4 md:p-6 pb-24 lg:pb-6"
            )}
            dir={locale === "ar" ? "rtl" : "ltr"}
          >
            {children}
          </main>
          <Suspense fallback={null}>
            <MobileBottomNavWrapper />
          </Suspense>

          <PatientNotificationsDialog
            isOpen={notifOpen}
            onOpenChange={setNotifOpen}
            notifications={notifications}
            onRefresh={refreshNotifications}
          />

          {/* Multi-step Booking Flow dialogs hosted in layout */}
          <PatientSpecializationsDialog
            isOpen={isSpecOpen}
            onOpenChange={setSpecOpen}
            services={services}
            doctors={doctors}
            onSelectSpecialization={(spec) => openDocs(spec)}
          />

          <PatientDoctorsDialog
            isOpen={isDocsOpen}
            onOpenChange={setDocsOpen}
            onBack={() => goBack()}
            doctors={doctors}
            specializationFilter={selectedSpecialization}
            onBookAppointment={(doc) => openBook(doc)}
          />

          <BookAppointmentDialog
            isOpen={isBookOpen}
            onOpenChange={setBookOpen}
            onBack={() => goBack()}
            doctor={selectedDoctor}
            loyaltyPoints={currentPatient?.loyaltyPoints || user?.loyaltyPoints || 0}
            onConfirm={(booking) => openCheckout(booking)}
          />

          <CheckoutDialog
            isOpen={isCheckoutOpen}
            onOpenChange={setCheckoutOpen}
            onBack={() => goBack()}
            doctor={selectedDoctor}
            bookingData={pendingBooking}
            loyaltyPoints={currentPatient?.loyaltyPoints || user?.loyaltyPoints || 0}
            specialDiscount={currentPatient?.specialDiscount || user?.specialDiscount || 0}
            insuranceDiscount={getVerifiedInsuranceDiscount()}
            onBookNow={handleBookNow}
          />
        </div>
      </div>
    </RoleGuard>
  );
}
