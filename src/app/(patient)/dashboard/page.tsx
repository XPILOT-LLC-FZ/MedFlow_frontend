"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Calendar, Clock, User, Plus, Activity,
  FileText, AlertCircle, Search,
  Bell, ChevronRight, MessageSquare as MessageIcon,
  Heart, Stethoscope, Star, Brain, Baby, X,
  ChevronLeft, Sparkles,
  LayoutGrid
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle
} from "@/components/ui/dialog";
import { PatientSpecializationsDialog } from "@/components/shared/PatientSpecializationsDialog";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuthStore } from "@/stores/useAuthStore";
import { useBookingStore } from "@/stores/useBookingStore";
import { useToastStore } from "@/stores/useToastStore";
import { staffService } from "@/services/staffService";
import { servicesCatalogService } from "@/services/servicesCatalogService";
import type { ApiPublicDoctor, ApiDoctorCredential, ApiService, ApiLoyaltyTransaction } from "@/types";
import { LanguageToggle } from "@/components/shared/LanguageToggle";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { PatientNotificationsDialog } from "@/components/shared/PatientNotificationsDialog";
import { PatientDoctorsDialog } from "@/components/shared/PatientDoctorsDialog";
import { PatientAppointmentsDialog } from "@/components/shared/PatientAppointmentsDialog";
import { notificationsService } from "@/services/notificationsService";
import type { InAppNotification } from "@/types";
import { cn } from "@/lib/utils";
import { patientService } from "@/services/patientService";
import { usePatientStore } from "@/stores/usePatientStore";

export default function PatientDashboard() {
  const { locale, t } = useTranslation();
  const { user } = useAuthStore();
  const displayName = (locale === "ar" && user?.nameAr) ? user.nameAr : (user?.name || "");
  const { appointments } = useBookingStore();
  const toast = useToastStore();
  const patientId = user?.id ?? "guest";

  const [credentialDoctor, setCredentialDoctor] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [credentialItems] = useState<ApiDoctorCredential[]>([]);
  const [credentialLoading] = useState(false);
  const [previewingCredentialId, setPreviewingCredentialId] = useState<string | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notificationsList, setNotificationsList] = useState<InAppNotification[]>([]);
  const [publicDoctors, setPublicDoctors] = useState<ApiPublicDoctor[]>([]);
  const [services, setServices] = useState<ApiService[]>([]);
  const [, setLoadingDoctors] = useState(true);
  const [previewFile, setPreviewFile] = useState<{
    name: string;
    fileUrl: string;
    fileType?: string;
  } | null>(null);
  const [redeemOpen, setRedeemOpen] = useState(false);
  const [comingSoonModal, setComingSoonModal] = useState(false);
  const [specOpen, setSpecOpen] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);
  const [aptsOpen, setAptsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("latest");
  const [loyaltyHistory, setLoyaltyHistory] = useState<ApiLoyaltyTransaction[]>([]);
  const [isLoyaltyLoading, setIsLoyaltyLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { favoriteDoctorIds, toggleFavorite, fetchFavorites } = usePatientStore();

  const refreshNotifications = React.useCallback(async () => {
    try {
      const data = await notificationsService.getInAppNotifications();
      setNotificationsList(data);
    } catch (err) {
      console.error("Failed to fetch notifications in Dashboard", err);
    }
  }, []);

  const fetchLoyaltyHistory = React.useCallback(async () => {
    try {
      setIsLoyaltyLoading(true);
      const data = await patientService.getLoyaltyHistory();
      setLoyaltyHistory(data);
    } catch (error) {
      console.error("Failed to fetch loyalty history", error);
    } finally {
      setIsLoyaltyLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refreshNotifications();
    fetchLoyaltyHistory();
    fetchFavorites();

    const fetchData = async () => {
      try {
        const [docsData, servData, meData] = await Promise.all([
          staffService.getPublicDoctors(),
          servicesCatalogService.getAll(),
          patientService.getMe().catch(() => null)
        ]);
        setPublicDoctors(docsData);
        setServices(servData);
        if (meData && meData.loyaltyPoints !== undefined) {
          useAuthStore.getState().setUser({
            ...user!,
            loyaltyPoints: meData.loyaltyPoints
          });
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoadingDoctors(false);
      }
    };
    fetchData();
  }, [refreshNotifications, fetchLoyaltyHistory, fetchFavorites, user]);

  React.useEffect(() => {
    if (user?.id) {
      useBookingStore.getState().fetchAppointments({ patientId: user.id });
    }
  }, [user?.id]);

  const patientAppointments = appointments.filter((a) => a.patientId === patientId);
  const upcoming = patientAppointments
    .filter((a) => a.status === "scheduled" || a.status === "confirmed")
    .slice(0, 3);

  const openCredentialPreview = async (doctorId: string, credential: ApiDoctorCredential) => {
    if (credential.previewUrl) {
      setPreviewFile({
        name: credential.name,
        fileUrl: credential.previewUrl,
        fileType: credential.fileType || "application/pdf",
      });
      return;
    }

    setPreviewingCredentialId(credential.id);

    try {
      const result = await staffService.getPatientDoctorCredentialPreview(doctorId, credential.id);
      setPreviewFile({
        name: credential.name,
        fileUrl: result.previewUrl,
        fileType: credential.fileType || "application/pdf",
      });
    } catch {
      toast.error(t("failedToOpenCredential"));
    } finally {
      setPreviewingCredentialId(null);
    }
  };

  const firstName = displayName ? displayName.split(" ")[0] : "";

  const loyaltyPoints = useMemo(() => {
    if (loyaltyHistory.length > 0) {
      return loyaltyHistory.reduce((acc, item) => {
        return item.type === 'EARN' ? acc + Math.abs(item.amount) : acc - Math.abs(item.amount);
      }, 0);
    }
    return user?.loyaltyPoints ?? 0;
  }, [loyaltyHistory, user?.loyaltyPoints]);

  const allUpcomingApts = useMemo(() => {
    return appointments.filter(a => a.status === 'scheduled' || a.status === 'confirmed')
      .sort((a, b) => {
        const timeA = new Date(`${a.date}T${a.time || '00:00'}:00`).getTime();
        const timeB = new Date(`${b.date}T${b.time || '00:00'}:00`).getTime();
        return timeB - timeA; // Descending (New to Old)
      });
  }, [appointments]);

  const upcomingApt = useMemo(() => {
    return allUpcomingApts[0];
  }, [allUpcomingApts]);

  const recommendedDoctors = useMemo(() => {
    if (activeTab === "latest") return publicDoctors.slice(0, 6);
    return publicDoctors.filter(doc => {
      const spec = doc.specialization?.toLowerCase() || "";
      if (activeTab === "pediatricSpecialist") return spec.includes("pediatric");
      if (activeTab === "dermatologist") return spec.includes("dermatology") || spec.includes("dermatologist");
      if (activeTab === "surgeon") return spec.includes("surgeon");
      return true;
    }).slice(0, 6);
  }, [publicDoctors, activeTab]);

  const filteredDoctors = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return publicDoctors.filter(doc => 
      doc.fullName.toLowerCase().includes(q) || 
      (doc.specialization?.toLowerCase() || "").includes(q)
    );
  }, [publicDoctors, searchQuery]);

  // Deriving real specializations from services or unique doctor specializations
  const realSpecializations = useMemo(() => {
    if (services.length > 0) {
      return services.slice(0, 5).map(s => {
        const cat = s.category?.toUpperCase() || "";
        return {
          name: (() => {
            if (locale === "ar" && s.nameAr) return s.nameAr;
            const n = s.name.toLowerCase();
            if (n.includes("general consultation")) return t("generalConsultation");
            if (n.includes("dermatological exam")) return t("dermatologicalExam");
            if (n.includes("teeth whitening")) return t("professionalTeethWhitening");
            if (n.includes("laser hair removal")) return t("laserHairRemoval");
            return s.name;
          })(),
          icon: cat === "DENTAL" ? <Stethoscope className="h-6 w-6 text-blue-500" /> :
            cat === "DERMATOLOGY" ? <Activity className="h-6 w-6 text-emerald-500" /> :
              cat === "LASER" ? <LayoutGrid className="h-6 w-6 text-purple-500" /> :
                cat === "CONSULTATION" ? <Activity className="h-6 w-6 text-indigo-500" /> :
                  cat === "AESTHETIC" ? <Heart className="h-6 w-6 text-rose-500" /> :
                    cat === "WELLNESS" ? <Baby className="h-6 w-6 text-amber-500" /> :
                      <Activity className="h-6 w-6 text-indigo-500" />,
          bg: cat === "DENTAL" ? "bg-blue-50 dark:bg-blue-900/10" :
            cat === "DERMATOLOGY" ? "bg-emerald-50 dark:bg-emerald-900/10" :
              cat === "LASER" ? "bg-purple-50 dark:bg-purple-900/10" :
                cat === "CONSULTATION" ? "bg-indigo-50 dark:bg-indigo-900/10" :
                  cat === "AESTHETIC" ? "bg-rose-50 dark:bg-rose-900/10" :
                    cat === "WELLNESS" ? "bg-amber-50 dark:bg-amber-900/10" :
                      "bg-indigo-50 dark:bg-indigo-900/10",
          categoryName: s.category ? t(s.category.toLowerCase() as never) : t("medical")
        };
      });
    }

    // Fallback to hardcoded beautiful ones if no real services yet
    return [
      { name: t("dentist"), icon: <Stethoscope className="h-6 w-6 text-blue-500" />, bg: "bg-blue-50 dark:bg-blue-900/10", categoryName: t("dental") },
      { name: t("monologist"), icon: <Activity className="h-6 w-6 text-indigo-500" />, bg: "bg-indigo-50 dark:bg-indigo-900/10", categoryName: t("consultation") },
      { name: t("heart"), icon: <Heart className="h-6 w-6 text-rose-500" />, bg: "bg-rose-50 dark:bg-rose-900/10", categoryName: t("consultation") },
      { name: t("neuro"), icon: <Brain className="h-6 w-6 text-purple-500" />, bg: "bg-purple-50 dark:bg-purple-900/10", categoryName: t("consultation") },
      { name: t("pediatric"), icon: <Baby className="h-6 w-6 text-amber-500" />, bg: "bg-amber-50 dark:bg-amber-900/10", categoryName: t("consultation") },
    ];
  }, [services, locale, t]);


  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-6 pt-4 md:px-6">
      {/* MOBILE VERSION (md:hidden) */}
      <div className="flex flex-col gap-6 md:hidden">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
              {t("hi")} {firstName} 👋
            </h1>
            <p className="text-sm font-medium text-slate-400">
              {t("howIsYourHealth")}
            </p>
          </div>
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <button
              onClick={() => setNotifOpen(true)}
              className="relative h-9 w-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 dark:text-slate-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
            >
              <Bell className="h-5 w-5" />
              {notificationsList.filter(n => !n.readAt).length > 0 && (
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-rose-500 border-2 border-white dark:border-slate-900" />
              )}
            </button>
            <div className="w-px h-4 bg-slate-100 dark:bg-slate-800 mx-0.5" />
            <LanguageToggle variant="ghost" className="h-9 w-9 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800" />
            <div className="w-px h-4 bg-slate-100 dark:bg-slate-800 mx-0.5" />
            <ThemeToggle variant="ghost" className="h-9 w-9 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800" />
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative group">
          <Search className="absolute top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 transition-colors group-focus-within:text-blue-600 start-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("searchAnything" as never)}
            className="w-full h-14 rounded-2xl border-none bg-white dark:bg-slate-900 shadow-sm shadow-slate-200/50 dark:shadow-none text-sm font-medium transition-all ps-12 pe-6 text-start focus:ring-2 focus:ring-blue-600/10"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center text-slate-300 hover:text-slate-500 end-2"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Search Results */}
        {searchQuery && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">
                {t("searchResults" as never)} ({filteredDoctors.length})
              </h2>
            </div>
            <div className="flex flex-col gap-3">
              {filteredDoctors.length > 0 ? (
                filteredDoctors.map((doc) => (
                  <div key={doc.id} className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 relative group">
                    <div className="h-20 w-20 rounded-md overflow-hidden shrink-0">
                      <Image
                        src={doc.user?.avatarUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${doc.fullName}`}
                        alt={doc.fullName}
                        width={80}
                        height={80}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1 flex flex-col gap-1">
                      <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
                        Dr. {doc.fullName}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[12px] font-bold text-slate-400">
                        <span>{doc.specialization}</span>
                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                        <span>Medica Hospital</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-blue-600 mt-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="text-[12px] font-black uppercase tracking-tight">4.30 PM - 7.30 PM</span>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleFavorite(doc.id)}
                      className={cn(
                        "h-10 w-10 rounded-full border border-slate-100 dark:border-slate-800 flex items-center justify-center transition-all",
                        favoriteDoctorIds.includes(doc.id)
                          ? "text-rose-500 bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900/30"
                          : "text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                      )}
                    >
                      <Heart className={cn("h-5 w-5", favoriteDoctorIds.includes(doc.id) && "fill-current")} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center">
                  <Search className="h-8 w-8 mx-auto text-slate-200 mb-2" />
                  <p className="text-sm font-bold text-slate-400">{t("noResultsFound")}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {!searchQuery && (
          <>
            {/* Points Card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#6297FF] to-[#8C6AFF] p-5">
              <div className="relative z-10 flex flex-col items-start gap-1">
                <span className="text-white/90 text-base font-bold uppercase tracking-wider">
                  {t("yourWisePoints")}
                </span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-5xl font-black text-amber-400 drop-shadow-sm leading-tight">
                    {loyaltyPoints}
                  </span>
                  <span className="text-2xl font-black text-amber-400 uppercase tracking-tight">
                    {t("pts")}
                  </span>
                </div>

                <div className="mt-6 flex items-center gap-3 w-full">
                  <Link
                    href="/appointments"
                    className="w-1/2 h-10 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-lg shadow-blue-900/30 active:scale-95 transition-all uppercase tracking-widest text-[11px] flex items-center justify-center"
                  >
                    {t("redeemNow")}
                  </Link>
                  <button
                    onClick={() => setRedeemOpen(true)}
                    className="h-10 w-10 bg-white/20 hover:bg-white/30 text-white rounded-2xl flex items-center justify-center transition-all active:scale-95 shadow-lg"
                    title={t("activityHistory")}
                  >
                    <Clock className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="absolute top-4 w-[160px] h-[160px] pointer-events-none drop-shadow-2xl opacity-90 end-[-10px] rtl:-scale-x-100">
                <GiftBoxSVG />
              </div>
            </div>

            {/* Upcoming Appointment Card */}
            {upcomingApt && (
              <div
                onClick={() => setAptsOpen(true)}
                className="bg-blue-600 rounded-3xl py-4 px-5 text-white shadow-sm shadow-blue-500/10 relative overflow-hidden group active:scale-[0.98] transition-all cursor-pointer"
              >
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-black tracking-tight">{t("upcomingAppointments")}</h3>
                    <ChevronRight className="h-5 w-5 opacity-40 group-hover:opacity-100 transition-opacity" />
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 flex flex-col gap-3">
                      <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
                        <Calendar className="h-4.5 w-4.5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[13px] font-black leading-tight">
                          {new Date(upcomingApt.date).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'short', day: 'numeric', month: 'long' })}
                        </span>
                        <span className="text-[9px] opacity-60 font-bold uppercase tracking-wider mt-0.5">{t("appointmentsDate")}</span>
                      </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 flex flex-col gap-3">
                      <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
                        <Clock className="h-4.5 w-4.5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[13px] font-black leading-tight">
                          {upcomingApt.startTime} - {upcomingApt.endTime}
                        </span>
                        <span className="text-[9px] opacity-60 font-bold uppercase tracking-wider mt-0.5">{t("appointmentsTime")}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 rounded-lg p-3 flex items-center gap-3">
                    <div className="h-11 w-11 rounded-full overflow-hidden shrink-0 border-2 border-slate-50 dark:border-slate-800">
                      <Image
                        src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${upcomingApt.doctorName}`}
                        alt={upcomingApt.doctorName}
                        width={60}
                        height={60}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1 flex flex-col min-w-0">
                      <span className="text-slate-900 dark:text-slate-50 font-black text-sm truncate">Dr. {upcomingApt.doctorName}</span>
                      <span className="text-slate-400 font-bold text-[10px] uppercase tracking-tight">{t("internistSpecialistDoctor")}</span>
                    </div>
                    <button className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 active:scale-90 transition-all">
                      <MessageIcon className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>
                {/* Subtle background decoration */}
                <div className="absolute top-[-10%] right-[-5%] w-32 h-32 bg-white/5 rounded-full blur-2xl" />
              </div>
            )}

            {/* Popular Specializations */}
            <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">
              {t("popularSpecializations")}
            </h2>
            <button onClick={() => setSpecOpen(true)} className="text-[12px] font-black text-blue-600 uppercase tracking-wider">
              {t("seeAll")}
            </button>
          </div>

          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {realSpecializations.map((spec, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 pr-6 rounded-2xl shadow-sm min-w-max">
                <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center", spec.bg)}>
                  {spec.icon}
                </div>
                <span className="text-[15px] font-black text-slate-700 dark:text-slate-200">
                  {spec.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* All Doctors List */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">
              {t("allDoctors")}
            </h2>
            <button onClick={() => setDocsOpen(true)} className="text-[12px] font-black text-blue-600 uppercase tracking-wider">
              {t("seeAll")}
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {publicDoctors.slice(0, 2).map((doc) => (
              <div key={doc.id} className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 relative group">
                <div className="h-20 w-20 rounded-md overflow-hidden shrink-0">
                  <Image
                    src={doc.user?.avatarUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${doc.fullName}`}
                    alt={doc.fullName}
                    width={80}
                    height={80}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
                    Dr. {doc.fullName}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[12px] font-bold text-slate-400">
                    <span>{doc.specialization}</span>
                    <span className="h-1 w-1 rounded-full bg-slate-300" />
                    <span>Medica Hospital</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-blue-600 mt-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span className="text-[12px] font-black uppercase tracking-tight">4.30 PM - 7.30 PM</span>
                  </div>
                </div>
                <button
                  onClick={() => toggleFavorite(doc.id)}
                  className={cn(
                    "h-10 w-10 rounded-full border border-slate-100 dark:border-slate-800 flex items-center justify-center transition-all",
                    favoriteDoctorIds.includes(doc.id)
                      ? "text-rose-500 bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900/30"
                      : "text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                  )}
                >
                  <Heart className={cn("h-5 w-5", favoriteDoctorIds.includes(doc.id) && "fill-current")} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Doctors (Horizontal) */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">
              {t("recommendedDoctors")}
            </h2>
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {["Latest", "Pediatric Specialist", "Other"].map((tab, idx) => (
              <button
                key={idx}
                className={cn(
                  "px-5 h-10 rounded-2xl text-[13px] font-black transition-all border shrink-0",
                  idx === 0
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex gap-4 overflow-x-auto no-scrollbar">
            {publicDoctors.slice(0, 5).map((doc) => (
              <div key={doc.id} className="min-w-[280px] bg-white dark:bg-slate-900 rounded-[20px] overflow-hidden border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none flex flex-col group">
                <div className="relative h-[240px] bg-slate-50 dark:bg-slate-800/50">
                  <Image
                    src={doc.user?.avatarUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${doc.fullName}`}
                    alt={doc.fullName}
                    width={280}
                    height={240}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                    <div className="absolute top-4 end-4 flex flex-col gap-2">
                      <button
                        onClick={() => toggleFavorite(doc.id)}
                        className={cn(
                          "h-10 w-10 rounded-full backdrop-blur-md flex items-center justify-center transition-all border",
                          favoriteDoctorIds.includes(doc.id)
                            ? "bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20"
                            : "bg-white/80 dark:bg-slate-900/80 text-slate-400 border-white/20 hover:text-rose-500"
                        )}
                      >
                        <Heart className={cn("h-5 w-5", favoriteDoctorIds.includes(doc.id) && "fill-current")} />
                      </button>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-blue-600/90 backdrop-blur-md flex items-center justify-between px-4">
                      <span className="text-[13px] font-black text-white">Madelyn Hospital</span>
                      <div className="h-8 w-8 bg-white/20 rounded-lg flex items-center justify-center">
                        <Plus className="h-4 w-4 text-white" />
                      </div>
                    </div>
                </div>

                <div className="p-4 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">
                      Dr. {doc.fullName}
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                      <span className="text-sm font-black text-slate-700 dark:text-slate-200">4.5</span>
                    </div>
                  </div>
                  <p className="text-[13px] font-bold text-slate-400 mb-4">
                    {doc.specialization}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-black text-blue-600">AED {doc.consultationFee.toLocaleString()}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">/hours</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          </div>
              </>
            )}
      </div>

      {/* DESKTOP VERSION (hidden md:block) */}
      <div className="hidden md:flex flex-col gap-8">
        {/* Header Section */}
        <div className="flex flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-4xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
              {t("hi")} {firstName} 👋
            </h1>
            <p className="text-base font-medium text-slate-400">
              {t("howIsYourHealth")}
            </p>
          </div>

          <div className="flex lg:hidden items-center gap-3">
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <button
                onClick={() => setNotifOpen(true)}
                className="relative h-10 w-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 dark:text-slate-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
              >
                <Bell className="h-5 w-5" />
                {notificationsList.filter(n => !n.readAt).length > 0 && (
                  <span className="absolute top-2.5 right-2.5 h-2.5 w-2.5 rounded-full bg-rose-500 border-2 border-white dark:border-slate-900" />
                )}
              </button>
              <div className="w-px h-5 bg-slate-100 dark:bg-slate-800 mx-1" />
              <LanguageToggle variant="ghost" className="h-10 w-10 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800" />
              <div className="w-px h-5 bg-slate-100 dark:bg-slate-800 mx-1" />
              <ThemeToggle variant="ghost" className="h-10 w-10 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-8 space-y-8">
            {/* Search Bar */}
            <div className="relative group">
              <Search className="absolute top-1/2 -translate-y-1/2 h-6 w-6 text-slate-300 transition-colors group-focus-within:text-blue-600 start-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("searchAnything" as never)}
                className="w-full h-16 rounded-[24px] border-none bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/40 dark:shadow-none text-base font-medium focus:ring-4 focus:ring-blue-600/5 transition-all outline-none ps-14 pe-8 text-start"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center text-slate-300 hover:text-slate-500 end-4"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Search Results (Desktop) */}
            {searchQuery && (
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                    {t("searchResults" as never)} ({filteredDoctors.length})
                  </h2>
                </div>
                {filteredDoctors.length > 0 ? (
                  <div className="grid grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredDoctors.map((doc) => (
                      <div key={doc.id} className="bg-white dark:bg-slate-900 rounded-[48px] overflow-hidden border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none flex flex-col group hover:scale-[1.02] transition-transform duration-300">
                        <div className="relative h-[240px] bg-slate-50 dark:bg-slate-800/50">
                          <Image
                            src={doc.user?.avatarUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${doc.fullName}`}
                            alt={doc.fullName}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                          <div className="absolute top-5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 shadow-sm border border-white/20 start-5">
                            <div className="h-2.5 w-2.5 rounded-full bg-blue-600 animate-pulse" />
                            <span className="text-[11px] font-black text-blue-600 uppercase tracking-widest">Available</span>
                          </div>
                          <button
                            onClick={() => toggleFavorite(doc.id)}
                            className={cn(
                              "absolute top-5 end-5 h-10 w-10 rounded-full backdrop-blur-md flex items-center justify-center transition-all border",
                              favoriteDoctorIds.includes(doc.id)
                                ? "bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20"
                                : "bg-white/80 dark:bg-slate-900/80 text-slate-400 border-white/20 hover:text-rose-500"
                            )}
                          >
                            <Heart className={cn("h-5 w-5", favoriteDoctorIds.includes(doc.id) && "fill-current")} />
                          </button>
                        </div>
                        <div className="p-8 flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">
                              Dr. {doc.fullName}
                            </h3>
                            <div className="flex items-center gap-1.5">
                              <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                              <span className="text-base font-black text-slate-700 dark:text-slate-200">4.5</span>
                            </div>
                          </div>
                          <p className="text-[14px] font-bold text-slate-400 mb-6">
                            {doc.specialization}
                          </p>
                          <div className="flex items-baseline gap-1 mt-auto">
                            <span className="text-2xl font-black text-blue-600">AED {doc.consultationFee.toLocaleString()}</span>
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">/hours</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-slate-900 p-20 rounded-[48px] border-2 border-dashed border-slate-100 dark:border-slate-800 text-center">
                    <Search className="h-16 w-16 mx-auto text-slate-100 dark:text-slate-800 mb-4" />
                    <p className="text-xl font-black text-slate-400">{t("noResultsFound")}</p>
                  </div>
                )}
              </div>
            )}

            {!searchQuery && (
              <>
                {/* Popular Specializations */}
                <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                  {t("popularSpecializations")}
                </h2>
                <button onClick={() => setSpecOpen(true)} className="text-[13px] font-black text-blue-600 uppercase tracking-wider hover:underline">
                  {t("seeAll")}
                </button>
              </div>

              <div className="grid grid-cols-3 xl:grid-cols-5 gap-4">
                {realSpecializations.map((spec, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-[32px] shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                    <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center", spec.bg)}>
                      {spec.icon}
                    </div>
                    <span className="text-[15px] font-black text-slate-700 dark:text-slate-200 text-center">
                      {spec.name}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
                      {spec.categoryName}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Doctors (Grid) */}
            <div className="flex flex-col gap-5 pt-2">
              <div className="flex flex-col gap-1 px-1">
                <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                  {t("recommendedDoctors")}
                </h2>
              </div>

              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                {["latest", "pediatricSpecialist", "dermatologist", "surgeon"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "px-8 h-12 rounded-[18px] text-[14px] font-black transition-all border shrink-0",
                      activeTab === tab
                        ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20"
                        : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    )}
                  >
                    {t(tab as never)}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 xl:grid-cols-3 gap-6">
                {recommendedDoctors.map((doc) => (
                  <div key={doc.id} className="bg-white dark:bg-slate-900 rounded-[48px] overflow-hidden border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none flex flex-col group hover:scale-[1.02] transition-transform duration-300">
                    <div className="relative h-[240px] bg-slate-50 dark:bg-slate-800/50">
                      <Image
                        src={doc.user?.avatarUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${doc.fullName}`}
                        alt={doc.fullName}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute top-5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 shadow-sm border border-white/20 start-5">
                        <div className="h-2.5 w-2.5 rounded-full bg-blue-600 animate-pulse" />
                        <span className="text-[11px] font-black text-blue-600 uppercase tracking-widest">Available</span>
                      </div>

                      <button
                        onClick={() => toggleFavorite(doc.id)}
                        className={cn(
                          "absolute top-5 end-5 h-11 w-11 rounded-full backdrop-blur-md flex items-center justify-center transition-all border",
                          favoriteDoctorIds.includes(doc.id)
                            ? "bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20"
                            : "bg-white/80 dark:bg-slate-900/80 text-slate-400 border-white/20 hover:text-rose-500"
                        )}
                      >
                        <Heart className={cn("h-5 w-5", favoriteDoctorIds.includes(doc.id) && "fill-current")} />
                      </button>

                      <div className="absolute bottom-0 left-0 right-0 h-16 bg-blue-600/90 backdrop-blur-md flex items-center justify-between px-8">
                        <span className="text-[14px] font-black text-white">Madelyn Hospital</span>
                        <div className="h-9 w-9 bg-white/20 rounded-xl flex items-center justify-center">
                          <Plus className="h-5 w-5 text-white" />
                        </div>
                      </div>
                    </div>

                    <div className="p-8 flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">
                          Dr. {doc.fullName}
                        </h3>
                        <div className="flex items-center gap-1.5">
                          <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                          <span className="text-base font-black text-slate-700 dark:text-slate-200">4.5</span>
                        </div>
                      </div>
                      <p className="text-[14px] font-bold text-slate-400 mb-6">
                        {doc.specialization}
                      </p>
                      <div className="flex items-baseline gap-1 mt-auto">
                        <span className="text-2xl font-black text-blue-600">AED {doc.consultationFee.toLocaleString()}</span>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">/hours</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

          <aside className="col-span-4 space-y-8">
            {/* Points Card */}
            <div className="relative overflow-hidden rounded-[40px] bg-gradient-to-br from-[#6297FF] to-[#8C6AFF] p-10 shadow-2xl shadow-blue-500/30">
              <div className="relative z-10 flex flex-col items-start gap-1">
                <span className="text-white/90 text-lg font-bold uppercase tracking-wider">
                  {t("yourWisePoints")}
                </span>
                <div className="flex items-baseline gap-2 mt-4">
                  <span className="text-6xl font-black text-amber-400 drop-shadow-sm leading-tight">
                    {loyaltyPoints}
                  </span>
                  <span className="text-3xl font-black text-amber-400 uppercase tracking-tight">
                    {t("pts")}
                  </span>
                </div>

                <div className="mt-8 flex items-center gap-4 w-full">
                  <Link
                    href="/appointments"
                    className="flex-1 h-14 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-lg shadow-blue-900/30 active:scale-95 transition-all uppercase tracking-widest text-xs flex items-center justify-center"
                  >
                    {t("redeemNow")}
                  </Link>
                  <button
                    onClick={() => setRedeemOpen(true)}
                    className="h-14 w-14 bg-white/20 hover:bg-white/30 text-white rounded-2xl flex items-center justify-center transition-all active:scale-95 shadow-lg"
                    title={t("activityHistory")}
                  >
                    <Clock className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="absolute top-6 w-[200px] h-[200px] pointer-events-none drop-shadow-2xl opacity-90 end-[-20px] rtl:-scale-x-100">
                <GiftBoxSVG />
              </div>
            </div>

            {/* Upcoming Appointments */}
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                  {t("upcomingAppointments")}
                </h2>
                <Link href="/appointments" className="h-10 w-10 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-colors shadow-sm">
                  <ChevronRight className="h-6 w-6 rtl:rotate-180" />
                </Link>
              </div>

              <div className="flex flex-col gap-4">
                {upcoming.length > 0 ? (
                  upcoming.map((apt) => (
                    <div
                      key={apt.id}
                      className="bg-blue-600 rounded-[40px] p-8 text-white shadow-xl shadow-blue-500/20 hover:scale-[1.02] transition-transform cursor-pointer"
                    >
                      <div className="flex gap-4 mb-8">
                        <div className="flex-1 bg-white/10 backdrop-blur-md rounded-2xl p-5 flex flex-col gap-1 border border-white/10">
                          <Calendar className="h-6 w-6 opacity-60 mb-2" />
                          <span className="text-[15px] font-black">{apt.date}</span>
                          <span className="text-[11px] font-bold opacity-60 uppercase tracking-widest">Date</span>
                        </div>
                        <div className="flex-1 bg-white/10 backdrop-blur-md rounded-2xl p-5 flex flex-col gap-1 border border-white/10">
                          <Clock className="h-6 w-6 opacity-60 mb-2" />
                          <span className="text-[15px] font-black">{apt.startTime}</span>
                          <span className="text-[11px] font-bold opacity-60 uppercase tracking-widest">Time</span>
                        </div>
                      </div>

                      <div className="bg-white rounded-[24px] p-5 flex items-center justify-between shadow-lg shadow-blue-900/20">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden">
                            <User className="h-7 w-7 text-slate-400" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[15px] font-black text-slate-900">Dr. {apt.doctorName}</span>
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">Specialist</span>
                          </div>
                        </div>
                        <div
                          onClick={(e) => { e.stopPropagation(); setComingSoonModal(true); }}
                          className="h-11 w-11 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-colors"
                        >
                          <MessageIcon className="h-5 w-5" />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-[40px] p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800">
                    <Calendar className="h-12 w-12 mx-auto text-slate-200 dark:text-slate-700 mb-4" />
                    <p className="text-base font-black text-slate-400">{t("noUpcomingAppointments")}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Available Doctors */}
            <div className="flex flex-col gap-6 pt-4">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                  {t("availableDoctors")}
                </h2>
                <button onClick={() => setDocsOpen(true)} className="text-[12px] font-black text-blue-600 uppercase tracking-wider hover:underline">
                  {t("seeAll")}
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {publicDoctors.slice(0, 2).map((doc) => (
                  <div key={doc.id} className="bg-white dark:bg-slate-900 p-4 rounded-md border border-slate-100 dark:border-slate-800 flex items-center gap-5 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="h-20 w-20 rounded-[20px] overflow-hidden shrink-0">
                      <Image
                        src={doc.user?.avatarUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${doc.fullName}`}
                        alt={doc.fullName}
                        width={80}
                        height={80}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1 flex flex-col gap-1.5">
                      <h3 className="text-base font-black text-slate-800 dark:text-slate-100 leading-none">
                        Dr. {doc.fullName}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[12px] font-bold text-slate-400">
                        <span>{doc.specialization}</span>
                      </div>
                      <div className="flex items-center gap-2 text-blue-600 mt-1">
                        <Clock className="h-4 w-4" />
                        <span className="text-[12px] font-black uppercase tracking-widest">4.30 - 7.30 PM</span>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleFavorite(doc.id)}
                      className={cn(
                        "h-11 w-11 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-center transition-all",
                        favoriteDoctorIds.includes(doc.id)
                          ? "text-rose-500 bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900/30"
                          : "text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                      )}
                    >
                      <Heart className={cn("h-6 w-6", favoriteDoctorIds.includes(doc.id) && "fill-current")} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      <PatientDoctorsDialog
        isOpen={docsOpen}
        onOpenChange={setDocsOpen}
        doctors={publicDoctors}
      />

      <PatientAppointmentsDialog
        isOpen={aptsOpen}
        onOpenChange={setAptsOpen}
        appointments={allUpcomingApts}
      />
      <PatientNotificationsDialog
        isOpen={notifOpen}
        onOpenChange={setNotifOpen}
        notifications={notificationsList}
        onRefresh={refreshNotifications}
      />

      {/* Redeem Points Dialog */}
      <Dialog open={redeemOpen} onOpenChange={setRedeemOpen}>
        <DialogContent
          hideClose
          className={cn(
            "p-0 overflow-hidden border-none flex flex-col transition-all duration-300",
            "w-full h-full md:h-auto md:max-h-[80vh] md:max-w-lg md:rounded-[40px]",
            "bg-white dark:bg-slate-950 shadow-2xl"
          )}
        >
          <div className="md:hidden flex items-center px-6 py-5 shrink-0">
            <button onClick={() => setRedeemOpen(false)} className="h-10 w-10 -ml-2 rounded-full flex items-center justify-center text-slate-400">
              <ChevronLeft className="h-6 w-6" />
            </button>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex flex-col items-center justify-center px-10 py-2 text-center shrink-0">
              <DialogTitle className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight leading-tight">
                {t("yourWisePoints")}
              </DialogTitle>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-5xl font-black text-amber-500 drop-shadow-sm leading-tight">
                  {loyaltyPoints}
                </span>
                <span className="text-2xl font-black text-amber-500 uppercase tracking-tight">
                  {t("pts")}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-8 pb-8 no-scrollbar">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">
                  {t("activityHistory")}
                </h3>
              </div>

              {isLoyaltyLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{t("loading")}</span>
                </div>
              ) : loyaltyHistory.length > 0 ? (
                <div className="space-y-4">
                  {loyaltyHistory.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/50">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "h-12 w-12 rounded-2xl flex items-center justify-center text-xl shadow-sm",
                          item.type === 'EARN' ? "bg-blue-50 dark:bg-blue-900/20 text-blue-500" : "bg-rose-50 dark:bg-rose-900/20 text-rose-500"
                        )}>
                          {item.type === 'EARN' ? '✨' : '🎁'}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[14px] font-black text-slate-800 dark:text-slate-100 leading-tight">
                            {locale === 'ar' ? item.descriptionAr || item.description : item.description}
                          </span>
                          <span className="text-[11px] font-bold text-slate-400">
                            {new Date(item.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                      <div className={cn(
                        "text-lg font-black",
                        item.type === 'EARN' ? "text-blue-600" : "text-rose-600"
                      )}>
                        {item.type === 'EARN' ? '+' : '-'}{Math.abs(item.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-sm font-bold text-slate-400 italic">
                    {t("noActivityYet")}
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-950 flex flex-col gap-3 shrink-0">
              <Link
                href="/appointments"
                className="h-14 w-full rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-transform flex items-center justify-center"
              >
                {t("redeemNow")}
              </Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Unified File Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={(open) => !open && setPreviewFile(null)}>
        <DialogContent className="max-w-4xl h-[85vh] p-0 overflow-hidden bg-white dark:bg-slate-900 border-none rounded-[32px] shadow-2xl" hideClose={true}>
          <div className="flex flex-col h-full">
            <div className="p-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
              <div className="flex flex-col">
                <DialogTitle className="text-xl font-black text-slate-900 dark:text-white leading-tight">{previewFile?.name}</DialogTitle>
                <span className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Document Preview</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPreviewFile(null)}
                className="h-12 w-12 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="h-6 w-6 text-slate-400" />
              </Button>
            </div>
            <div className="flex-1 bg-slate-50 dark:bg-slate-950 p-4">
              {previewFile?.fileUrl ? (
                <div className="h-full w-full rounded-2xl overflow-hidden shadow-inner bg-white dark:bg-slate-900">
                  {previewFile.fileType?.includes("pdf") ? (
                    <iframe src={previewFile.fileUrl} className="w-full h-full border-none" title="PDF Preview" />
                  ) : (
                    <div className="flex items-center justify-center h-full p-8">
                      <Image
                        src={previewFile.fileUrl}
                        alt={previewFile.name}
                        width={800}
                        height={600}
                        className="max-h-full w-auto object-contain rounded-lg shadow-2xl"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full flex-col gap-4">
                  <AlertCircle className="h-16 w-16 text-rose-500 opacity-20" />
                  <p className="text-slate-400 font-bold">Failed to load preview</p>
                </div>
              )}
            </div>
            <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setPreviewFile(null)}
                className="h-12 px-8 rounded-2xl font-black text-sm uppercase tracking-widest"
              >
                {t("close")}
              </Button>
              {previewFile?.fileUrl && (
                <Button
                  onClick={() => window.open(previewFile.fileUrl, "_blank")}
                  className="h-12 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-500/20"
                >
                  {t("openInNewTab")}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Doctor Credentials Dialog */}
      <Dialog open={!!credentialDoctor} onOpenChange={(open) => !open && setCredentialDoctor(null)}>
        <DialogContent className="max-w-2xl bg-white dark:bg-slate-900 border-none rounded-[32px] p-0 overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
            <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
              {t("doctorCredentials", { name: credentialDoctor?.name || "" })}
            </DialogTitle>
            <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">Official Verification & Certifications</p>
          </div>
          <div className="p-8 max-h-[60vh] overflow-y-auto space-y-4 no-scrollbar">
            {credentialLoading ? (
              <div className="flex justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
              </div>
            ) : credentialItems.length === 0 ? (
              <p className="text-center text-slate-400 font-bold py-12">
                {t("noCredentialsFound")}
              </p>
            ) : (
              <div className="grid gap-4">
                {credentialItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-5 rounded-[24px] bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 group hover:border-blue-200 dark:hover:border-blue-900 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm border border-slate-100 dark:border-slate-800">
                        <FileText className="h-6 w-6" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[15px] font-black text-slate-800 dark:text-slate-100">{item.name}</span>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{item.credentialType.replace(/_/g, ' ')}</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-11 px-6 rounded-2xl font-black text-[12px] uppercase tracking-widest text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      onClick={() => openCredentialPreview(credentialDoctor?.id || "", item)}
                      disabled={previewingCredentialId === item.id}
                    >
                      {previewingCredentialId === item.id
                        ? t("opening")
                        : t("preview")}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="p-8 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <Button
              onClick={() => setCredentialDoctor(null)}
              className="h-12 px-10 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-sm uppercase tracking-widest shadow-xl"
            >
              {t("gotIt")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Popular Specializations Dialog */}
      <PatientSpecializationsDialog
        isOpen={specOpen}
        onOpenChange={setSpecOpen}
        services={services}
      />

      {/* Coming Soon Dialog */}
      <Dialog open={comingSoonModal} onOpenChange={setComingSoonModal}>
        <DialogContent className="max-w-[400px] bg-white dark:bg-slate-900 border-none rounded-[32px] p-0 overflow-hidden shadow-2xl">
          <div className="flex-1 flex flex-col items-center justify-center px-10 py-12 text-center">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full animate-pulse" />
              <div className="relative h-28 w-28 rounded-[32px] bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-2xl transform rotate-3">
                <Sparkles className="h-12 w-12 animate-spin-slow" />
              </div>
            </div>

            <DialogTitle className="text-3xl font-black text-slate-900 dark:text-slate-50 tracking-tight leading-tight">
              {t("comingSoon")}
            </DialogTitle>
            <p className="mt-4 text-[15px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed max-w-[280px]">
              {t("comingSoonDesc")}
            </p>

            <Button
              onClick={() => setComingSoonModal(false)}
              className="mt-10 h-14 w-full rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-sm uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-transform"
            >
              {t("gotIt")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <PatientDoctorsDialog
        isOpen={docsOpen}
        onOpenChange={setDocsOpen}
        doctors={publicDoctors}
      />
    </div>
  );
}

function GiftBoxSVG() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="giftRadial" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(100 110) rotate(90) scale(60)">
          <stop stopColor="white" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="110" r="60" fill="url(#giftRadial)" fillOpacity="0.4" />
      <path d="M40 90L100 120L160 90V140L100 170L40 140V90Z" fill="#7B61FF" stroke="#5D45DB" strokeWidth="2" />
      <path d="M100 120V170" stroke="#5D45DB" strokeWidth="2" />
      <g>
        <path d="M45 75L100 100L155 75L100 50L45 75Z" fill="#917AFF" />
        <path d="M45 75L100 100L155 75" stroke="#5D45DB" strokeWidth="2" />
      </g>
      <rect x="70" y="40" width="40" height="25" rx="4" transform="rotate(-15 70 40)" fill="#FFA500" stroke="#CC8400" strokeWidth="1.5" />
      <rect x="110" y="55" width="45" height="28" rx="4" transform="rotate(10 110 55)" fill="#FFD700" stroke="#CC8400" strokeWidth="1.5" />
      <path d="M160 40L162 45L167 46L162 47L160 52L158 47L153 46L158 45L160 40Z" fill="#FFD700" />
      <path d="M30 60L32 65L37 66L32 67L30 72L28 67L23 66L28 65L30 60Z" fill="#FFD700" />
    </svg>
  );
}