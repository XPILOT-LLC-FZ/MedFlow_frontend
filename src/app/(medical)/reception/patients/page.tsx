"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Clock,
  UserCheck,
  CreditCard,
  Search,
  ChevronDown,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Activity,
  MessageSquare,
  UserPlus,
  Edit2,
  Calendar as CalendarIcon,
  Sparkles,
  User as UserIcon,
  MapPin,
  ShieldCheck,
  Star,
  CheckCircle2,
  X,
  Plus,
  Loader2,
  Phone,
  Mail,
  Heart,
  Droplets,
  Activity as ActivityIcon,
  Monitor,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useToastStore } from "@/stores/useToastStore";
import { useBookingStore } from "@/stores/useBookingStore";
import { patientService } from "@/services/patientService";
import { staffService } from "@/services/staffService";
import { dashboardService } from "@/services/dashboardService";
import type { ApiPatient, ApiDoctor, PaginatedPatientsResponse, DashboardStaffSummaryData, CreatePatientPayload } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";
import { TranslationKey } from "@/lib/i18n";
import { useSearchParams, useRouter } from "next/navigation";

export default function ReceptionPatientsPage() {
  const { t, isRTL } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [view, setView] = useState<"list" | "new" | "details">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [patientsResponse, setPatientsResponse] = useState<PaginatedPatientsResponse | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardStaffSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [currentPage] = useState(1);
  const toast = useToastStore();

  // Handle deep linking from URL
  useEffect(() => {
    const id = searchParams.get("id");
    const viewParam = searchParams.get("view");
    if (id) {
      setSelectedPatientId(id);
      setView("details");
    } else if (viewParam === "new") {
      setView("new");
    } else {
      setView("list");
      setSelectedPatientId(null);
    }
  }, [searchParams]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [pRes, dRes] = await Promise.all([
        patientService.getPage({
          search: searchQuery,
          page: currentPage,
          take: 10,
        }),
        dashboardService.getStaffSummary({ period: "day" })
      ]);
      setPatientsResponse(pRes);
      setDashboardData(dRes);
    } catch (err) {
      console.error("Failed to fetch data", err);
      toast.error(t("error"));
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, currentPage, toast, t, searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const handleSelectPatient = (id: string) => {
    router.push(`/reception/patients?id=${id}`);
  };

  const handleBackToList = () => {
    const from = searchParams.get("from");
    if (from === "dashboard") {
      router.push("/reception/dashboard");
    } else {
      router.push("/reception/patients");
    }
  };

  if (view === "new") {
    return <AddNewPatientView onBack={handleBackToList} onSelectPatient={handleSelectPatient} />;
  }

  if (view === "details" && selectedPatientId) {
    return <PatientDetailsView id={selectedPatientId} onBack={handleBackToList} />;
  }

  const patients = patientsResponse?.data || [];
  const meta = patientsResponse?.meta;
  const summary = dashboardData?.summaryCards;
  const nextUp = dashboardData?.queue.nextAppointment;

  const activityLog = dashboardData?.activityLog.map(log => ({
    time: new Date(log.timestamp).toLocaleTimeString(isRTL ? "ar-EG" : "en-US", { hour: '2-digit', minute: '2-digit' }),
    title: log.title,
    desc: log.description,
    icon: log.type === 'APPOINTMENT' ? CalendarIcon : UserPlus,
    color: log.type === 'APPOINTMENT' ? "bg-blue-300" : "bg-blue-500",
  })) || [];

  const occupiedRooms = dashboardData?.doctorsStatus.filter(d => !d.isAvailable).length || 0;
  const totalRooms = dashboardData?.doctorsStatus.length || 8;

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="p-4 lg:p-8 space-y-6 md:space-y-8 bg-slate-50 min-h-screen pb-20">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">{t("patientsDirectory")}</h1>
          <p className="text-slate-400 text-[13px] md:text-sm font-medium">{t("managePatientRecords")}</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-3 px-4 py-2.5 bg-white border border-slate-100 rounded-2xl shadow-sm cursor-pointer hover:bg-slate-50 transition-colors shrink-0">
            <CalendarDays className="h-5 w-5 text-indigo-600" />
            <span className="text-[13px] md:text-[14px] font-bold text-slate-700 whitespace-nowrap">
              {new Date().toLocaleDateString(isRTL ? "ar-EG" : "en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
            </span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </div>
          <Button onClick={() => setView("new")} className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-11 md:h-12 px-6 md:px-8 font-bold shadow-lg shadow-blue-500/10">
            <Plus className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} /> {t("addNewPatient")}
          </Button>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard icon={Users} label={t("totalPatients")} value={isLoading ? "..." : (meta?.total?.toString() || "0")} iconBg="bg-blue-50" iconColor="text-blue-600" />
        <SummaryCard
          icon={Clock}
          label={t("completed")}
          value={isLoading ? "..." : (summary?.completed.toString() || "0")}
          iconBg="bg-orange-50"
          iconColor="text-orange-600"
          badge={t("liveUpdates")}
          badgeBg="bg-orange-50"
          badgeColor="text-orange-500"
        />
        <SummaryCard icon={UserCheck} label={t("waiting")} value={isLoading ? "..." : (summary?.scheduledConfirmed.toString() || "0")} iconBg="bg-purple-50" iconColor="text-purple-600" />
        <SummaryCard icon={CreditCard} label={t("dailyRevenue")} value={isLoading ? "..." : `${summary?.todayRevenue?.toLocaleString() || 0} ${isRTL ? "ج.م" : "L.E"}`} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
      </div>

      {/* Main Table Card */}
      <Card className="border-none shadow-[0_8px_40px_rgb(0,0,0,0.02)] rounded-[32px] overflow-hidden bg-white">
        <CardContent className="p-8 space-y-8">
          {/* Filter Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="relative w-full max-w-[400px]">
              <Search className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300", isRTL ? "right-4" : "left-4")} />
              <Input
                placeholder={isRTL ? "ابحث عن المرضى أو المهام..." : "Search tasks or patients..."}
                className={cn("h-12 rounded-2xl border-slate-100 bg-slate-50/20 focus:ring-blue-600/5 focus:border-blue-200", isRTL ? "pr-11 pl-4" : "pl-11 pr-4")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="h-10 px-4 bg-white border border-slate-100 rounded-xl flex items-center gap-2 text-[13px] font-bold text-slate-600 cursor-pointer hover:bg-slate-50 transition-all min-w-[140px] justify-between">
                <span>{t("allStates")}</span>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </div>
              <div className="h-10 px-4 bg-white border border-slate-100 rounded-xl flex items-center gap-2 text-[13px] font-bold text-slate-600 cursor-pointer hover:bg-slate-50 transition-all min-w-[140px] justify-between">
                <span>{t("allDoctors")}</span>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </div>
              <div className="h-10 px-4 bg-white border border-slate-100 rounded-xl flex items-center gap-2 text-[13px] font-bold text-slate-600 cursor-pointer hover:bg-slate-50 transition-all min-w-[140px] justify-between">
                <span>{t("allTime")}</span>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto no-scrollbar">
            <table className={cn("w-full border-collapse", isRTL ? "text-right" : "text-left")}>
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">{t("patientName")}</th>
                  <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">{t("phoneNumber")}</th>
                  <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">{t("email")}</th>
                  <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">{t("type")}</th>
                  <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">{t("status")}</th>
                  <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">{t("visits")}</th>
                  <th className={cn("px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest", isRTL ? "text-left" : "text-right")}>{t("actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-slate-400 font-medium">{t("loading")}</td>
                  </tr>
                ) : patients.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-slate-400 font-medium">{t("noPatientsFound")}</td>
                  </tr>
                ) : patients.map((item) => {
                    const appointment = dashboardData?.queue.upcoming.find(a => a.patientId === item.id);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-6">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-11 w-11 border-2 border-white shadow-sm">
                              <AvatarImage src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${item.fullName}`} />
                              <AvatarFallback className="bg-indigo-50 text-indigo-500 font-bold">{item.fullName.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="text-[15px] font-bold text-slate-800">{item.fullName}</span>
                              <span className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">PID: {item.id.slice(-6).toUpperCase()}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <span className="text-[14px] font-bold text-slate-700">{item.phone || "N/A"}</span>
                        </td>
                        <td className="px-6 py-6">
                          <span className="text-[14px] font-medium text-slate-500">{item.email || "N/A"}</span>
                        </td>
                        <td className="px-6 py-6 text-center">
                          <Badge className={cn(
                            "rounded-lg px-3 py-1 border-none font-black text-[10px] uppercase tracking-wider",
                            appointment ? "bg-[#EEF2FF] text-[#4F46E5]" : "bg-slate-50 text-slate-300"
                          )}>
                            {appointment?.serviceName || "N/A"}
                          </Badge>
                        </td>
                        <td className="px-6 py-6 text-center">
                          <Badge className={cn(
                            "border-none rounded-full px-4 py-1 font-bold text-[11px] shadow-sm",
                            !appointment ? "bg-slate-50 text-slate-300" :
                              appointment.status === "COMPLETED" ? "bg-slate-100 text-slate-400" :
                                appointment.status === "IN_PROGRESS" ? "bg-orange-50 text-orange-500" :
                                  appointment.status === "SCHEDULED" ? "bg-indigo-50 text-indigo-400" :
                                    "bg-blue-50 text-blue-500"
                          )}>
                            {appointment ? (
                              appointment.status === "SCHEDULED" ? "Ready for Checkout" :
                                appointment.status === "IN_PROGRESS" ? "In Session" :
                                  appointment.status === "COMPLETED" ? "Done" :
                                    appointment.status.charAt(0) + appointment.status.slice(1).toLowerCase().replace(/_/g, ' ')
                            ) : t("noAppointment")}
                          </Badge>
                        </td>
                        <td className="px-6 py-6 text-center">
                          <span className="text-[14px] font-bold text-slate-700">{item.totalVisits}</span>
                        </td>
                        <td className={cn("px-6 py-6", isRTL ? "text-left" : "text-right")}>
                          <div className={cn("flex items-center gap-3", isRTL ? "justify-start" : "justify-end")}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-xl px-4 font-bold text-[11px] h-9 border-slate-100 text-slate-400 hover:bg-slate-50 uppercase tracking-widest"
                              onClick={() => router.push(`/reception/booking?patientId=${item.id}`)}
                            >
                              {t("checkIn")}
                            </Button>
                            <Button
                              size="sm"
                              className="rounded-xl px-6 font-bold text-[11px] h-9 bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/10 uppercase tracking-widest"
                              onClick={() => handleSelectPatient(item.id)}
                            >
                              {t("details")}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-50">
            <p className="text-[13px] font-bold text-slate-400">
              {t("showingXofYResults", { start: 1, end: 10, total: meta?.total || 0 })}
            </p>
            <div className="flex items-center gap-2">
              <PaginationButton icon={isRTL ? ChevronRight : ChevronLeft} disabled />
              <PaginationNumber number={1} active />
              <PaginationNumber number={2} />
              <PaginationNumber number={3} />
              <span className="text-slate-300 px-1 font-bold">...</span>
              <PaginationNumber number={10} />
              <PaginationButton icon={isRTL ? ChevronLeft : ChevronRight} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
        <Card className="xl:col-span-3 border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-[32px] bg-white overflow-hidden">
          <CardContent className="p-8 space-y-10">
            <h2 className="text-[18px] font-bold text-slate-900">{t("recentActivity")}</h2>
            <div className={cn("relative space-y-12", isRTL ? "pr-4" : "pl-4")}>
              <div className={cn("absolute top-2 bottom-2 w-px bg-slate-100", isRTL ? "right-6" : "left-6")} />
              {activityLog.length === 0 ? (
                <div className="text-center text-slate-400 text-sm py-4">{t("noRecentActivity")}</div>
              ) : (
                activityLog.map((log, i) => (
                  <div key={i} className="relative flex gap-10">
                    <div className={cn("h-4 w-4 rounded-full mt-1.5 shrink-0 z-10 border-4 border-white shadow-sm ring-1 ring-slate-100", log.color)} />
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{log.time}</span>
                      <h4 className="text-[15px] font-bold text-slate-800">{log.title}</h4>
                      <p className="text-[13px] font-medium text-slate-400 max-w-xl">{log.desc}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <div className="xl:col-span-2 space-y-8">
          <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-[32px] bg-white overflow-hidden p-8 flex flex-col h-full justify-between">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-[18px] font-bold text-slate-900">{t("upNext")}</h2>
              <Sparkles className="h-5 w-5 text-indigo-400" />
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <div className="p-6 bg-slate-50 rounded-[24px] border border-slate-50 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14 border-2 border-white shadow-md">
                      <AvatarImage src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${nextUp?.patientName || "Guest"}`} />
                      <AvatarFallback>{nextUp?.patientName?.substring(0, 2).toUpperCase() || "PT"}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col overflow-hidden">
                      <h4 className="text-[16px] font-bold text-slate-900 truncate max-w-[150px]">{nextUp?.patientName || t("noPatientsInQueue")}</h4>
                      <p className="text-[12px] font-bold text-slate-400 mt-0.5">{nextUp?.serviceName || t("waitingRoom")}</p>
                    </div>
                  </div>
                  {nextUp && <span className="text-[12px] font-bold text-blue-600">{t("upNext")}</span>}
                </div>
                <div className="flex items-center gap-2 px-1">
                  <span className="text-[13px] font-bold text-slate-400">{t("scheduled")}:</span>
                  <span className="text-[13px] font-bold text-slate-800 font-mono">{nextUp?.time || "--:--"}</span>
                </div>
                <Button
                  onClick={() => router.push("/reception/waiting-room")}
                  disabled={!nextUp}
                  className="w-full bg-[#5046E5] hover:bg-[#4338CA] text-white rounded-2xl h-14 font-bold shadow-lg shadow-indigo-100 text-[15px]"
                >
                  {nextUp ? t("waitingRoom") : t("view") + " " + t("waitingRoom")}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-[32px] bg-white overflow-hidden">
        <CardContent className="p-8 space-y-10">
          <div className="flex items-center justify-between">
            <h2 className="text-[18px] font-bold text-slate-900">{t("providerStatus")}</h2>
            <span className="text-[12px] font-bold text-slate-400 tracking-widest uppercase">{occupiedRooms} / {totalRooms} {t("occupied")}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid grid-cols-1 gap-4">
              {dashboardData?.doctorsStatus.slice(0, Math.ceil(totalRooms / 2)).map((doc) => (
                <div key={doc.doctorId} className="p-5 bg-slate-50 border border-slate-50 rounded-2xl flex items-center justify-between transition-all hover:border-slate-200">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={doc.avatarUrl || ""} />
                      <AvatarFallback>{doc.fullName.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <span className="text-[14px] font-bold text-slate-800 truncate max-w-[120px]">{doc.fullName}</span>
                  </div>
                  <div className={cn("h-2.5 w-2.5 rounded-full shrink-0", !doc.isAvailable ? "bg-rose-500 shadow-sm" : "bg-blue-500 shadow-sm")} />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-4">
              {dashboardData?.doctorsStatus.slice(Math.ceil(totalRooms / 2)).map((doc) => (
                <div key={doc.doctorId} className="p-5 bg-slate-50 border border-slate-50 rounded-2xl flex items-center justify-between transition-all hover:border-slate-200">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={doc.avatarUrl || ""} />
                      <AvatarFallback>{doc.fullName.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <span className="text-[14px] font-bold text-slate-800 truncate max-w-[120px]">{doc.fullName}</span>
                  </div>
                  <div className={cn("h-2.5 w-2.5 rounded-full shrink-0", !doc.isAvailable ? "bg-rose-500 shadow-sm" : "bg-blue-500 shadow-sm")} />
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-6 pt-4 border-t border-slate-50">
            <div className="flex items-center gap-2.5"><div className="h-2.5 w-2.5 rounded-full bg-rose-500" /><span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{t("occupied")}</span></div>
            <div className="flex items-center gap-2.5"><div className="h-2.5 w-2.5 rounded-full bg-blue-500" /><span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{t("available")}</span></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Add New Patient View ──────────────────────────────────────── */

function AddNewPatientView({ onBack, onSelectPatient }: { onBack: () => void; onSelectPatient: (id: string) => void }) {
  const { t, isRTL } = useTranslation();
  const searchParams = useSearchParams();
  const isFromDashboard = searchParams.get("from") === "dashboard";
  const [isSaving, setIsSaving] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [doctors, setDoctors] = useState<ApiDoctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const toast = useToastStore();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    zipCode: "",
    insuranceProvider: "blue",
    insuranceMemberId: "",
    insurancePolicyNumber: "",
    emergencyContactName: "",
    emergencyRelationship: "spouse",
    emergencyPhone: "",
    notes: "",
  });
  const [isVip, setIsVip] = useState(false);
  const [isWalkIn, setIsWalkIn] = useState(false);
  const [similarPatients, setSimilarPatients] = useState<ApiPatient[]>([]);
  const [isLoadingSimilar, setIsLoadingSimilar] = useState(false);

  // Registration progress tracking
  const step1Complete = !!(formData.firstName && formData.lastName && formData.phone && formData.dateOfBirth && formData.gender);
  const step2Complete = !!(formData.insuranceMemberId || formData.insurancePolicyNumber);
  const step3Complete = !!(formData.emergencyContactName && formData.emergencyPhone);
  const currentStep = !step1Complete ? 1 : (!step2Complete ? 2 : (!step3Complete ? 3 : 4));

  useEffect(() => {
    const fetchSimilar = async () => {
      const nameQuery = `${formData.firstName} ${formData.lastName}`.trim();
      const phoneQuery = formData.phone?.trim();
      const emailQuery = formData.email?.trim();

      if (nameQuery.length < 3 && !phoneQuery && !emailQuery) {
        setSimilarPatients([]);
        return;
      }

      setIsLoadingSimilar(true);
      try {
        // Prefer searching by specific identifiers if available
        const query = phoneQuery || emailQuery || nameQuery;
        const res = await patientService.getAll({ search: query });
        setSimilarPatients(res.slice(0, 3));
      } catch (err) {
        console.error("Failed to fetch similar patients", err);
      } finally {
        setIsLoadingSimilar(false);
      }
    };
    const timer = setTimeout(fetchSimilar, 500);
    return () => clearTimeout(timer);
  }, [formData.firstName, formData.lastName, formData.phone, formData.email]);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const data = await staffService.getDoctors();
        setDoctors(data || []);
        if (data && data.length > 0) setSelectedDoctorId(data[0].id);
      } catch (err) {
        console.error("Failed to fetch doctors", err);
      }
    };
    void fetchDoctors();
  }, []);

  const handleSave = async () => {
    if (!formData.firstName || !formData.lastName || !formData.phone) {
      toast.error(t("fillRequired"));
      return;
    }

    if (isCheckingIn && !selectedDoctorId) {
      toast.error(isRTL ? "يرجى اختيار طبيب للإضافة إلى الانتظار" : "Please select a doctor to add to queue");
      return;
    }

    setIsSaving(true);
    try {
      let dobIso: string | undefined = undefined;
      if (formData.dateOfBirth) {
        const dobDate = new Date(formData.dateOfBirth);
        if (isNaN(dobDate.getTime())) {
          toast.error(isRTL ? "تاريخ الميلاد غير صالح (YYYY-MM-DD)" : "Invalid Date of Birth format (YYYY-MM-DD)");
          return;
        }
        dobIso = dobDate.toISOString();
      }

      const payload = {
        fullName: `${formData.firstName} ${formData.lastName}`,
        email: formData.email || undefined,
        phone: formData.phone,
        gender: (formData.gender?.toUpperCase() || "OTHER") as "MALE" | "FEMALE" | "OTHER",
        dateOfBirth: dobIso,
        vipTier: isVip ? "PLATINUM" : "STANDARD",
        medicalHistory: {
          address: {
            street: formData.address,
            city: formData.city,
            zip: formData.zipCode,
          },
          insuranceDetails: {
            provider: formData.insuranceProvider,
            memberId: formData.insuranceMemberId,
            policyNumber: formData.insurancePolicyNumber,
            verificationStatus: "pending",
          },
          emergencyContact: {
            name: formData.emergencyContactName,
            relationship: formData.emergencyRelationship,
            phone: formData.emergencyPhone,
          },
          notes: formData.notes,
        },
      };

      let createdPatient: ApiPatient;

      try {
        createdPatient = await patientService.create(payload as CreatePatientPayload);
      } catch (err: unknown) {
        const error = err as Error;
        // AUTO-RECOVERY: If patient exists, find them and proceed if we're checking in
        const message = error.message || "";
        if (message.toLowerCase().includes("already exists") && isCheckingIn) {
          const query = formData.phone || formData.email || `${formData.firstName} ${formData.lastName}`;
          const searchResults = await patientService.getAll({ search: query });
          const existing = searchResults.find(p =>
            (formData.phone && p.phone === formData.phone) ||
            (formData.email && p.email === formData.email)
          ) || searchResults[0];

          if (existing) {
            createdPatient = existing;
            toast.info(isRTL ? "المريض موجود بالفعل. يتم استخدامه للإضافة لقائمة الانتظار..." : "Patient already exists. Using existing record for check-in...");
          } else {
            throw err;
          }
        } else {
          throw err;
        }
      }

      if (isCheckingIn && selectedDoctorId) {
        const doctor = doctors.find(d => d.id === selectedDoctorId);
        const now = new Date();
        const startTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        await useBookingStore.getState().addAppointment({
          patientId: createdPatient.id,
          patientName: createdPatient.fullName,
          doctorId: selectedDoctorId,
          doctorName: doctor?.fullName || "Doctor",
          branchId: doctor?.branchId,
          date: now.toISOString().split('T')[0],
          time: startTime,
          status: "confirmed", // This is the CHECKED-IN status
          type: "CONSULTATION",
          mode: "ONSITE"
        });
        toast.success(isRTL ? "تمت إضافة المريض لقائمة الانتظار بنجاح" : "Patient added to queue successfully");
      } else {
        toast.success(t("patientAddedSuccessfully"));
      }

      onBack();
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Failed to save patient", error);
      const message = error.message || "";
      if (message.toLowerCase().includes("already exists")) {
        toast.error(isRTL ? "هذا المريض موجود بالفعل في هذه العيادة" : "A patient with this email/phone already exists in this clinic");
      } else {
        toast.error(t("failedToAddPatient"));
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="p-4 lg:p-8 space-y-10 bg-slate-50 min-h-screen pb-20 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[13px] font-bold text-slate-400">
            <span className="hover:text-blue-600 cursor-pointer transition-colors" onClick={onBack}>
              {isFromDashboard ? t("dashboard") : t("patient")}
            </span>
            {isRTL ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            <span className="text-slate-900">{t("addNewPatient")}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t("addNewPatient")}</h1>
          <p className="text-slate-400 text-[13px] font-medium">{t("registerNewVisitor")}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onBack} disabled={isSaving} className="rounded-xl font-bold text-slate-400 border-slate-100 bg-white hover:bg-slate-50 h-11 px-8">
            {t("cancel")}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 px-8 font-bold shadow-lg shadow-blue-500/10 flex items-center gap-2"
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSaving ? t("saving") : t("savePatient")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-10 gap-10">
        {/* Left Column: Forms */}
        <div className="xl:col-span-7 space-y-8">
          {/* 1. Patient Details */}
          <FormSection title={t("patientDetails")} icon={UserIcon}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField
                label={isRTL ? "الاسم الأول" : "First Name"}
                placeholder={isRTL ? "أدخل الاسم الأول" : "Enter first name"}
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
              <InputField
                label={isRTL ? "اسم العائلة" : "Last Name"}
                placeholder={isRTL ? "أدخل اسم العائلة" : "Enter last name"}
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
              <InputField
                label={t("dateOfBirth")}
                type="date"
                placeholder="YYYY-MM-DD"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              />
              <div className="space-y-2">
                <label className={cn("text-[12px] font-bold text-slate-400 uppercase tracking-widest", isRTL ? "mr-1" : "ml-1")}>{t("gender")}</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className={cn("flex h-12 w-full items-center justify-between rounded-[16px] border border-slate-100 bg-slate-50/50 px-4 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/5 focus:border-blue-200 transition-all", isRTL && "text-right")}
                >
                  <option value="">{isRTL ? "اختر النوع" : "Select Gender"}</option>
                  <option value="male">{t("male")}</option>
                  <option value="female">{t("female")}</option>
                  <option value="other">{t("other")}</option>
                </select>
              </div>
              <InputField
                label={t("phoneNumber")}
                placeholder="+20 1XX XXX XXXX"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              <InputField
                label={t("email")}
                placeholder="patient@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </FormSection>

          {/* 2. Address */}
          <FormSection title={t("address")} icon={MapPin}>
            <div className="space-y-6">
              <InputField
                label={t("streetAddress")}
                placeholder={isRTL ? "عنوان الشارع بالتفصيل" : "123 Medical Plaza"}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField
                  label={t("city")}
                  placeholder={isRTL ? "القاهرة" : "Cairo"}
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
                <InputField
                  label={t("zipCode")}
                  placeholder="62704"
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                />
              </div>
            </div>
          </FormSection>

          {/* 3. Insurance Information */}
          <FormSection title={t("insuranceAndCoverage")} icon={ShieldCheck}>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className={cn("text-[12px] font-bold text-slate-400 uppercase tracking-widest", isRTL ? "mr-1" : "ml-1")}>{t("insuranceProvider")}</label>
                <select
                  value={formData.insuranceProvider}
                  onChange={(e) => setFormData({ ...formData, insuranceProvider: e.target.value })}
                  className={cn("flex h-12 w-full items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-2 text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600/5 transition-all", isRTL && "text-right")}
                >
                  <option value="blue">Blue Shield</option>
                  <option value="aetna">Aetna</option>
                  <option value="cigna">Cigna</option>
                  <option value="other">{t("other")}</option>
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField
                  label={t("memberId")}
                  placeholder="MEMBER-123"
                  value={formData.insuranceMemberId}
                  onChange={(e) => setFormData({ ...formData, insuranceMemberId: e.target.value })}
                />
                <InputField
                  label={t("policyNumber")}
                  placeholder="POL-889"
                  value={formData.insurancePolicyNumber}
                  onChange={(e) => setFormData({ ...formData, insurancePolicyNumber: e.target.value })}
                />
              </div>
            </div>
          </FormSection>

          {/* 4. Emergency Contact */}
          <FormSection title={t("emergencyContacts")} icon={ShieldCheck}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <InputField
                label={t("contactName")}
                placeholder={isRTL ? "اسم جهة الاتصال" : "Jane Doe"}
                value={formData.emergencyContactName}
                onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
              />
              <div className="space-y-2">
                <label className={cn("text-[12px] font-bold text-slate-400 uppercase tracking-widest", isRTL ? "mr-1" : "ml-1")}>{t("relationship")}</label>
                <select
                  value={formData.emergencyRelationship}
                  onChange={(e) => setFormData({ ...formData, emergencyRelationship: e.target.value })}
                  className={cn("flex h-12 w-full items-center justify-between rounded-[16px] border border-slate-100 bg-slate-50/50 px-4 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/5 focus:border-blue-200 transition-all", isRTL && "text-right")}
                >
                  <option value="spouse">{isRTL ? "زوج/زوجة" : "Spouse"}</option>
                  <option value="parent">{isRTL ? "أب/أم" : "Parent"}</option>
                  <option value="sibling">{isRTL ? "أخ/أخت" : "Sibling"}</option>
                  <option value="child">{isRTL ? "ابن/ابنة" : "Child"}</option>
                  <option value="friend">{isRTL ? "صديق" : "Friend"}</option>
                  <option value="other">{t("other")}</option>
                </select>
              </div>
              <InputField
                label={t("phoneNumber")}
                placeholder="+20 1XX XXX XXXX"
                value={formData.emergencyPhone}
                onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
              />
            </div>
          </FormSection>

          {/* 5. Additional Notes */}
          <FormSection title={t("additionalNotes")} icon={MessageSquare}>
            <textarea
              placeholder={t("clinicalNotesInstructions")}
              rows={5}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className={cn("w-full rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-4 text-[14px] font-medium text-slate-700 placeholder:text-slate-300 resize-none focus:outline-none focus:ring-2 focus:ring-blue-50 focus:border-blue-200 transition-all", isRTL && "text-right")}
            />
          </FormSection>

          {/* 6. Quick Check-in (Add to Queue) */}
          <FormSection title={isRTL ? "خيارات قائمة الانتظار" : "Queue Options"} icon={Clock}>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-6 bg-blue-50/50 border border-blue-100 rounded-[24px]">
                <div className="space-y-1">
                  <h4 className="text-[15px] font-bold text-slate-900">{isRTL ? "إضافة لقائمة الانتظار فوراً" : "Add to Queue Immediately"}</h4>
                  <p className="text-[12px] font-medium text-slate-500">{isRTL ? "سيتم تسجيل المريض كوصول (Check-in) فور الحفظ" : "Patient will be checked-in automatically upon saving"}</p>
                </div>
                <button
                  onClick={() => setIsCheckingIn(!isCheckingIn)}
                  className={cn(
                    "relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none",
                    isCheckingIn ? "bg-blue-600" : "bg-slate-200"
                  )}
                >
                  <span className={cn(
                    "inline-block h-5 w-5 transform rounded-full bg-white transition-transform",
                    isCheckingIn ? (isRTL ? "-translate-x-6" : "translate-x-6") : (isRTL ? "-translate-x-1" : "translate-x-1")
                  )} />
                </button>
              </div>

              {isCheckingIn && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="space-y-2">
                    <label className={cn("text-[12px] font-bold text-slate-400 uppercase tracking-widest", isRTL ? "mr-1" : "ml-1")}>{t("doctor")}</label>
                    <select
                      value={selectedDoctorId}
                      onChange={(e) => setSelectedDoctorId(e.target.value)}
                      className={cn("flex h-12 w-full items-center justify-between rounded-xl border border-slate-100 bg-white px-4 py-2 text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600/5 transition-all", isRTL && "text-right")}
                    >
                      {doctors.map(doc => (
                        <option key={doc.id} value={doc.id}>{doc.fullName} ({doc.specialization})</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className={cn("text-[12px] font-bold text-slate-400 uppercase tracking-widest", isRTL ? "mr-1" : "ml-1")}>{t("type")}</label>
                    <div className="h-12 flex items-center px-4 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-400">
                      {isRTL ? "كشف (Walk-in)" : "Walk-in Consultation"}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </FormSection>

          {/* Patient Consent */}
          <div className="flex items-start gap-4 p-6 bg-slate-50 border border-slate-100 rounded-2xl">
            <input type="checkbox" id="consent" className="mt-1 h-4 w-4 rounded border-slate-200 accent-blue-600 cursor-pointer shrink-0" />
            <label htmlFor="consent" className={cn("text-[13px] font-bold text-slate-700 cursor-pointer leading-relaxed", isRTL && "text-right")}>
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-1">{t("patientConsentTitle")}</span>
              {t("patientConsentDesc")}
            </label>
          </div>

          {/* Bottom Action Buttons */}
          <div className={cn("flex items-center gap-4 pt-4", isRTL ? "justify-start" : "justify-end")}>
            <button
              onClick={onBack}
              disabled={isSaving}
              className="h-12 px-8 rounded-xl border border-slate-100 bg-white text-[13px] font-bold text-slate-400 hover:bg-slate-50 transition-all"
            >
              {t("cancel")}
            </button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="h-12 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/10 text-[13px] flex items-center gap-2"
            >
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSaving ? t("saving") : t("savePatient")}
            </Button>
          </div>
        </div>

        {/* Right Column: Widgets */}
        <div className="xl:col-span-3 space-y-8">
          {/* QUICK TAGS */}
          <Card className="border-none shadow-[0_4px_20px_rgb(0,0,0,0.01)] rounded-[24px] bg-white overflow-hidden p-6 space-y-6">
            <h3 className="text-[11px] font-black text-slate-300 uppercase tracking-widest">{t("quickTags")}</h3>
            <div className="flex flex-wrap gap-2">
              <Badge
                onClick={() => setIsVip(!isVip)}
                className={cn(
                  "border-none rounded-lg px-3 py-1.5 font-bold text-[11px] flex items-center gap-1.5 shadow-sm cursor-pointer transition-all",
                  isVip ? "bg-[#FFFBEB] text-[#D97706] scale-105" : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                )}
              >
                <Star className={cn("h-3 w-3", isVip && "fill-current")} /> VIP
              </Badge>
              <Badge
                onClick={() => setIsWalkIn(!isWalkIn)}
                className={cn(
                  "border-none rounded-lg px-3 py-1.5 font-bold text-[11px] flex items-center gap-1.5 shadow-sm cursor-pointer transition-all",
                  isWalkIn ? "bg-[#ECFDF5] text-[#059669] scale-105" : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                )}
              >
                <Activity className="h-3 w-3" /> {t("walkIn")}
              </Badge>
              <button className="h-8 px-3 rounded-lg border border-slate-100 text-[11px] font-bold text-slate-400 flex items-center gap-1.5 hover:bg-slate-50 transition-all">
                <Plus className="h-3 w-3" /> {t("addTag")}
              </button>
            </div>
          </Card>

          {/* SIMILAR RECORDS */}
          <Card className="border-none shadow-[0_4px_20px_rgb(0,0,0,0.01)] rounded-[24px] bg-white overflow-hidden p-6 space-y-6">
            <div className="space-y-1">
              <h3 className="text-[11px] font-black text-slate-300 uppercase tracking-widest">{t("similarRecords", { count: similarPatients.length })}</h3>
              <p className="text-[10px] font-bold text-slate-400 leading-tight">
                {isLoadingSimilar ? t("checkingForExistingPatients") : (similarPatients.length > 0 ? t("potentialMatchesFound") : t("noMatchesFound"))}
              </p>
            </div>

            <div className="space-y-3">
              {similarPatients.length === 0 ? (
                <div className="p-8 border-2 border-dashed border-slate-50 rounded-[20px] flex flex-col items-center justify-center text-center space-y-2 opacity-50">
                  <Users className="h-6 w-6 text-slate-300" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("noMatches")}</p>
                </div>
              ) : (
                similarPatients.map((p, idx) => (
                  <div
                    key={p.id}
                    onClick={() => onSelectPatient(p.id)}
                    className={cn(
                      "p-4 border rounded-[20px] flex items-center justify-between cursor-pointer transition-all hover:shadow-md hover:bg-blue-50/50",
                      idx === 0 ? "bg-amber-50/50 border-amber-200" : "bg-slate-50/50 border-slate-100"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                        <AvatarImage src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${p.fullName}`} />
                        <AvatarFallback className="bg-blue-600 text-white text-[12px] font-bold">{p.fullName.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-[13px] font-bold text-slate-900 leading-tight">{p.fullName}</span>
                        <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase">DOB: {p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString() : "N/A"}</span>
                      </div>
                    </div>
                    <span className={cn("text-[11px] font-black", idx === 0 ? "text-[#D97706]" : "text-slate-300")}>
                      {90 - (idx * 20)}% match
                    </span>
                  </div>
                ))
              )}
            </div>
            <p className="text-[10px] font-medium text-slate-400 text-center leading-relaxed italic px-2">
              {t("returningPatientInstruction")}
            </p>
          </Card>

          {/* REGISTRATION PROGRESS */}
          <Card className="border-none shadow-[0_4px_20px_rgb(0,0,0,0.01)] rounded-[24px] bg-white overflow-hidden p-6 space-y-6">
            <h3 className="text-[11px] font-black text-slate-300 uppercase tracking-widest">{t("registrationProgress")}</h3>
            <div className="space-y-6 pl-1">
              <ProgressItem
                active={currentStep === 1}
                completed={step1Complete}
                label={t("personalDetails")}
                number={1}
              />
              <ProgressItem
                active={currentStep === 2}
                completed={step2Complete}
                label={t("insuranceAndCoverage")}
                number={2}
              />
              <ProgressItem
                active={currentStep === 3}
                completed={step3Complete}
                label={t("emergencyContacts")}
                number={3}
              />
              <ProgressItem
                active={currentStep === 4}
                completed={false}
                label={t("confirmation")}
                number={4}
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

interface FormSectionProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}

function FormSection({ title, icon: Icon, children }: FormSectionProps) {
  return (
    <Card className="border-none shadow-[0_4px_20px_rgb(0,0,0,0.01)] rounded-[32px] bg-white overflow-hidden p-8 space-y-8">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-[14px] bg-blue-50 flex items-center justify-center border border-blue-100 shadow-sm">
          <Icon className="h-5 w-5 text-blue-600" />
        </div>
        <h2 className="text-[14px] font-black text-slate-800 uppercase tracking-[0.1em]">{title}</h2>
      </div>
      {children}
    </Card>
  );
}

interface InputFieldProps {
  label: string;
  placeholder: string;
  icon?: React.ElementType;
  value?: string;
  type?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function InputField({ label, placeholder, icon: Icon, value, type = "text", onChange }: InputFieldProps) {
  const { isRTL } = useTranslation();
  return (
    <div className="space-y-2.5">
      <label className={cn("text-[11px] font-black text-slate-400 uppercase tracking-[0.1em]", isRTL ? "mr-1" : "ml-1")}>{label}</label>
      <div className={cn("relative", isRTL && "text-right")}>
        <Input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={cn("h-12 rounded-[16px] border-slate-100 bg-slate-50/50 focus:ring-blue-600/5 focus:border-blue-200 transition-all text-sm font-bold text-slate-700 placeholder:text-slate-300", isRTL && "text-right")}
        />
        {Icon && <Icon className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300", isRTL ? "left-4" : "right-4")} />}
      </div>
    </div>
  );
}

interface ProgressItemProps {
  label: string;
  number: number;
  active?: boolean;
  completed?: boolean;
}

function ProgressItem({ label, number, active, completed }: ProgressItemProps) {
  return (
    <div className="flex items-center gap-4 group">
      <div className={cn(
        "h-8 w-8 rounded-full flex items-center justify-center text-[13px] font-black transition-all",
        completed ? "bg-emerald-500 text-white" : (active ? "bg-blue-600 text-white shadow-lg shadow-blue-500/10" : "bg-slate-50 text-slate-300")
      )}>
        {completed ? <CheckCircle2 className="h-5 w-5" /> : number}
      </div>
      <span className={cn(
        "text-[13px] font-bold transition-colors",
        completed || active ? "text-slate-800" : "text-slate-300"
      )}>{label}</span>
    </div>
  );
}

/* ── Original Sub-components ──────────────────────────────────────────── */

interface SummaryCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  iconBg: string;
  iconColor: string;
  badge?: string;
  badgeBg?: string;
  badgeColor?: string;
}

function SummaryCard({ icon: Icon, label, value, iconBg, iconColor, badge, badgeBg, badgeColor }: SummaryCardProps) {
  return (
    <Card className="border-none shadow-[0_4px_20px_rgb(0,0,0,0.01)] rounded-[24px] bg-white overflow-hidden transition-all hover:shadow-md">
      <CardContent className="p-6 md:p-8 flex items-center gap-6">
        <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shrink-0", iconBg)}>
          <Icon className={cn("h-7 w-7", iconColor)} />
        </div>
        <div className="flex flex-col gap-1 overflow-hidden">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-slate-400 whitespace-nowrap">{label}</span>
            {badge && (
              <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-lg whitespace-nowrap uppercase tracking-tighter", badgeBg, badgeColor)}>
                {badge}
              </span>
            )}
          </div>
          <h3 className="text-3xl font-black text-slate-900 tracking-tighter truncate">{value}</h3>
        </div>
      </CardContent>
    </Card>
  );
}

function TableFilter({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 px-5 py-3 bg-white border border-slate-100 rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors whitespace-nowrap">
      <span className="text-[13px] font-bold text-slate-500">{label}</span>
      <ChevronDown className="h-4 w-4 text-slate-400" />
    </div>
  );
}


interface PaginationButtonProps {
  icon: React.ElementType;
  disabled?: boolean;
}

function PaginationButton({ icon: Icon, disabled }: PaginationButtonProps) {
  return (
    <button
      disabled={disabled}
      className={cn(
        "h-10 w-10 flex items-center justify-center rounded-xl border border-slate-100 transition-all",
        disabled ? "bg-slate-50 text-slate-100 cursor-not-allowed" : "bg-white text-slate-400 hover:border-blue-600 hover:text-blue-600 shadow-sm"
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function PaginationNumber({ number, active }: { number: number; active?: boolean }) {
  return (
    <button
      className={cn(
        "h-10 w-10 flex items-center justify-center rounded-xl font-bold text-[14px] transition-all",
        active ? "bg-blue-600 text-white shadow-lg shadow-blue-500/10" : "text-slate-500 hover:bg-slate-100"
      )}
    >
      {number}
    </button>
  );
}

/* ── Patient Details View ──────────────────────────────────────── */

function PatientDetailsView({ id, onBack }: { id: string; onBack: () => void }) {
  const { t, isRTL } = useTranslation();
  const searchParams = useSearchParams();
  const isFromDashboard = searchParams.get("from") === "dashboard";
  const [patient, setPatient] = useState<ApiPatient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [inputDiscountPercent, setInputDiscountPercent] = useState<number>(20);
  const [inputDiscountNote, setInputDiscountNote] = useState<string>("");
  const toast = useToastStore();

  const fetchDetails = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await patientService.getById(id);
      setPatient(data);
    } catch (err) {
      console.error("Failed to fetch patient details", err);
      toast.error(t("error"));
      onBack();
    } finally {
      setIsLoading(false);
    }
  }, [id, onBack, toast, t]);

  useEffect(() => {
    void fetchDetails();
  }, [fetchDetails]);

  useEffect(() => {
    if (patient) {
      const mh = (patient.medicalHistory as Record<string, unknown>) || {};
      const insurance = (mh.insuranceDetails as Record<string, unknown>) || {};
      setInputDiscountPercent((insurance.discountPercent as number) || 20);
      setInputDiscountNote((insurance.discountNote as string) || "Verified via insurance portal");
    }
  }, [patient]);

  const handleVerifyInsurance = async (status: 'verified' | 'rejected' | 'pending') => {
    try {
      await patientService.verifyInsurance(id, {
        status: status === 'pending' ? 'verified' : status as "verified" | "rejected",
        verifiedBy: "Reception Staff",
        discountPercent: status === 'verified' ? inputDiscountPercent : 0,
        discountNote: status === 'verified' ? inputDiscountNote : "Provider rejected coverage"
      });
      toast.success(status === 'verified' ? t("insuranceApprovedSuccessfully") : t("insuranceRejectedSuccessfully"));
      void fetchDetails();
    } catch {
      toast.error(t("failedToVerifyInsurance"));
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!patient) return null;

  const mh = (patient.medicalHistory as Record<string, unknown>) || {};
  const insurance = (mh.insuranceDetails as Record<string, unknown>) || {};
  const emergency = (mh.emergencyContact as Record<string, unknown>) || {};
  const allergies = (mh.allergies as Array<{ name: string; severity: string; notes?: string }>) || [];
  const currentMeds = (mh.currentMedications as Array<{ name: string; dosage: string }>) || [];
  const vitals = (mh.vitals as Record<string, string>) || {};

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="p-4 lg:p-8 space-y-8 bg-slate-50 min-h-screen pb-20 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[13px] font-bold text-slate-400">
            <span className="hover:text-blue-600 cursor-pointer transition-colors" onClick={onBack}>
              {isFromDashboard ? t("dashboard") : t("patient")}
            </span>
            {isRTL ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            <span className="text-slate-900">{t("patientDetails")}</span>
          </div>
          <h1 className="text-[22px] font-bold text-slate-900">{t("patientDetails")}</h1>
          <p className="text-slate-400 text-[13px] font-medium">{t("managePatientRecords")}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onBack} className="rounded-xl border-slate-100 bg-white font-bold text-slate-400 hover:bg-slate-50 h-11 px-8 text-[13px]">
            {t("back")}
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 px-8 font-bold shadow-lg shadow-blue-500/10 text-[13px]">
            {t("edit")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-10 gap-8">
        {/* Left Column */}
        <div className="xl:col-span-7 space-y-8">
          {/* Patient Hero Card */}
          <Card className="border-none shadow-[0_4px_20px_rgb(0,0,0,0.02)] rounded-[28px] bg-white overflow-hidden">
            <CardContent className="p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6 text-center sm:text-left">
                <Avatar className="h-16 w-16 md:h-20 md:w-20 border-4 border-white shadow-lg">
                  <AvatarImage src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${patient.fullName}`} />
                  <AvatarFallback className="text-xl font-bold bg-blue-50 text-blue-600">{patient.fullName.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className={cn("space-y-1.5 md:space-y-2", isRTL ? "sm:text-right" : "sm:text-left")}>
                  <h2 className="text-[18px] md:text-[20px] font-bold text-slate-900">{patient.fullName}</h2>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1">
                    <span className="text-[11px] md:text-[12px] font-bold text-slate-400 uppercase tracking-tighter">ID: #PT-{patient.id.slice(-6).toUpperCase()}</span>
                    {patient.dateOfBirth && (
                      <span className="text-[11px] md:text-[12px] font-bold text-slate-400">
                        {t("dateOfBirth")}: {new Date(patient.dateOfBirth).toLocaleDateString(isRTL ? "ar-EG" : "en-US")} ({new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()} {t("years")})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-center sm:justify-start gap-4">
                    <span className="text-[11px] md:text-[12px] font-bold text-slate-500">{t("bloodType")}: {patient.bloodType || "N/A"}</span>
                    <span className="text-[11px] md:text-[12px] font-bold text-slate-500">{t("gender")}: {t(patient.gender?.toLowerCase() as TranslationKey) || "N/A"}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center sm:items-end gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 md:h-11 md:w-11 rounded-2xl bg-[#5046E5] flex items-center justify-center cursor-pointer hover:bg-[#4338CA] transition-all shadow-md shadow-indigo-100">
                    <Phone className="h-5 w-5 text-white" />
                  </div>
                  <div className="h-10 w-10 md:h-11 md:w-11 rounded-2xl bg-[#5046E5] flex items-center justify-center cursor-pointer hover:bg-[#4338CA] transition-all shadow-md shadow-indigo-100">
                    <Mail className="h-5 w-5 text-white" />
                  </div>
                </div>
                <Badge className="bg-slate-50 text-slate-500 border-slate-100 font-bold rounded-xl px-3 py-1.5 text-[10px] uppercase tracking-widest">
                  {t("bookedByHim")}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Medical History */}
          <Card className="border-none shadow-[0_4px_20px_rgb(0,0,0,0.02)] rounded-[28px] bg-white overflow-hidden">
            <CardContent className="p-8 space-y-8">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-indigo-600" />
                </div>
                <h3 className="text-[16px] font-bold text-slate-900">{t("medicalHistory")}</h3>
              </div>

              {/* Existing Conditions */}
              <div className="space-y-4">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{t("chronicDiseases")}</label>
                <div className="flex flex-wrap items-center gap-2">
                  {(mh.conditions as string[] || []).length === 0 ? (
                    <span className="text-sm text-slate-400 font-medium italic">{t("none")}</span>
                  ) : (
                    (mh.conditions as string[]).map((cond) => (
                      <div key={cond} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg">
                        <span className="text-[13px] font-bold text-slate-700">{cond}</span>
                        <X className="h-3 w-3 text-slate-400 cursor-pointer hover:text-slate-600" />
                      </div>
                    ))
                  )}
                  <Input placeholder={t("search")} className="w-[220px] h-9 rounded-lg border-slate-100 bg-slate-50 text-[13px]" />
                  <button className="h-9 w-9 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors">
                    <Plus className="h-4 w-4 text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Medications + Allergies Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Current Medications */}
                <div className="space-y-4">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{t("prescribedMedications")}</label>
                  <div className="space-y-3">
                    {currentMeds.length === 0 ? (
                      <p className="text-sm text-slate-400 font-medium italic">{t("none")}</p>
                    ) : (
                      currentMeds.map((med, i) => (
                        <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-b-0">
                          <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                          <div>
                            <p className="text-[14px] font-bold text-slate-800">{med.name}</p>
                            <p className="text-[11px] font-medium text-slate-400">{med.dosage}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Known Allergies */}
                <div className="space-y-4">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{t("allergies")}</label>
                  <div className="space-y-3">
                    {allergies.length === 0 ? (
                      <p className="text-sm text-slate-400 font-medium italic">{t("none")}</p>
                    ) : (
                      allergies.map((allergy, i) => (
                        <div key={i} className={cn("p-4 rounded-xl border", allergy.severity === "High" ? "bg-rose-50 border-rose-100" : "bg-slate-50 border-slate-100")}>
                          <p className={cn("text-[14px] font-bold", allergy.severity === "High" ? "text-rose-600" : "text-slate-700")}>{allergy.name}</p>
                          <p className={cn("text-[11px] font-medium mt-0.5", allergy.severity === "High" ? "text-rose-400" : "text-slate-400")}>{allergy.notes || t("none")}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Insurance Verification & Billing */}
          <Card className="border-none shadow-[0_4px_20px_rgb(0,0,0,0.02)] rounded-[28px] bg-white overflow-hidden">
            <CardContent className="p-8 space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5 text-indigo-600" />
                  </div>
                  <h3 className="text-[16px] font-bold text-slate-900">{t("insuranceAndCoverage")}</h3>
                </div>
                <Badge className={cn(
                  "rounded-full px-4 py-1.5 border-none font-black text-[10px] uppercase tracking-widest flex items-center gap-1.5",
                  insurance.verificationStatus === "verified" ? "bg-emerald-50 text-emerald-600" :
                    insurance.verificationStatus === "rejected" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
                )}>
                  {insurance.verificationStatus === "verified" ? <CheckCircle2 className="h-3.5 w-3.5" /> :
                    insurance.verificationStatus === "rejected" ? <X className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                  {String(insurance.verificationStatus || t("pending")).toUpperCase()}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Left: Provider Details */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{t("insuranceProvider")}</label>
                    <p className="text-[15px] font-bold text-slate-900">{String(insurance.provider || "N/A")}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{t("category")}</label>
                    <p className="text-[15px] font-bold text-slate-800">{String(insurance.category || "N/A")}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{t("policyNumber")}</label>
                    <p className="text-[15px] font-bold text-slate-800 font-mono">{String(insurance.policyNumber || "N/A")}</p>
                  </div>
                </div>

                {/* Right: Coverage Details */}
                <div className="space-y-6">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{t("details")}</label>
                  <div className="flex items-center justify-between py-2 border-b border-slate-50">
                    <span className="text-[13px] font-bold text-slate-500">{t("discountPercent")}</span>
                    <span className="text-[14px] font-black text-slate-800">{String(insurance.discountPercent || "0")}%</span>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{t("notes")}</label>
                    <p className="text-[13px] font-medium text-slate-600 italic">
                      &quot;{String(insurance.discountNote || t("none"))}&quot;
                    </p>
                  </div>

                  {insurance.verificationStatus !== "verified" ? (
                    <div className="flex flex-col gap-4 pt-2">
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{t("discountPercent")}</label>
                          <div className="relative">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={inputDiscountPercent}
                              onChange={(e) => setInputDiscountPercent(Number(e.target.value))}
                              className="h-10 rounded-xl border-slate-100 bg-slate-50 text-[13px] font-black pr-8"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{t("notes")}</label>
                          <Input
                            value={inputDiscountNote}
                            onChange={(e) => setInputDiscountNote(e.target.value)}
                            placeholder="e.g. Verified via insurance portal"
                            className="h-10 rounded-xl border-slate-100 bg-slate-50 text-[13px] font-medium"
                          />
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          onClick={() => handleVerifyInsurance("verified")}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-11 font-bold text-[13px] shadow-lg shadow-emerald-500/10"
                        >
                          {t("approve")}
                        </Button>
                        <Button
                          onClick={() => handleVerifyInsurance("rejected")}
                          variant="outline"
                          className="flex-1 border-rose-100 text-rose-500 hover:bg-rose-50 rounded-xl h-11 font-bold text-[13px]"
                        >
                          {t("rejected")}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleVerifyInsurance("pending")}
                      className="text-[13px] font-bold text-blue-600 hover:text-blue-700 transition-colors underline underline-offset-2"
                    >
                      {t("refresh")}
                    </button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="xl:col-span-3 space-y-8">
          {/* Live Health Trends */}
          <Card className="border-none shadow-[0_4px_20px_rgb(0,0,0,0.02)] rounded-[28px] bg-white overflow-hidden">
            <CardContent className="p-8 space-y-8">
              <h3 className="text-[16px] font-bold text-slate-900">{t("vitalsTrend")}</h3>
              <div className="space-y-4">
                <VitalRow
                  icon={Heart}
                  label={t("heartRate")}
                  value={vitals.heartRate || "72"}
                  unit="BPM"
                  color="text-[#3b82f6]"
                  bgColor="bg-[#eff6ff]"
                />
                <VitalRow
                  icon={Monitor}
                  label={t("bloodPressure")}
                  value={vitals.bp || "128/82"}
                  unit="mmHg"
                  color="text-[#6366f1]"
                  bgColor="bg-[#eef2ff]"
                />
                <VitalRow
                  icon={Droplets}
                  label={isRTL ? "السكر" : "Glucose"}
                  value={vitals.glucose || "94"}
                  unit="mg/dL"
                  color="text-[#d97706]"
                  bgColor="bg-[#fffbeb]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card className="border-none shadow-[0_4px_20px_rgb(0,0,0,0.02)] rounded-[28px] bg-white overflow-hidden">
            <CardContent className="p-8 space-y-6">
              <h3 className="text-[16px] font-bold text-slate-900">{t("emergencyContacts")}</h3>
              <div className="p-5 bg-slate-50 border border-slate-100 rounded-[20px] space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[15px] font-bold text-slate-900">{String(emergency.name || "N/A")}</h4>
                  <button className="h-8 w-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center hover:bg-slate-50 transition-colors">
                    <Edit2 className="h-3.5 w-3.5 text-slate-400" />
                  </button>
                </div>
                <p className="text-[12px] font-bold text-slate-400 -mt-2">{String(emergency.relationship || t("none"))}</p>
                <div className={cn("space-y-2", isRTL ? "text-right" : "text-left")}>
                  <div className="flex items-center gap-2 text-[12px] font-bold text-slate-500">
                    <span>📞</span> {String(emergency.phone || "N/A")}
                  </div>
                  <div className="flex items-center gap-2 text-[12px] font-bold text-slate-500">
                    <span>✉️</span> {String(emergency.email || "N/A")}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowEmergencyModal(true)}
                className="flex items-center gap-2 text-[13px] font-bold text-blue-600 hover:text-blue-700 transition-colors w-full justify-center py-2"
              >
                <Plus className="h-4 w-4" /> {t("edit")}
              </button>
            </CardContent>
          </Card>
        </div>
      </div>

      {showEmergencyModal && <AddEmergencyContactModal onClose={() => setShowEmergencyModal(false)} />}
    </div>
  );
}

interface VitalRowProps {
  icon: React.ElementType;
  label: string;
  value: string;
  unit: string;
  color: string;
  bgColor: string;
}

function VitalRow({ icon: Icon, label, value, unit, color, bgColor }: VitalRowProps) {
  const { isRTL } = useTranslation();
  return (
    <div className="flex items-center justify-between p-5 rounded-[24px] bg-[#f8fafc]/50 border border-transparent hover:border-slate-100 transition-all group">
      <div className="flex items-center gap-4">
        <div className={cn("h-11 w-11 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105", bgColor)}>
          <Icon className={cn("h-5 w-5", color)} />
        </div>
        <span className="text-[14px] font-bold text-slate-400 group-hover:text-slate-500 transition-colors">{label}</span>
      </div>
      <div className={cn("flex items-baseline gap-1.5", isRTL ? "flex-row-reverse" : "flex-row")}>
        <span className="text-[22px] font-black text-slate-800 tracking-tighter">{value}</span>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{unit}</span>
      </div>
    </div>
  );
}

function AddEmergencyContactModal({ onClose }: { onClose: () => void }) {
  const { t, isRTL } = useTranslation();
  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[200] flex items-center justify-center p-6">
      <div className="w-full max-w-[420px] bg-white rounded-[24px] shadow-2xl overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-indigo-50 flex items-center justify-center">
              <UserPlus className="h-4 w-4 text-indigo-600" />
            </div>
            <h2 className="text-[17px] font-bold text-slate-900">{t("emergencyContacts")}</h2>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-xl hover:bg-slate-50 flex items-center justify-center transition-colors">
            <X className="h-4 w-4 text-slate-400" />
          </button>
        </div>

        {/* Form Body */}
        <div className="px-8 pt-6 pb-4 space-y-5 max-h-[70vh] overflow-y-auto no-scrollbar">
          <div className="space-y-1.5">
            <label className="text-[13px] font-bold text-slate-700">{t("fullName").split(' ')[0]}</label>
            <Input placeholder={t("fullName").split(' ')[0]} className="h-12 rounded-xl border-slate-200 bg-white text-[14px] focus:ring-blue-50 focus:border-blue-300 shadow-sm" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[13px] font-bold text-slate-700">{t("fullName").split(' ')[1] || "Last Name"}</label>
            <Input placeholder={t("fullName").split(' ')[1] || "Last Name"} className="h-12 rounded-xl border-slate-200 bg-white text-[14px] focus:ring-blue-50 focus:border-blue-300 shadow-sm" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[13px] font-bold text-slate-700">{t("relationship")}</label>
            <select className={cn("flex h-12 w-full items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-2 text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600/5 transition-all", isRTL && "text-right")}>
              <option value="spouse">{isRTL ? "زوج/زوجة" : "Spouse"}</option>
              <option value="parent">{isRTL ? "أب/أم" : "Parent"}</option>
              <option value="sibling">{isRTL ? "أخ/أخت" : "Sibling"}</option>
              <option value="child">{isRTL ? "ابن/ابنة" : "Child"}</option>
              <option value="friend">{isRTL ? "صديق" : "Friend"}</option>
              <option value="other">{t("other")}</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[13px] font-bold text-slate-700">{t("phoneNumber")}</label>
            <div className="flex gap-2">
              <div className="flex items-center gap-1.5 h-12 px-3 bg-white border border-slate-200 rounded-xl shadow-sm cursor-pointer">
                <span className="text-base">🇪🇬</span>
                <span className="text-[13px] font-bold text-slate-600">+20</span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </div>
              <Input placeholder="000 000 0000" className="flex-1 h-12 rounded-xl border-slate-200 bg-white text-[14px] shadow-sm" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[13px] font-bold text-slate-700">{t("email")}</label>
            <Input placeholder="youremail@example.com" className="h-12 rounded-xl border-slate-200 bg-white text-[14px] focus:ring-blue-50 focus:border-blue-300 shadow-sm" />
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="px-8 py-6 flex items-center gap-4 border-t border-slate-100">
          <Button variant="outline" onClick={onClose} className="flex-1 h-12 rounded-2xl border-slate-200 text-slate-500 font-bold bg-white hover:bg-slate-50 text-[14px]">
            {t("cancel")}
          </Button>
          <Button className="flex-1 h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/10 text-[14px]">
            {t("add")}
          </Button>
        </div>
      </div>
    </div>
  );
}
