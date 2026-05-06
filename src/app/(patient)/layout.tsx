"use client";

import { Sidebar } from "@/components/shared/Sidebar";
import { DashboardTopbar } from "@/components/shared/DashboardTopbar";
import { MobileBottomNav } from "@/components/shared/MobileBottomNav";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
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
import { servicesCatalogService } from "@/services/servicesCatalogService";
import { staffService } from "@/services/staffService";
import { PatientSpecializationsDialog } from "@/components/shared/PatientSpecializationsDialog";
import { PatientDoctorsDialog } from "@/components/shared/PatientDoctorsDialog";
import { DoctorProfileDialog } from "@/components/shared/DoctorProfileDialog";
import { BookAppointmentDialog } from "@/components/shared/BookAppointmentDialog";
import { CheckoutDialog } from "@/components/shared/CheckoutDialog";
import { BookingResultDialog } from "@/components/shared/BookingResultDialog";

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
  const router = useRouter();

  const [notifOpen, setNotifOpen] = useState(false);
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [bookingResult, setBookingResult] = useState<{
    status: "success" | "error";
    message?: string;
    details?: {
      doctorName: string;
      date: string;
      time: string;
      location: string;
    };
  }>({ status: "success" });
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);

  // Booking Flow Data State
  const [services, setServices] = useState<ApiService[]>([]);
  const [doctors, setDoctors] = useState<ApiPublicDoctor[]>([]);

  const {
    isSpecOpen, isDocsOpen, isProfileOpen, isBookOpen, isCheckoutOpen,
    selectedSpecialization, selectedDoctor, selectedBranchId, pendingBooking,
    specTitleOverride,
    setSpecOpen, setDocsOpen, setProfileOpen, setBookOpen, setCheckoutOpen,
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
    // Try to get medicalHistory from currentPatient first, then fallback to user object
    const rawMedicalHistory = currentPatient?.medicalHistory ?? user?.medicalHistory;
    
    if (!rawMedicalHistory) return 0;
    
    // Prisma returns Json fields as objects, but we handle stringified fallback for safety
    const history = typeof rawMedicalHistory === 'string'
      ? JSON.parse(rawMedicalHistory)
      : (rawMedicalHistory as Record<string, unknown>) || {};

    const insurance = (history.insuranceDetails as Record<string, unknown>) || {};
    
    // Case-insensitive check and allow for "Verified" / "verified"
    const status = String(insurance.verificationStatus || "").toLowerCase();
    if (status !== "verified") {
      return 0;
    }

    const rawDiscount = Number(insurance.discountPercent ?? 0);
    if (isNaN(rawDiscount) || !Number.isFinite(rawDiscount)) {
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
        branchId: pendingBooking.branchId,
        notes: data.notes,
        redeemPoints: data.redeemPoints,
        insuranceDiscount: getVerifiedInsuranceDiscount(),
        paymentMethodType: data.paymentMethodType,
      });

      setBookingResult({
        status: "success",
        details: {
          doctorName: selectedDoctor.fullName,
          date: pendingBooking.date,
          time: pendingBooking.time,
          location: pendingBooking.mode === "ONLINE" ? "Online Consultation" : (selectedDoctor.branch?.address || selectedDoctor.branch?.name || "Clinic"),
        }
      });
      setResultDialogOpen(true);
      closeAll();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to book appointment";
      setBookingResult({
        status: "error",
        message
      });
      setResultDialogOpen(true);
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
            titleOverride={specTitleOverride}
            onSelectSpecialization={(spec) => openDocs(spec)}
          />

          <PatientDoctorsDialog
            isOpen={isDocsOpen}
            onOpenChange={setDocsOpen}
            onBack={() => goBack()}
            doctors={doctors}
            specializationFilter={selectedSpecialization}
            onBookAppointment={(doc, branchId) => openBook(doc, branchId)}
          />

          <DoctorProfileDialog
            isOpen={isProfileOpen}
            onOpenChange={setProfileOpen}
            doctor={selectedDoctor}
            onBookAppointment={(doc, branchId) => openBook(doc, branchId)}
          />

          <BookAppointmentDialog
            isOpen={isBookOpen}
            onOpenChange={setBookOpen}
            onBack={() => goBack()}
            doctor={selectedDoctor}
            initialBranchId={selectedBranchId || undefined}
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

          <BookingResultDialog
            isOpen={resultDialogOpen}
            onOpenChange={setResultDialogOpen}
            status={bookingResult.status}
            message={bookingResult.message}
            details={bookingResult.details}
            onAction={() => {
              if (bookingResult.status === "success") {
                router.push("/appointments");
              }
            }}
          />
        </div>
      </div>
    </RoleGuard>
  );
}
