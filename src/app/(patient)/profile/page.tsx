"use client";

import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Phone,
  Edit3,
  FileText,
  Trash2,
  Eye,
  Check,
  X,
  Save,
  Loader2,
  Plus,
  User,
  ChevronRight,
  Coins,
  Bell,
  CreditCard,
  Mail,
  Lock,
  LogOut as LogOutIcon,
  Heart,
  Activity,
  AlertCircle,
  Droplet,
  ChevronLeft,
  Camera,
  Beaker,
  Contact2,
  HeartPulse,
  LucideIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/PageHeader";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuthStore } from "@/stores/useAuthStore";
import { useToastStore } from "@/stores/useToastStore";
import { useProfileUiStore } from "@/stores/useProfileUiStore";
import {
  patientDocumentService,
  PATIENT_DOCUMENTS_ACCESS_BLOCKED,
} from "@/services/patientDocumentService";
import { patientService } from "@/services/patientService";
import { authService } from "@/services/authService";
import type { ApiPatient, ApiPatientDocument } from "@/types";
import { cn } from "@/lib/utils";
import { CldUploadWidget, type CloudinaryUploadWidgetResults } from "next-cloudinary";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import FavoriteDoctorsPanel from "./sections/FavoriteDoctorsPanel";
import EmergencyContactPanel from "./sections/EmergencyContactPanel";
import InsurancePanel from "./sections/InsurancePanel";
import PointsPanel from "./sections/PointsPanel";
import NotificationsPanel from "./sections/NotificationsPanel";
import PaymentsPanel from "./sections/PaymentsPanel";
import EmailPanel from "./sections/EmailPanel";
import SecurityPanel from "./sections/SecurityPanel";
import LabRadiologyPanel from "./sections/LabRadiologyPanel";
import { toast } from "sonner";

const CHRONIC_DISEASES = [
  "Hypertension",
  "Diabetes",
  "Asthma",
  "Heart Disease",
  "Arthritis",
];

function ProfilePageContent() {
  const { t, locale } = useTranslation();
  const { user } = useAuthStore();
  const toastSuccess = useToastStore(state => state.success);
  const toastError = useToastStore(state => state.error);
  const setProfileDeepFlow = useProfileUiStore((state) => state.setDeepFlow);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Section navigation state
  type SectionId = "profile" | "lab-radiology" | "favorite-doctors" | "emergency-contact" | "insurance" | "points" | "notifications" | "payments" | "email" | "security" | "logout";

  const SECTION_METADATA: Record<SectionId, { label: string; labelAr: string; icon: LucideIcon; color: string }> = {
    profile: { label: "Profile", labelAr: "الملف الشخصي", icon: User, color: "text-slate-400" },
    "lab-radiology": { label: "Lab & Radiology", labelAr: "المختبر والأشعة", icon: Beaker, color: "text-[#4659ff]" },
    "favorite-doctors": { label: "Favorite doctors", labelAr: "الأطباء المفضلون", icon: Heart, color: "text-[#4659ff]" },
    "emergency-contact": { label: "Emergency contact", labelAr: "جهة اتصال الطوارئ", icon: Contact2, color: "text-[#4659ff]" },
    insurance: { label: "Insurance information", labelAr: "معلومات التأمين", icon: HeartPulse, color: "text-[#4659ff]" },
    points: { label: "Points", labelAr: "النقاط", icon: Coins, color: "text-[#4659ff]" },
    notifications: { label: "Notification settings", labelAr: "إعدادات التنبيهات", icon: Bell, color: "text-[#4659ff]" },
    payments: { label: "Payment settings", labelAr: "إعدادات الدفع", icon: CreditCard, color: "text-[#4659ff]" },
    email: { label: "Change email", labelAr: "تغيير البريد الإلكتروني", icon: Mail, color: "text-[#4659ff]" },
    security: { label: "Security settings", labelAr: "إعدادات الأمان", icon: Lock, color: "text-[#4659ff]" },
    logout: { label: "Log out", labelAr: "تسجيل الخروج", icon: LogOutIcon, color: "text-rose-500" },
  };

  const initialSection = (searchParams.get("section") as SectionId) || "profile";
  const [activeSection, setActiveSection] = useState<SectionId>(initialSection);

  const openEditModal = useCallback(() => {
    setProfileDeepFlow(true);
    setIsEditModalOpen(true);
  }, [setProfileDeepFlow]);

  const closeEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setProfileDeepFlow(false);
  }, [setProfileDeepFlow]);

  const openMobilePersonalInfo = useCallback(() => {
    setProfileDeepFlow(true);
    setShowMobilePersonalInfo(true);
  }, [setProfileDeepFlow]);

  const closeMobilePersonalInfo = useCallback(() => {
    setShowMobilePersonalInfo(false);
    setProfileDeepFlow(false);
  }, [setProfileDeepFlow]);

  const setActiveSectionWithUrl = useCallback((section: SectionId) => {
    setActiveSection(section);
    router.push(`?section=${section}`, { shallow: true } as never);
  }, [router]);

  // Sync activeSection when URL changes
  useEffect(() => {
    const section = (searchParams.get("section") as SectionId) || "profile";
    setActiveSection(section);
  }, [searchParams]);

  const [patient, setPatient] = useState<ApiPatient | null>(null);
  const [isLoadingPatient, setIsLoadingPatient] = useState(true);
  const isInitialLoad = useRef(true);
  const [documents, setDocuments] = useState<ApiPatientDocument[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showMobilePersonalInfo, setShowMobilePersonalInfo] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: "",
    fullNameAr: "",
    phone: "",
    email: "",
    dateOfBirth: "",
    bloodType: "",
    allergies: [] as string[],
    chronicDiseases: [] as string[],
    emergencyContact: "",
    address: "",
    gender: "",
  });

  const loadPatientData = useCallback(async () => {
    if (isInitialLoad.current) {
      setIsLoadingPatient(true);
    }

    try {
      const data = await patientService.getMe();
      setPatient(data);
      const history = (data.medicalHistory as Record<string, unknown>) || {};

      let gender = data.gender || "";
      if (!gender && data.user?.onboardingAnswers) {
        const genderAnswer = data.user.onboardingAnswers.find(
          (a) => a.question.fieldKey === "gender" || a.question.question.toLowerCase().includes("gender")
        );
        if (genderAnswer) {
          gender = genderAnswer.answer.toLowerCase();
        }
      }

      setEditForm({
        fullName: data.fullName || "",
        fullNameAr: data.fullNameAr || "",
        phone: data.phone || "",
        email: data.email || "",
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().split("T")[0] : "",
        bloodType: data.bloodType || "",
        allergies: data.allergies || [],
        chronicDiseases: (history["chronicDiseases"] as string[]) || [],
        emergencyContact: (history["emergencyContact"] as string) || "",
        address: data.address || (data.medicalHistory as Record<string, unknown>)?.["address"] as string || "",
        gender: gender,
      });
    } catch (error) {
      console.error("Failed to load patient data", error);
      toastError(locale === "ar" ? "فشل تحميل بيانات المريض" : "Failed to load patient data");
    } finally {
      setIsLoadingPatient(false);
      isInitialLoad.current = false;
    }
  }, [locale, toastError]);

  const loadDocuments = useCallback(async () => {
    if (!user?.id) return;

    setIsLoadingDocuments(true);
    try {
      const docs = await patientDocumentService.getCurrentPatientDocuments();
      setDocuments(docs || []);
    } catch (error) {
      const blocked = error instanceof Error && error.message === PATIENT_DOCUMENTS_ACCESS_BLOCKED;
      if (!blocked) {
        toast.error(locale === "ar" ? "تعذر تحميل ملفات المريض" : "Failed to load patient files");
      }
      setDocuments([]);
    } finally {
      setIsLoadingDocuments(false);
    }
  }, [locale, user?.id]);

  useEffect(() => {
    loadPatientData();
    loadDocuments();
  }, [loadPatientData, loadDocuments]);

  const handleUpdateProfile = async () => {
    if (!patient?.id) return;

    setIsSaving(true);
    try {
      const updatedMedicalHistory = {
        ...(patient.medicalHistory as Record<string, unknown> || {}),
        chronicDiseases: editForm.chronicDiseases,
        emergencyContact: editForm.emergencyContact,
        address: editForm.address,
      };

      await patientService.update(patient.id, {
        fullName: editForm.fullName,
        fullNameAr: editForm.fullNameAr,
        phone: editForm.phone,
        email: editForm.email,
        dateOfBirth: editForm.dateOfBirth || undefined,
        bloodType: editForm.bloodType,
        address: editForm.address,
        allergies: editForm.allergies,
        gender: editForm.gender,
        medicalHistory: updatedMedicalHistory,
      });

      toastSuccess(locale === "ar" ? "تم تحديث الملف الشخصي بنجاح" : "Profile updated successfully");
      closeEditModal();
      await loadPatientData();

      // Update global user session so the navbar catches the new name
      useAuthStore.getState().bootSession(true);
    } catch (error) {
      console.error("Failed to update profile", error);
      toastError(locale === "ar" ? "فشل تحديث الملف الشخصي" : "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const SIDEBAR_ITEMS = Object.entries(SECTION_METADATA).map(([id, meta]) => ({
    id: id as SectionId,
    ...meta,
    isLogout: id === "logout",
  }));

  const toggleChronicDisease = (disease: string) => {
    setEditForm(prev => ({
      ...prev,
      chronicDiseases: prev.chronicDiseases.includes(disease)
        ? prev.chronicDiseases.filter(d => d !== disease)
        : [...prev.chronicDiseases, disease]
    }));
  };

  const files = useMemo(() =>
    documents.filter(doc => !doc.name.startsWith("diagnostic-report-") && (!doc.uploadedBy || doc.uploadedBy === user?.id)),
    [documents, user?.id]
  );

  // Section content renderer
  const renderSectionContent = () => {
    switch (activeSection) {
      case "profile":
        return null; // Rendered inline below
      case "lab-radiology":
        return <LabRadiologyPanel />;
      case "favorite-doctors":
        return <FavoriteDoctorsPanel />;
      case "emergency-contact":
        return <EmergencyContactPanel patient={patient || undefined} onBack={() => setActiveSection("profile")} onRefresh={loadPatientData} />;
      case "insurance":
        return <InsurancePanel patient={patient || undefined} onBack={() => setActiveSection("profile")} onRefresh={loadPatientData} />;
      case "points":
        return <PointsPanel patient={patient || undefined} onBack={() => setActiveSection("profile")} />;
      case "notifications":
        return <NotificationsPanel />;
      case "payments":
        return <PaymentsPanel patient={patient || undefined} onBack={() => setActiveSection("profile")} onRefresh={loadPatientData} />;
      case "email":
        return <EmailPanel patient={patient || undefined} userEmail={user?.email} onBack={() => setActiveSection("profile")} onRefresh={loadPatientData} />;
      case "security":
        return <SecurityPanel />;
      default:
        return null;
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    setDeletingId(documentId);
    try {
      await patientDocumentService.removeForCurrentPatient(documentId);
      toastSuccess(locale === "ar" ? "تم حذف الملف بنجاح" : "File deleted successfully");
      await loadDocuments();
    } catch (error) {
      let message = locale === "ar" ? "فشل حذف الملف" : "Failed to delete file";
      if (error instanceof Error && error.message) {
        if (error.message.includes("forbidden")) message = locale === "ar" ? "غير مصرح بحذف الملف" : "Not authorized to delete file";
        else if (error.message.includes("network")) message = locale === "ar" ? "خطأ في الشبكة أثناء حذف الملف" : "Network error deleting file";
      }
      toastError(message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpenDocument = async (documentId: string) => {
    setDownloadingId(documentId);
    try {
      const response = await patientDocumentService.getDocumentDownloadUrl(documentId);
      if (!response.downloadUrl) throw new Error("No download URL");
      window.open(response.downloadUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      let message = locale === "ar" ? "تعذر فتح الملف حالياً" : "Unable to open file right now";
      if (error instanceof Error && error.message) {
        if (error.message.includes("forbidden")) message = locale === "ar" ? "غير مصرح بفتح الملف" : "Not authorized to open file";
        else if (error.message.includes("network")) message = locale === "ar" ? "خطأ في الشبكة أثناء التحميل" : "Network error downloading file";
        else if (error.message.includes("No download URL")) message = locale === "ar" ? "رابط التحميل غير متوفر" : "Download link unavailable";
      }
      toastError(message);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleCloudinarySuccess = async (result: CloudinaryUploadWidgetResults) => {
    if (result.info && typeof result.info !== "string" && result.info.secure_url) {
      const secureUrl = result.info.secure_url;
      setIsUploadingImage(true);
      try {
        await authService.updateProfile({ avatarUrl: secureUrl });
        toastSuccess(locale === "ar" ? "تم تحديث الصورة الشخصية" : "Profile picture updated");
        await loadPatientData();
        useAuthStore.getState().bootSession(true);
      } catch (error) {
        let message = locale === "ar" ? "فشل تحديث الصورة" : "Failed to update photo";
        if (error instanceof Error && error.message && error.message.includes("network")) {
          message = locale === "ar" ? "خطأ في الشبكة أثناء رفع الصورة" : "Network error uploading photo";
        }
        toastError(message);
      } finally {
        setIsUploadingImage(false);
      }
    }
  };

  if (isLoadingPatient) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const patientName = locale === "ar"
    ? (patient?.fullNameAr || user?.nameAr || patient?.fullName || user?.name || "John Smith")
    : (patient?.fullName || user?.name || "John Smith");
  const chronicDiseases = (patient?.medicalHistory as Record<string, unknown>)?.chronicDiseases as string[] || [];

  return (
    <div className="space-y-4 w-full pb-10 px-1 mt-8 md:mt-0">
      <div className="hidden lg:block">
        <PageHeader
          title={t("profile")}
          description={locale === "ar" ? "إدارة معلوماتك الشخصية وتاريخك الطبي" : "Manage your personal and medical information"}
          action={
            <Button onClick={openEditModal} className="gap-2 bg-primary hover:bg-primary/90 transition-all shadow-md">
              <Edit3 className="h-4 w-4" /> {t("edit")}
            </Button>
          }
        />
      </div>

      {/* Mobile-only Profile View (Matches Image) */}
      <div className="lg:hidden space-y-4 -mt-4">
        <AnimatePresence mode="wait">
          {activeSection === "profile" ? (
            <motion.div
              key="mobile-menu"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <h1 className="text-2xl font-black text-slate-900 dark:text-slate-50 px-1 py-2">
                {locale === "ar" ? "الملف الشخصي" : "Profile"}
              </h1>

              {/* User Card */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-900 rounded-lg p-3 flex items-center gap-4 shadow-sm border border-slate-100 dark:border-slate-800"
                onClick={openMobilePersonalInfo}
              >
                <Avatar className="h-14 w-14 ring-4 ring-slate-50 dark:ring-slate-800">
                  <AvatarImage src={user?.avatarUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${patient?.email || user?.email || "User"}`} />
                  <AvatarFallback>{patientName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 truncate leading-tight">{patientName}</h3>
                  <p className="text-xs font-medium text-slate-400">
                    {patient?.dateOfBirth ? `${new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()} y.o.` : "Age not set"}
                    {patient?.dateOfBirth && ` (${new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(patient.dateOfBirth))})`}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-300" />
              </motion.div>

              {/* Menu List */}
              <div className="bg-white dark:bg-slate-900 rounded-md overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800">
                {SIDEBAR_ITEMS.map((item) => {
                  const ItemIcon = item.icon;

                  if (item.id === "profile") return null; // Profile is accessed via card above

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.isLogout) {
                          useAuthStore.getState().logout();
                        } else {
                          setActiveSectionWithUrl(item.id as SectionId);
                        }
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-5 py-3 transition-colors border-b border-slate-50 dark:border-slate-800 last:border-0",
                        item.isLogout
                          ? "hover:bg-rose-50 dark:hover:bg-rose-900/10"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      )}
                    >
                      <ItemIcon className={cn("h-6 w-6", SECTION_METADATA[item.id as SectionId].color)} strokeWidth={1.5} />
                      <span className={cn("flex-1 text-left rtl:text-right font-medium text-[15px]", item.isLogout ? "text-rose-500" : "text-slate-700 dark:text-slate-200")}>{locale === "ar" ? item.labelAr : item.label}</span>
                      <ChevronRight className="h-5 w-5 text-slate-300" />
                    </button>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={activeSection}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-0 z-[100] bg-slate-50 dark:bg-slate-950 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center p-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setActiveSectionWithUrl("profile")}
                  className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <ChevronLeft className="h-6 w-6 text-slate-600 dark:text-slate-300" />
                </button>
                <h2 className="flex-1 text-center text-lg font-bold text-slate-800 dark:text-slate-100 mr-10">
                  {locale === "ar" ? SECTION_METADATA[activeSection].labelAr : SECTION_METADATA[activeSection].label}
                </h2>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 pb-32">
                {renderSectionContent()}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showMobilePersonalInfo && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="lg:hidden fixed inset-0 z-[100] bg-slate-50 dark:bg-slate-950 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center p-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
              <button
                onClick={closeMobilePersonalInfo}
                className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ChevronLeft className="h-6 w-6 text-slate-600 dark:text-slate-300" />
              </button>
              <h2 className="flex-1 text-center text-lg font-bold text-slate-800 dark:text-slate-100 mr-10">
                {locale === "ar" ? "المعلومات الشخصية" : "Personal information"}
              </h2>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
              {/* Photo Section */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <Avatar className="h-28 w-28 ring-4 ring-white dark:ring-slate-900 shadow-xl">
                    <AvatarImage src={user?.avatarUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${patient?.email || user?.email || "User"}`} />
                    <AvatarFallback>{patientName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <CldUploadWidget
                    uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "default_preset"}
                    onSuccess={handleCloudinarySuccess}
                  >
                    {({ open }) => (
                      <button
                        onClick={() => open()}
                        disabled={isUploadingImage}
                        className="absolute bottom-0 right-0 h-9 w-9 bg-blue-600 rounded-full border-4 border-white dark:border-slate-900 flex items-center justify-center text-white shadow-lg disabled:opacity-50"
                      >
                        {isUploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4.5 w-4.5" />}
                      </button>
                    )}
                  </CldUploadWidget>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-600 dark:text-slate-400 ml-1">
                    {locale === "ar" ? "الاسم الكامل (بالإنجليزية)" : "Full Name (English)"}
                  </label>
                  <Input
                    value={editForm.fullName}
                    onChange={e => setEditForm(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="Enter full name in English"
                    className="h-14 rounded-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 px-6 font-medium focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-600 dark:text-slate-400 ml-1">
                    {locale === "ar" ? "الاسم الكامل (بالعربية)" : "Full Name (Arabic)"}
                  </label>
                  <Input
                    value={editForm.fullNameAr}
                    onChange={e => setEditForm(prev => ({ ...prev, fullNameAr: e.target.value }))}
                    dir="rtl"
                    placeholder="أدخل الاسم الكامل بالعربية"
                    className="h-14 rounded-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 px-6 font-medium focus:ring-4 focus:ring-blue-500/10 text-right"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-600 dark:text-slate-400 ml-1">
                    {t("dateOfBirth")}
                  </label>
                  <div className="relative">
                    <Input
                      type="date"
                      value={editForm.dateOfBirth}
                      onChange={e => setEditForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                      className="h-14 rounded-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 px-6 font-medium focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-600 dark:text-slate-400 ml-1">
                    {t("phone")}
                  </label>
                  <div className="flex gap-2">
                    <div className="h-14 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center px-4 gap-2 min-w-[100px]">
                      <span className="text-lg">🇪🇬</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">+20</span>
                      <ChevronRight className="h-4 w-4 text-slate-400 rotate-90" />
                    </div>
                    <Input
                      value={editForm.phone}
                      onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="000 000 0000"
                      className="h-14 rounded-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 px-6 font-medium flex-1 focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-600 dark:text-slate-400 ml-1">
                    {t("email")}
                  </label>
                  <Input
                    value={patient?.email || user?.email || ""}
                    disabled
                    placeholder="youremail@example.com"
                    className="h-14 rounded-full bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 px-6 font-medium text-slate-500 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-600 dark:text-slate-400 ml-1">
                    {locale === "ar" ? "الجنس" : "Gender"}
                  </label>
                  <div className="relative">
                    <select
                      value={editForm.gender}
                      onChange={e => setEditForm(prev => ({ ...prev, gender: e.target.value }))}
                      className="w-full h-14 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-6 font-medium appearance-none focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                    >
                      <option value="">{locale === "ar" ? "اختر الجنس" : "Enter or choose your gender"}</option>
                      <option value="male">{locale === "ar" ? "ذكر" : "Male"}</option>
                      <option value="female">{locale === "ar" ? "أنثى" : "Female"}</option>
                    </select>
                    <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 rotate-90" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-600 dark:text-slate-400 ml-1">
                    {t("address")}
                  </label>
                  <Input
                    value={editForm.address}
                    onChange={e => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Street Name, Building, Apartment"
                    className="h-14 rounded-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 px-6 font-medium focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="p-6 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md border-t border-slate-100 dark:border-slate-800">
              <Button
                onClick={handleUpdateProfile}
                disabled={isSaving}
                className="w-full h-14 rounded-full bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-lg shadow-xl shadow-blue-500/20 transition-all"
              >
                {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : (locale === "ar" ? "حفظ التغييرات" : "Save changes")}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="hidden lg:grid grid-cols-12 gap-3">
        {/* Desktop Sidebar Navigation */}
        <aside className="col-span-3">
          <div className="sticky top-6 space-y-3">
            <Card className="border border-slate-100 dark:border-slate-800 shadow-none bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[20px] overflow-hidden">
              <div className="flex flex-col gap-1 p-2">
                {SIDEBAR_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.isLogout) {
                          useAuthStore.getState().logout();
                        } else {
                          setActiveSectionWithUrl(item.id as SectionId);
                        }
                      }}
                      className={cn(
                        "relative flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 group",
                        isActive
                          ? "bg-blue-50 dark:bg-blue-900/20 text-[#4659ff]"
                          : item.isLogout
                            ? "text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                            : "text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-600 dark:hover:text-slate-300"
                      )}
                    >
                      <div className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                        isActive
                          ? "bg-white dark:bg-slate-900 shadow-none border border-blue-100 dark:border-blue-900/30"
                          : item.isLogout
                            ? "bg-rose-50 dark:bg-rose-900/20 group-hover:bg-white dark:group-hover:bg-rose-900/40"
                            : "bg-slate-50 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-700"
                      )}>
                        <Icon className={cn("h-5 w-5", isActive ? "text-[#4659ff]" : SECTION_METADATA[item.id as SectionId].color)} />
                      </div>

                      <span className={cn(
                        "font-black text-[13px] uppercase tracking-wider",
                        item.isLogout && "text-rose-500"
                      )}>
                        {locale === "ar" ? item.labelAr : item.label}
                      </span>

                      {isActive && (
                        <motion.div
                          layoutId="active-nav-indicator"
                          className={cn(
                            "absolute top-1/2 -translate-y-1/2 w-1.5 h-8 bg-[#4659ff] rounded-full",
                            locale === "ar" ? "left-0 rounded-r-none" : "right-0 rounded-l-none"
                          )}
                        >
                          <div className={cn(
                            "absolute top-1/2 -translate-y-1/2 w-1 h-3 bg-[#4659ff] rounded-full blur-[2px] opacity-50",
                            locale === "ar" ? "-right-1" : "-left-1"
                          )} />
                        </motion.div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Decorative design element */}
              <div className="mt-4 mx-2 mb-2 px-4 py-4 rounded-[16px] bg-gradient-to-br from-blue-600 to-indigo-700 text-white relative overflow-hidden group">
                <div className="relative z-10">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-80">MedFlow Premium</p>
                  <p className="text-sm font-black mb-3 leading-tight">Complete your health profile for better insights</p>
                  <Button className="h-8 rounded-full bg-white text-blue-600 hover:bg-blue-50 text-[10px] font-black px-4 transition-transform group-hover:scale-105">
                    UPGRADE NOW
                  </Button>
                </div>
                <div className="absolute top-0 right-0 -mr-4 -mt-4 h-24 w-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000" />
              </div>
            </Card>
          </div>
        </aside>

        {/* Desktop Profile Content */}
        <div className="col-span-9 space-y-3">
          <AnimatePresence mode="wait">
            {activeSection === "profile" ? (
              <motion.div
                key="profile-section"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3"
              >
                <Card className="p-4 border border-slate-100 dark:border-slate-800 shadow-none bg-gradient-to-r from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 rounded-[20px] overflow-hidden relative group">
                  <div className="relative z-10 flex items-center gap-4">
                    {/* Avatar Section */}
                    <div className="relative shrink-0">
                      <div className="relative inline-block group/avatar">
                        <Avatar className="h-20 w-20 ring-2 ring-primary/10 shadow-none transition-transform duration-500 group-hover:scale-105">
                          <AvatarImage src={user?.avatarUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${patient?.email || user?.email || "User"}`} />
                          <AvatarFallback className="text-lg font-black">{patientName.charAt(0)}</AvatarFallback>
                        </Avatar>

                        <CldUploadWidget
                          uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "default_preset"}
                          onSuccess={handleCloudinarySuccess}
                        >
                          {({ open }) => (
                            <button
                              onClick={() => open()}
                              disabled={isUploadingImage}
                              className="absolute bottom-2 right-2 h-9 w-9 bg-primary rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-white shadow-lg opacity-0 group-hover/avatar:opacity-100 transition-all hover:bg-primary/90 disabled:opacity-50"
                            >
                              {isUploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                            </button>
                          )}
                        </CldUploadWidget>

                        <div className="absolute -top-1 -right-1 h-6 w-6 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full shadow-sm z-10" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                      <div>
                        <h2 className="font-black text-2xl text-slate-900 dark:text-white leading-tight mb-0.5">{patientName}</h2>
                        <p className="text-muted-foreground text-xs font-medium">{patient?.email || user?.email}</p>
                      </div>

                      <div className="flex gap-2">
                        <Badge variant="secondary" className="px-4 py-1.5 font-bold text-[10px] uppercase tracking-wider bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border-none rounded-full">
                          {locale === "ar" ? "مريض" : "Patient"}
                        </Badge>
                        {patient?.bloodType && (
                          <Badge variant="outline" className="px-4 py-1.5 font-bold text-[10px] uppercase tracking-wider border-rose-100 bg-rose-50/30 text-rose-600 dark:border-rose-900/30 dark:text-rose-400 rounded-full">
                            <Droplet className="h-3 w-3 mr-1.5 inline" /> {patient.bloodType}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Background Decoration */}
                  <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute bottom-0 left-0 -ml-10 -mb-10 h-32 w-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
                </Card>

                <div className="grid grid-cols-1 gap-3">
                  {/* Personal Information Card - Desktop */}
                  <Card className="border border-slate-100 dark:border-slate-800 shadow-none overflow-hidden rounded-[20px] bg-white dark:bg-slate-900">
                    <CardHeader className="border-b border-slate-50 dark:border-slate-800/60 py-3 px-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600">
                            <User className="h-5 w-5" />
                          </div>
                          <CardTitle className="text-lg font-black uppercase tracking-tight">
                            {locale === "ar" ? "المعلومات الشخصية" : "Personal Details"}
                          </CardTitle>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={openEditModal}
                          className="h-9 rounded-full bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-500 hover:text-blue-600 font-bold text-[11px] uppercase tracking-wider px-4 transition-all"
                        >
                          <Edit3 className="h-3.5 w-3.5 mr-2" /> {t("edit")}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-5 space-y-3">
                      <div className="grid grid-cols-2 gap-x-5 gap-y-3">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em]">
                            {locale === "ar" ? "الاسم (EN)" : "Full Name (EN)"}
                          </label>
                          <p className="font-black text-slate-800 dark:text-slate-100 text-[15px]">{editForm.fullName}</p>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em]">
                            {locale === "ar" ? "الاسم (AR)" : "Full Name (AR)"}
                          </label>
                          <p className="font-black text-slate-800 dark:text-slate-100 text-[15px] text-right rtl:text-left" dir="rtl">{editForm.fullNameAr}</p>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em]">
                            {locale === "ar" ? "الجنس" : "Gender"}
                          </label>
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "h-2 w-2 rounded-full",
                              editForm.gender === "male" ? "bg-blue-500" : editForm.gender === "female" ? "bg-rose-500" : "bg-slate-300"
                            )} />
                            <p className="font-black text-slate-800 dark:text-slate-100 text-[15px] capitalize">
                              {editForm.gender || (locale === "ar" ? "غير محدد" : "Not specified")}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em]">
                            {t("dateOfBirth")}
                          </label>
                          <p className="font-black text-slate-800 dark:text-slate-100 text-[15px]">
                            {editForm.dateOfBirth ? new Date(editForm.dateOfBirth).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", { day: 'numeric', month: 'long', year: 'numeric' }) : "—"}
                          </p>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em]">
                            {t("phone")}
                          </label>
                          <p className="font-black text-slate-800 dark:text-slate-100 text-[15px] flex items-center gap-2">
                            <span className="text-xs opacity-50 font-normal">🇪🇬 +20</span> {editForm.phone}
                          </p>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em]">
                            {t("email")}
                          </label>
                          <p className="font-bold text-slate-500 dark:text-slate-400 text-[14px] truncate">{patient?.email || user?.email}</p>
                        </div>
                        <div className="col-span-2 space-y-1.5 pt-4 border-t border-slate-50 dark:border-slate-800/50">
                          <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em]">
                            {t("address")}
                          </label>
                          <p className="font-black text-slate-800 dark:text-slate-100 text-[14px] leading-relaxed">
                            {editForm.address || "No address provided"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Medical History Card */}
                  <Card className="border border-slate-100 dark:border-slate-800 shadow-none overflow-hidden rounded-[20px]">
                    <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                          <Activity className="h-6 w-6" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-black uppercase tracking-tight">{t("medicalHistory")}</CardTitle>
                          <CardDescription className="text-blue-100 text-xs font-medium">Your health profile at a glance</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-5 space-y-4">
                      {/* Chronic Diseases Section */}
                      <div className="space-y-3">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                          <Heart className="h-4 w-4 text-rose-500" />
                          {locale === "ar" ? "الأمراض المزمنة" : "Chronic Diseases"}
                        </label>
                        <div className="flex gap-2 flex-wrap">
                          {chronicDiseases.length > 0 ? (
                            chronicDiseases.map((disease: string) => (
                              <Badge key={disease} className="bg-rose-50 text-rose-600 border border-rose-100 px-3 py-1.5 font-bold text-[12px] hover:bg-rose-100 transition-all rounded-lg">
                                {disease}
                              </Badge>
                            ))
                          ) : (
                            <p className="text-sm text-slate-400 italic">No chronic diseases recorded</p>
                          )}
                        </div>
                      </div>

                      {/* Allergies Section */}
                      <div className="space-y-3">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-amber-500" />
                          {t("allergies")}
                        </label>
                        <div className="flex gap-2 flex-wrap">
                          {patient?.allergies && patient.allergies.length > 0 ? (
                            patient.allergies.map((allergy) => (
                              <Badge key={allergy} variant="warning" className="bg-amber-50 text-amber-700 border border-amber-100 px-3 py-1.5 font-bold text-[12px] rounded-lg">
                                {allergy}
                              </Badge>
                            ))
                          ) : (
                            <p className="text-sm text-slate-400 italic">No allergies recorded</p>
                          )}
                        </div>
                      </div>

                      {/* Emergency Contact */}
                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2">
                          {t("emergencyContact")}
                        </label>
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600">
                            <Phone className="h-5 w-5" />
                          </div>
                          <span className="font-black text-slate-700 dark:text-slate-200">
                            {(patient?.medicalHistory as Record<string, unknown>)?.emergencyContact as string || "No contact info available"}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Medical Files Gallery */}
                  <Card className="border border-slate-100 dark:border-slate-800 shadow-none overflow-hidden rounded-[20px]">
                    <CardHeader className="flex-row items-center justify-between border-b border-slate-50 dark:border-slate-800/60 py-3 px-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600">
                          <FileText className="h-5 w-5" />
                        </div>
                        <CardTitle className="text-lg font-black uppercase tracking-tight">
                          {locale === "ar" ? "الملفات الطبية" : "Medical Files"}
                        </CardTitle>
                      </div>
                      <Badge variant="secondary" className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold border-none">
                        {files.length} {locale === "ar" ? "ملف" : "files"}
                      </Badge>
                    </CardHeader>
                    <CardContent className="p-6">
                      {isLoadingDocuments ? (
                        <div className="flex flex-col items-center justify-center py-10 space-y-4">
                          <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
                          <p className="text-xs font-bold text-slate-400 animate-pulse uppercase tracking-widest">
                            {locale === "ar" ? "جاري تحميل الملفات..." : "Loading documents..."}
                          </p>
                        </div>
                      ) : files.length === 0 ? (
                        <div className="text-center py-12 px-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30 border-2 border-dashed border-slate-100 dark:border-slate-800">
                          <FileText className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                          <p className="text-sm font-bold text-slate-400 mb-1">
                            {locale === "ar" ? "لا توجد ملفات بعد" : "No medical files yet"}
                          </p>
                          <p className="text-xs text-slate-400">
                            {locale === "ar" ? "سوف تظهر ملفاتك الطبية هنا" : "Your medical documents will appear here"}
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {files.map((file) => (
                            <div
                              key={file.id}
                              className="group flex items-center gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900/50 hover:bg-white dark:hover:bg-slate-900 shadow-sm transition-all duration-300"
                            >
                              <div className="h-14 w-14 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 transition-colors group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20">
                                <FileText className="h-7 w-7 text-slate-400 group-hover:text-blue-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[14px] font-black text-slate-800 dark:text-slate-100 truncate mb-1">{file.name}</p>
                                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
                                  <span className="uppercase">{file.fileType || "doc"}</span>
                                  <span className="h-1 w-1 bg-slate-300 rounded-full" />
                                  <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => void handleOpenDocument(file.id)}
                                  disabled={downloadingId === file.id}
                                  className="h-9 w-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all"
                                >
                                  {downloadingId === file.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4.5 w-4.5" />}
                                </button>
                                <button
                                  onClick={() => void handleDeleteDocument(file.id)}
                                  disabled={deletingId === file.id}
                                  className="h-9 w-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-all"
                                >
                                  {deletingId === file.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4.5 w-4.5" />}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
              >
                {renderSectionContent()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>


      {/* Edit Profile Dialog */}
      <Dialog open={isEditModalOpen} onOpenChange={(open) => { if (!open) closeEditModal(); }}>
        <DialogContent className="max-w-3xl rounded-[32px] border-none shadow-2xl overflow-hidden p-0 bg-white dark:bg-slate-950">
          <DialogHeader className="px-8 py-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
            <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
              <Edit3 className="h-6 w-6" />
              {locale === "ar" ? "تعديل الملف الشخصي" : "Edit Health Profile"}
            </DialogTitle>
            <DialogDescription className="text-blue-100 font-medium">Update your medical information securely</DialogDescription>
          </DialogHeader>

          <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{locale === "ar" ? "الاسم الكامل (بالإنجليزية)" : "Full Name (English)"}</label>
                <Input
                  value={editForm.fullName}
                  onChange={e => setEditForm(prev => ({ ...prev, fullName: e.target.value }))}
                  className="h-12 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 font-bold focus:ring-4 focus:ring-blue-500/10"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{locale === "ar" ? "الاسم الكامل (بالعربية)" : "Full Name (Arabic)"}</label>
                <Input
                  value={editForm.fullNameAr}
                  onChange={e => setEditForm(prev => ({ ...prev, fullNameAr: e.target.value }))}
                  dir="rtl"
                  className="h-12 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 font-bold focus:ring-4 focus:ring-blue-500/10 text-right"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{t("phone")}</label>
                <Input
                  value={editForm.phone}
                  onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="h-12 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{t("dateOfBirth")}</label>
                <Input
                  type="date"
                  value={editForm.dateOfBirth}
                  onChange={e => setEditForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  className="h-12 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{locale === "ar" ? "فصيلة الدم" : "Blood Type"}</label>
                <Input
                  value={editForm.bloodType}
                  onChange={e => setEditForm(prev => ({ ...prev, bloodType: e.target.value }))}
                  className="h-12 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 font-bold placeholder:font-normal"
                  placeholder="e.g. O+"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{t("allergies")}</label>
                <Input
                  value={editForm.allergies.join(", ")}
                  onChange={e => setEditForm(prev => ({ ...prev, allergies: e.target.value.split(",").map(a => a.trim()).filter(Boolean) }))}
                  className="h-12 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 font-bold"
                  placeholder={locale === "ar" ? "افصل بين الحساسية بفاصلة" : "Separate allergies with commas"}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{locale === "ar" ? "الجنس" : "Gender"}</label>
                <select
                  value={editForm.gender}
                  onChange={e => setEditForm(prev => ({ ...prev, gender: e.target.value }))}
                  className="w-full h-12 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 font-bold focus:ring-4 focus:ring-blue-500/10 appearance-none"
                >
                  <option value="">{locale === "ar" ? "اختر الجنس" : "Choose gender"}</option>
                  <option value="male">{locale === "ar" ? "ذكر" : "Male"}</option>
                  <option value="female">{locale === "ar" ? "أنثى" : "Female"}</option>
                </select>
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-slate-50 dark:border-slate-800">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Heart className="h-4 w-4 text-rose-500" />
                {locale === "ar" ? "الأمراض المزمنة" : "Chronic Conditions"}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {CHRONIC_DISEASES.map(disease => {
                  const isSelected = editForm.chronicDiseases.includes(disease);
                  return (
                    <button
                      key={disease}
                      type="button"
                      onClick={() => toggleChronicDisease(disease)}
                      className={cn(
                        "flex items-center justify-between px-4 py-3 rounded-2xl border-2 text-[12px] font-black transition-all",
                        isSelected
                          ? "bg-rose-50 border-rose-500 text-rose-600 dark:bg-rose-950/20 shadow-sm"
                          : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:border-slate-200"
                      )}
                    >
                      {disease}
                      {isSelected ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4 opacity-30" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-slate-50 dark:border-slate-800">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{t("emergencyContact")}</label>
              <Input
                value={editForm.emergencyContact}
                onChange={e => setEditForm(prev => ({ ...prev, emergencyContact: e.target.value }))}
                className="h-14 rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-5 font-bold"
                placeholder={locale === "ar" ? "اسم وتليفون شخص للطوارئ" : "Emergency contact name and phone"}
              />
            </div>

            <div className="space-y-4 pt-6 border-t border-slate-50 dark:border-slate-800">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{t("address")}</label>
              <Input
                value={editForm.address}
                onChange={e => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                className="h-14 rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-5 font-bold"
                placeholder={locale === "ar" ? "عنوان السكن الحالي" : "Current residential address"}
              />
            </div>
          </div>

          <DialogFooter className="p-8 pt-0 flex gap-3">
            <Button
              variant="ghost"
              onClick={closeEditModal}
              className="flex-1 h-14 rounded-2xl font-black text-[15px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-all"
            >
              <X className="h-4 w-4 mr-2" /> {locale === "ar" ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              onClick={handleUpdateProfile}
              disabled={isSaving}
              className="flex-1 h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-[15px] shadow-xl shadow-blue-500/20 transition-all"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              {locale === "ar" ? "حفظ التغييرات" : "Save Profile"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    }>
      <ProfilePageContent />
    </Suspense>
  );
}
