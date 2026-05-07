"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CalendarDays,
  Plus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  User,
  Stethoscope,
  Calendar as CalendarIcon,
  Clock,
  Check,
  Loader2,
  UserCheck,
  CheckCircle2,
  Play,
  X,
  XCircle,
  MessageSquare,
  Activity,
  CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { staffService } from "@/services/staffService";
import { bookingService } from "@/services/bookingService";
import { formatDateKey } from "@/lib/dateUtils";
import type { ApiDoctor, ApiAppointment } from "@/types";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";
import { patientService } from "@/services/patientService";
import { useToastStore } from "@/stores/useToastStore";
import type { ApiPatient } from "@/types";
import { useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import { TranslationKey } from "@/lib/i18n";
import { User as UserIcon } from "lucide-react";

const getPositionForTime = (timeStr: string) => {
  // Expecting "HH:MM" or "HH:MM AM/PM"
  const [time, modifier] = timeStr.split(' ');
  const [h, minutes] = time.split(':').map(Number);
  let hours = h;
  
  if (modifier === 'PM' && hours < 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;
  
  const startHour = 8; // Grid starts at 8 AM
  const totalMinutesFromStart = (hours - startHour) * 60 + minutes;
  
  // Each hour is 120px, so each minute is 2px
  return totalMinutesFromStart * 2;
};

export default function ReceptionSchedulePage() {
  const { t, isRTL } = useTranslation();
  const searchParams = useSearchParams();
  const view = searchParams.get("view");
  const isFromDashboard = searchParams.get("from") === "dashboard";
  const router = useRouter();
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
  const [doctors, setDoctors] = useState<ApiDoctor[]>([]);
  const [appointments, setAppointments] = useState<ApiAppointment[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedAppointment, setSelectedAppointment] = useState<ApiAppointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [docs, appts] = await Promise.all([
        staffService.getDoctors(),
        bookingService.getAll({ 
          date: formatDateKey(selectedDate)
        })
      ]);
      setDoctors(docs);
      setAppointments(appts);
    } catch (error) {
      console.error("Failed to fetch schedule data:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    void fetchInitialData();
  }, [fetchInitialData]);

  // Current Time State
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const timeIndicatorTop = getPositionForTime(
    currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  );

  const filteredDoctors = doctors.filter(doc => {
    const hasAppt = appointments.some(appt => 
      appt.doctorId === doc.id && 
      !["CANCELLED", "NO_SHOW", "RESCHEDULED"].includes(appt.status)
    );
    const matchesDept = selectedDepartment === "all" || 
      doc.specialization?.toLowerCase() === selectedDepartment.toLowerCase();
    return hasAppt && matchesDept;
  });

  const departments = [
    { id: "all", label: t("allDepartments"), checked: selectedDepartment === "all" },
    { id: "cardiology", label: t("cardiology") || "Cardiology", checked: selectedDepartment === "cardiology" },
    { id: "pediatrics", label: t("pediatrics") || "Pediatrics", checked: selectedDepartment === "pediatrics" },
    { id: "orthopedics", label: t("orthopedics") || "Orthopedics", checked: selectedDepartment === "orthopedics" },
    { id: "dermatology", label: t("dermatology") || "Dermatology", checked: selectedDepartment === "dermatology" },
  ];

  const appointmentTypes = [
    { label: t("consultation"), color: "blue", apiType: "CONSULTATION" },
    { label: t("followUp"), color: "emerald", apiType: "FOLLOW_UP" },
    { label: t("procedure") || "Procedure", color: "amber", apiType: "PROCEDURE" },
    { label: t("emergency") || "Emergency", color: "rose", apiType: "EMERGENCY" },
  ];

  const timeSlots = [
    "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM"
  ];

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d);
  };

  if (view === "new") {
    return <AddNewAppointmentView onBack={() => router.push(isFromDashboard ? "/reception/dashboard" : "/reception/booking")} />;
  }

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="flex h-screen bg-white dark:bg-[#0B1120] overflow-hidden font-sans transition-colors duration-300 relative -m-4 md:-m-6">
      {/* 1. Sidebar */}
      <div className={cn(
        "fixed inset-y-0 z-50 w-[280px] bg-white dark:bg-[#0B1120] border-slate-100 dark:border-slate-800/50 transform transition-transform duration-300 lg:relative lg:translate-x-0 lg:z-0",
        isRTL ? "right-0 border-l" : "left-0 border-r",
        isSidebarOpen ? "translate-x-0" : (isRTL ? "translate-x-full" : "-translate-x-full")
      )}>
        <div className="h-full flex flex-col p-6 space-y-10 overflow-y-auto no-scrollbar">
          {/* Mobile Close Button */}
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className={cn("lg:hidden absolute top-4 p-2 text-slate-400", isRTL ? "left-4" : "right-4")}
          >
            <X size={20} />
          </button>

          {/* Calendar Header */}
          <div className="space-y-6 pt-4 lg:pt-0">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-[17px] font-bold text-slate-900 dark:text-white">
                {selectedDate.toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex items-center gap-3">
                {isRTL ? (
                   <>
                    <ChevronRight onClick={handlePrevDay} className="h-4 w-4 text-slate-400 dark:text-slate-500 cursor-pointer hover:text-slate-600 dark:hover:text-slate-300 transition-colors" />
                    <ChevronLeft onClick={handleNextDay} className="h-4 w-4 text-slate-400 dark:text-slate-500 cursor-pointer hover:text-slate-600 dark:hover:text-slate-300 transition-colors" />
                   </>
                ) : (
                  <>
                    <ChevronLeft onClick={handlePrevDay} className="h-4 w-4 text-slate-400 dark:text-slate-500 cursor-pointer hover:text-slate-600 dark:hover:text-slate-300 transition-colors" />
                    <ChevronRight onClick={handleNextDay} className="h-4 w-4 text-slate-400 dark:text-slate-500 cursor-pointer hover:text-slate-600 dark:hover:text-slate-300 transition-colors" />
                  </>
                )}
              </div>
            </div>
            
            {/* Simple Calendar Placeholder - Fixed Grid */}
            <div className="grid grid-cols-7 gap-y-2 text-center">
              {(isRTL ? ["ح", "ن", "ث", "ر", "خ", "ج", "س"] : ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]).map((d) => (
                <span key={d} className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">{d}</span>
              ))}
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                <span
                  key={day}
                  onClick={() => {
                     const d = new Date(selectedDate);
                     d.setDate(day);
                     setSelectedDate(d);
                     setIsSidebarOpen(false);
                  }}
                  className={cn(
                    "text-[12px] font-bold h-8 w-8 flex items-center justify-center rounded-full cursor-pointer transition-all",
                    selectedDate.getDate() === day 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  )}
                >
                  {day}
                </span>
              ))}
            </div>
          </div>

          {/* Departments */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] px-2">{t("departments")}</h3>
            <div className="space-y-1">
              {departments.map((dept) => (
                <div 
                  key={dept.id} 
                  onClick={() => setSelectedDepartment(dept.id)}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-xl transition-all cursor-pointer group", 
                    dept.checked ? "bg-blue-50 dark:bg-blue-900/20" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  )}
                >
                  <Checkbox 
                    id={dept.id} 
                    checked={dept.checked} 
                    onCheckedChange={() => setSelectedDepartment(dept.id)}
                    className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600" 
                  />
                  <label 
                    htmlFor={dept.id} 
                    className={cn(
                      "text-[13px] font-bold cursor-pointer transition-colors", 
                      dept.checked ? "text-slate-700 dark:text-blue-400" : "text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300"
                    )}
                  >
                    {dept.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-6 pt-4">
            <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] px-2">{t("appointmentTypes")}</h3>
            <div className="space-y-4 px-2">
              {appointmentTypes.map((type) => (
                <div key={type.label} className="flex items-center gap-3">
                  <div className={cn("h-2 w-2 rounded-full", `bg-${type.color}-500`)} />
                  <span className="text-[12px] font-bold text-slate-500 dark:text-slate-400">{type.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Backdrop for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-[#0B1120]">
        {/* Header */}
        <header className="h-auto min-h-[80px] py-4 border-b border-slate-100 dark:border-slate-800/50 bg-white dark:bg-[#0B1120]/50 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between px-4 md:px-8 shrink-0 sticky top-0 z-20 gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500"
            >
              <CalendarDays className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm flex-1 sm:flex-none">
              <CalendarDays className="h-4 w-4 text-blue-500 hidden sm:block" />
              <span className="text-[12px] md:text-[14px] font-bold text-slate-700 dark:text-slate-200">
                {selectedDate.toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {loading && <Loader2 className="h-5 w-5 animate-spin text-blue-500" />}
            <Button 
              onClick={() => router.push("/reception/booking?view=new")}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-xl h-10 md:h-11 px-4 md:px-6 font-bold shadow-lg shadow-blue-500/20 flex items-center gap-2 text-xs md:text-sm transition-all flex-1 sm:flex-none"
            >
              <Plus className="h-4 w-4" />
              {t("newAppointment")}
            </Button>
          </div>
        </header>

        {/* Scheduler Grid */}
        <div className="flex-1 overflow-auto bg-white dark:bg-[#0B1120] flex flex-col no-scrollbar">
          <div className="min-w-[1000px] flex-1 flex flex-col">
            {/* Column Headers */}
            <div className="flex h-[100px] border-b border-slate-100 dark:border-slate-800/50 shrink-0 sticky top-0 bg-white/80 dark:bg-[#0B1120]/80 backdrop-blur-md z-10">
              <div className={cn("w-[100px] flex items-center justify-center bg-slate-50/30 dark:bg-slate-900/10", isRTL ? "border-l" : "border-r", "border-slate-100 dark:border-slate-800/50")}>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t("time")}</span>
                  <span className="text-[12px] font-bold text-slate-300 dark:text-slate-600 mt-1">EST</span>
                </div>
              </div>
              {filteredDoctors.map((doc) => (
                <div key={doc.id} className={cn("flex-1 flex items-center px-6 border-slate-100 dark:border-slate-800/50 last:border-none", isRTL ? "border-l" : "border-r")}>
                  <div className="flex items-center gap-4">
                    <div className={cn("relative", isRTL ? "ml-4" : "mr-0")}>
                      <Avatar className="h-12 w-12 border-2 border-white dark:border-slate-800 shadow-md">
                        <AvatarImage src={doc.user?.avatarUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${doc.fullName}`} />
                        <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">{doc.fullName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className={cn(
                        "absolute -right-1 -bottom-1 h-4 w-4 rounded-full border-2 border-white dark:border-[#0B1120]",
                        doc.status === "ACTIVE" ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
                      )} />
                    </div>
                    <div className={cn("flex flex-col", isRTL ? "text-right" : "text-left")}>
                      <span className="text-[15px] font-bold text-slate-900 dark:text-white leading-tight">{doc.fullName}</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-wider py-0 px-2 h-4 border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-900/50">
                          {doc.specialization}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Main Body */}
            <div className="flex-1 relative flex">
              {/* Left Time Column Labels */}
              <div className={cn("w-[100px] shrink-0 bg-white dark:bg-[#0B1120]", isRTL ? "border-l" : "border-r", "border-slate-100 dark:border-slate-800/50")}>
                {timeSlots.map((time) => (
                  <div key={time} className="h-[120px] flex justify-center py-4 border-b border-slate-50 dark:border-slate-800/30 last:border-none">
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-tight">{time}</span>
                  </div>
                ))}
              </div>

              {/* Grid Content with Doctor Columns */}
              <div className="flex-1 relative flex bg-slate-50/20 dark:bg-slate-900/5">
                {filteredDoctors.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
                    <div className="h-20 w-20 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center mb-6">
                      <CalendarIcon className="h-10 w-10 text-slate-200 dark:text-slate-800" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t("noPatientsInQueue")}</h3>
                    <p className="text-slate-400 dark:text-slate-500 max-w-xs mt-2 text-sm">{t("noRecentActivity")}</p>
                  </div>
                ) : (
                  filteredDoctors.map((doc) => (
                  <div key={doc.id} className={cn("flex-1 border-slate-100 dark:border-slate-800/50 last:border-none relative min-h-full", isRTL ? "border-l" : "border-r")}>
                    {/* Horizontal Divider Lines */}
                    {timeSlots.map((_, idx) => (
                      <div key={idx} className="absolute left-0 right-0 h-px bg-slate-50 dark:bg-slate-800/30" style={{ top: `${idx * 120}px` }} />
                    ))}
                    
                    {/* Real Appointment Overlays for this Doctor */}
                    {appointments
                      .filter(a => a.doctorId === doc.id && !["CANCELLED", "NO_SHOW", "RESCHEDULED"].includes(a.status))
                      .map((appt) => {
                      const top = getPositionForTime(appt.startTime);
                      const height = Math.max((appt.durationMinutes || 30) * 2, 60); 

                      return (
                        <AppointmentBlock
                          key={appt.id}
                          top={top}
                          height={height}
                          time={`${appt.startTime}`}
                          name={appt.patientName}
                          phone={appt.patientPhone}
                          avatarUrl={appt.patient?.user?.avatarUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${appt.patientName}`}
                          reason={appt.serviceName || appt.type}
                          status={appt.status}
                          onClick={() => setSelectedAppointment(appt)}
                        />
                      );
                    })}

                    {/* Current Time Indicator (Line) */}
                    {selectedDate.toDateString() === currentTime.toDateString() && (
                      <div 
                        className={cn("absolute left-0 right-0 z-30 flex items-center pointer-events-none", isRTL ? "flex-row-reverse" : "flex-row")}
                        style={{ top: `${timeIndicatorTop}px` }}
                      >
                        <div className={cn("h-2.5 w-2.5 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)]", isRTL ? "-mr-1.25" : "-ml-1.25")} />
                        <div className="h-0.5 flex-1 bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.5)]" />
                        <div className={cn("px-2 py-0.5 bg-rose-500 text-white text-[9px] font-black rounded-full shadow-lg", isRTL ? "mr-2" : "ml-2")}>
                          {t("now") || "NOW"}
                        </div>
                      </div>
                    )}
                  </div>
                )))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <BookAppointmentModal isOpen={isNewAppointmentOpen} onClose={() => setIsNewAppointmentOpen(false)} onBooked={fetchInitialData} />
      
      <ManageAppointmentModal 
        appointment={selectedAppointment} 
        isOpen={!!selectedAppointment} 
        onClose={() => setSelectedAppointment(null)} 
        onUpdate={fetchInitialData}
      />
    </div>
  );
}

interface AppointmentBlockProps {
  top: number;
  height: number;
  time: string;
  name: string;
  phone?: string;
  avatarUrl?: string;
  reason: string;
  status: string;
  onClick?: () => void;
}

function AppointmentBlock({ top, height, time, name, phone, avatarUrl, reason, status, onClick }: AppointmentBlockProps) {
  const { t, isRTL } = useTranslation();
  const isInProgress = status === "IN_PROGRESS";
  const isCompleted = status === "COMPLETED";
  const isConfirmed = status === "CONFIRMED";

  const statusStyles: Record<string, string> = {
    SCHEDULED: "bg-white/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 hover:border-blue-400 dark:hover:border-blue-500",
    CONFIRMED: "bg-amber-50/90 dark:bg-amber-900/10 border-amber-400/50 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 shadow-lg shadow-amber-500/5",
    IN_PROGRESS: "bg-blue-600/5 dark:bg-blue-400/5 border-blue-500 dark:border-blue-400 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500/20 shadow-xl shadow-blue-500/10",
    COMPLETED: "bg-emerald-50/80 dark:bg-emerald-900/10 border-emerald-500/30 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 opacity-80",
  };

  const style = statusStyles[status] || statusStyles.SCHEDULED;

  return (
    <div
      style={{ top: `${top}px`, height: `${height}px` }}
      onClick={onClick}
      className={cn(
        "absolute rounded-[20px] p-4 pointer-events-auto cursor-pointer transition-all flex flex-col justify-start overflow-hidden hover:scale-[1.02] hover:z-20 group backdrop-blur-sm",
        isRTL ? "right-3 left-3 border-r-4" : "left-3 right-3 border-l-4",
        style,
        isInProgress && "animate-pulse ring-2 ring-blue-500/30",
      )}
    >
      {isInProgress && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
      )}

      <div className={cn("flex items-center justify-between mb-2 relative z-10", isRTL ? "flex-row-reverse" : "flex-row")}>
        <div className="flex items-center gap-2">
           <Clock className="h-3 w-3 opacity-50" />
           <span className="text-[10px] font-black uppercase tracking-widest opacity-70">{time}</span>
        </div>
        {isCompleted ? (
          <div className="flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full">
             <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase">{t("completed")}</span>
             <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" />
          </div>
        ) : isInProgress ? (
          <div className="flex items-center gap-1 bg-blue-500/10 px-2 py-0.5 rounded-full">
            <Activity className="h-2.5 w-2.5 text-blue-600 dark:text-blue-400 animate-bounce" />
            <span className="text-[8px] font-black text-blue-600 dark:text-blue-400 uppercase">{t("inProgress")}</span>
          </div>
        ) : isConfirmed ? (
           <div className="flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-full">
             <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
             <span className="text-[8px] font-black text-amber-600 dark:text-amber-400 uppercase">{t("confirmed")}</span>
           </div>
        ) : (
          <div className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
        )}
      </div>
      
      <div className={cn("flex items-center gap-3 relative z-10", isRTL ? "flex-row-reverse" : "flex-row")}>
        {avatarUrl && height >= 75 && (
          <Avatar className="h-9 w-9 border-2 border-white dark:border-slate-800 shrink-0 shadow-sm transition-transform group-hover:scale-110">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800">{name.charAt(0)}</AvatarFallback>
          </Avatar>
        )}
        <div className={cn("flex flex-col min-w-0", isRTL ? "text-right" : "text-left")}>
          <h4 className={cn("font-black leading-tight truncate group-hover:whitespace-normal transition-colors", height < 55 ? "text-[12px]" : "text-[14px] font-bold text-slate-900 dark:text-white")}>{name}</h4>
          {height >= 65 && <span className="text-[10px] font-bold opacity-60 mt-0.5 tracking-tight font-mono">{phone}</span>}
        </div>
      </div>
      
      {height >= 85 && (
        <div className="mt-auto pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between relative z-10">
          <p className="text-[10px] font-bold opacity-50 truncate flex items-center gap-1.5">
            <Stethoscope className="h-2.5 w-2.5" />
            {reason}
          </p>
          <div className="h-6 w-6 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            {isRTL ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Book Appointment Modal ───────────────────────────────────── */

function BookAppointmentModal({ isOpen, onClose, onBooked }: { isOpen: boolean; onClose: () => void; onBooked?: () => void }) {
  const { t, isRTL } = useTranslation();
  const { user } = useAuthStore();
  const toast = useToastStore();
  const [loading, setLoading] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [patients, setPatients] = useState<ApiPatient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<ApiPatient | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<ApiDoctor | null>(null);
  const [allDoctors, setAllDoctors] = useState<ApiDoctor[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [selectedType, setSelectedType] = useState<"CONSULTATION" | "FOLLOW_UP" | "PROCEDURE" | "EMERGENCY">("CONSULTATION");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [searchingPatients, setSearchingPatients] = useState(false);
  const [modalDepartment, setModalDepartment] = useState("all");

  useEffect(() => {
    if (isOpen) {
      void staffService.getDoctors().then(setAllDoctors);
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchQuery.length > 2) {
      setSearchingPatients(true);
      const delay = setTimeout(async () => {
        try {
          const results = await patientService.getAll({ search: searchQuery });
          setPatients(results);
        } catch (e) {
          console.error(e);
        } finally {
          setSearchingPatients(false);
        }
      }, 300);
      return () => clearTimeout(delay);
    } else {
      setPatients([]);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      setLoadingSlots(true);
      void bookingService.getAvailableSlots(selectedDoctor.id, formatDateKey(selectedDate), {
        branchId: selectedDoctor.branchId || selectedDoctor.branches?.[0]?.id || user?.clinicId
      })
        .then(slots => {
          setAvailableSlots(slots);
          setLoadingSlots(false);
        })
        .catch(() => setLoadingSlots(false));
    }
  }, [selectedDoctor, selectedDate]);

  const handleBook = async () => {
    if (!selectedPatient || !selectedDoctor || !selectedTime) {
      toast.error(t("fillRequired"));
      return;
    }

    setLoading(true);
    try {
      let formattedTime = selectedTime;
      const [timePart, modifier] = selectedTime.split(' ');
      if (modifier) {
        const [h, minutes] = timePart.split(':').map(Number);
        let hours = h;
        if (modifier === 'PM' && hours < 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;
        formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }

      await bookingService.create({
        patientId: selectedPatient.id,
        patientName: selectedPatient.fullName,
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.fullName,
        date: formatDateKey(selectedDate),
        startTime: formattedTime,
        type: selectedType,
        notes: notes,
        amount: selectedDoctor.consultationFee || 0,
        branchId: selectedDoctor.branchId || selectedDoctor.branches?.[0]?.id || user?.clinicId,
      });
      toast.success(t("appointmentAddedSuccessfully"));
      onBooked?.();
      onClose();
    } catch (e) {
      toast.error(t("error"));
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent dir={isRTL ? "rtl" : "ltr"} className="max-w-[1100px] p-0 rounded-[32px] border-none shadow-2xl bg-white dark:bg-[#0B1120] max-h-[95vh] flex flex-col transition-all">
        {/* Modal Header */}
        <div className="px-10 py-6 border-b border-slate-50 dark:border-slate-800/50 flex items-center justify-between shrink-0 bg-white dark:bg-[#0B1120] z-10">
          <div className="space-y-1">
            <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-white">{t("newAppointment")}</DialogTitle>
            <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">{t("managePatientRecords")}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={onClose} className="rounded-xl font-bold text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 h-11 px-6">
              {t("cancel")}
            </Button>
            <Button 
              onClick={handleBook}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-xl h-11 px-8 font-bold shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : t("saveAndConfirm")}
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col lg:flex-row bg-slate-50/50 dark:bg-[#0B1120]/50">
          {/* Left Form Column */}
          <div className={cn("flex-1 p-6 md:p-10 space-y-8 md:space-y-10 border-b lg:border-b-0", isRTL ? "lg:border-l" : "lg:border-r", "border-slate-50 dark:border-slate-800/50")}>
            {/* 1. Select Patient */}
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                  <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-[15px] font-bold text-slate-900 dark:text-white uppercase tracking-widest">{t("selectPatient")}</h3>
              </div>
              <div className="space-y-4">
                {!selectedPatient ? (
                  <div className="relative">
                    {searchingPatients ? (
                      <Loader2 className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500 animate-spin", isRTL ? "right-4" : "left-4")} />
                    ) : (
                      <Search className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 dark:text-slate-600", isRTL ? "right-4" : "left-4")} />
                    )}
                    <Input 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t("searchPatientsPlaceholder")} 
                      className={cn("h-14 rounded-2xl border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 dark:text-white", isRTL ? "pr-11 pl-4" : "pl-11 pr-4")} 
                    />
                    {patients.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl z-50 max-h-60 overflow-y-auto no-scrollbar">
                        {patients.map(p => (
                          <div 
                            key={p.id} 
                            onClick={() => setSelectedPatient(p)}
                            className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer flex items-center gap-3 border-b border-slate-50 dark:border-slate-800/50 last:border-none"
                          >
                            <Avatar className="h-10 w-10 border dark:border-slate-800">
                              <AvatarImage src={p.user?.avatarUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${p.fullName}`} />
                              <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">{p.fullName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className={cn("flex flex-col", isRTL ? "text-right" : "text-left")}>
                              <span className="text-sm font-bold text-slate-900 dark:text-white">{p.fullName}</span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-500 font-mono">{p.phone}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-[20px] flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12 border-2 border-slate-50 dark:border-slate-800 shadow-md">
                        <AvatarImage src={selectedPatient.user?.avatarUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${selectedPatient.fullName}`} />
                        <AvatarFallback className="bg-slate-100 dark:bg-slate-800">{selectedPatient.fullName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className={cn("flex flex-col", isRTL ? "text-right" : "text-left")}>
                        <span className="text-[15px] font-bold text-slate-900 dark:text-white">{selectedPatient.fullName}</span>
                        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mt-1">ID: #{selectedPatient.id.slice(-5).toUpperCase()} • <span className="font-mono">{selectedPatient.phone}</span></span>
                      </div>
                    </div>
                    <Button variant="outline" onClick={() => setSelectedPatient(null)} className="rounded-xl border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 font-bold px-5 h-9 hover:bg-slate-50 dark:hover:bg-slate-800">{t("change")}</Button>
                  </div>
                )}
              </div>
            </section>

            {/* 2. Select Provider & Visit Type */}
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                  <Stethoscope className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-[15px] font-bold text-slate-900 dark:text-white uppercase tracking-widest">{t("selectDoctor")}</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className={cn("text-[13px] font-bold text-slate-500 dark:text-slate-400", isRTL ? "mr-1" : "ml-1")}>{t("type")}</label>
                  <div className="relative group">
                    <div className="h-14 px-5 bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-between cursor-pointer group-hover:border-blue-500 transition-colors">
                      <span className="text-[14px] font-bold text-slate-700 dark:text-slate-200 capitalize">{t(selectedType.toLowerCase() as TranslationKey)}</span>
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    </div>
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden opacity-0 group-hover:opacity-100 transition-all pointer-events-none group-hover:pointer-events-auto">
                      {["CONSULTATION", "FOLLOW_UP", "PROCEDURE", "EMERGENCY"].map((type) => (
                        <div 
                          key={type}
                          onClick={() => setSelectedType(type as "CONSULTATION" | "FOLLOW_UP" | "PROCEDURE" | "EMERGENCY")}
                          className="px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between cursor-pointer transition-colors border-b border-slate-50 dark:border-slate-800/50 last:border-none"
                        >
                          <span className="text-[13px] font-bold text-slate-700 dark:text-slate-300 capitalize">{t(type.toLowerCase() as TranslationKey)}</span>
                          {selectedType === type && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className={cn("text-[13px] font-bold text-slate-500 dark:text-slate-400", isRTL ? "mr-1" : "ml-1")}>{t("departments")}</label>
                  <div className="relative group">
                    <div className="h-14 px-5 bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-between cursor-pointer group-hover:border-blue-500 transition-colors">
                      <span className="text-[14px] font-bold text-slate-700 dark:text-slate-200 capitalize">{modalDepartment === "all" ? t("allDepartments") : modalDepartment}</span>
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    </div>
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden opacity-0 group-hover:opacity-100 transition-all pointer-events-none group-hover:pointer-events-auto">
                      {["all", "cardiology", "pediatrics", "orthopedics", "dermatology"].map((dept) => (
                        <div 
                          key={dept}
                          onClick={() => setModalDepartment(dept)}
                          className="px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between cursor-pointer transition-colors border-b border-slate-50 dark:border-slate-800/50 last:border-none"
                        >
                          <span className="text-[13px] font-bold text-slate-700 dark:text-slate-300 capitalize">{dept === "all" ? t("allDepartments") : dept}</span>
                          {modalDepartment === dept && <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 max-h-[300px] overflow-y-auto no-scrollbar pt-2">
                {allDoctors
                  .filter(doc => modalDepartment === "all" || doc.specialization?.toLowerCase() === modalDepartment.toLowerCase())
                  .map(doc => (
                  <div 
                    key={doc.id}
                    onClick={() => setSelectedDoctor(doc)}
                    className={cn(
                      "p-4 bg-white dark:bg-slate-900/30 border rounded-[24px] flex items-center justify-between transition-all cursor-pointer",
                      selectedDoctor?.id === doc.id 
                        ? "border-2 border-blue-600 shadow-lg bg-blue-50/10 dark:bg-blue-900/10" 
                        : "border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900/50"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "h-5 w-5 rounded-full flex items-center justify-center transition-all",
                        selectedDoctor?.id === doc.id ? "bg-blue-600 scale-110" : "bg-slate-100 dark:bg-slate-800"
                      )}>
                        {selectedDoctor?.id === doc.id && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <Avatar className="h-12 w-12 border-2 border-white dark:border-slate-800 shadow-sm">
                        <AvatarImage src={doc.user?.avatarUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${doc.fullName}`} />
                        <AvatarFallback className="bg-slate-100 dark:bg-slate-800">{doc.fullName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className={cn("flex flex-col", isRTL ? "text-right" : "text-left")}>
                        <span className="text-[15px] font-bold text-slate-900 dark:text-white">{doc.fullName}</span>
                        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mt-1">{doc.specialization} • {doc.consultationFee || 0} {isRTL ? "ج.م" : "LE"}</span>
                      </div>
                    </div>
                    <Badge className={cn("border-none rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-wider", doc.status === "ACTIVE" ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500" : "bg-slate-50 dark:bg-slate-900/20 text-slate-400")}>
                      ● {doc.status === "ACTIVE" ? (isRTL ? "متاح" : "Available") : doc.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </section>

            {/* 3. Select Date & Time */}
            <section className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                  <CalendarIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-[15px] font-bold text-slate-900 dark:text-white uppercase tracking-widest">{t("selectDateTime")}</h3>
              </div>

              <div className="flex flex-col md:flex-row gap-10">
                <div className="w-full md:w-[300px] space-y-6">
                   <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{t("date")}: {selectedDate.toLocaleDateString(isRTL ? "ar-EG" : "en-US")}</p>
                   <Input 
                    type="date" 
                    value={formatDateKey(selectedDate)} 
                    onChange={(e) => setSelectedDate(new Date(e.target.value))}
                    className="h-12 rounded-xl dark:bg-slate-900/50 dark:border-slate-800 dark:text-white"
                   />
                </div>

                <div className="flex-1 space-y-8">
                  <div className="space-y-4">
                    <h5 className="text-[11px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest flex items-center gap-2">
                      <Clock className="h-3 w-3" /> {t("availableSlots")}
                    </h5>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 relative min-h-[100px]">
                      {loadingSlots && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-black/20 backdrop-blur-[1px] z-10 rounded-2xl">
                          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                        </div>
                      )}
                      {availableSlots.length > 0 ? (
                        availableSlots.map((time) => (
                          <button 
                            key={time} 
                            onClick={() => setSelectedTime(time)}
                            className={cn(
                              "py-3 rounded-xl text-[13px] font-bold border transition-all",
                              selectedTime === time 
                                ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20" 
                                : "bg-white dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-blue-200 dark:hover:border-blue-800"
                            )}
                          >
                            {time}
                          </button>
                        ))
                      ) : (
                        <p className="col-span-3 text-xs text-slate-400 dark:text-slate-600 text-center py-8 italic font-medium">{t("noAvailableSlots") || t("noPatientsInQueue")}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Right Summary Column */}
          <div className="w-full lg:w-[380px] p-6 md:p-10 bg-white dark:bg-[#0B1120] shrink-0 space-y-8">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <CalendarDays className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-[16px] font-bold text-slate-900 dark:text-white uppercase tracking-widest">{t("summary")}</h3>
            </div>

            <div className="space-y-8">
              <SummaryItem icon={User} label={t("patient")} value={selectedPatient?.fullName || "---"} />
              <SummaryItem icon={Stethoscope} label={t("doctor")} value={selectedDoctor?.fullName || "---"} subValue={selectedDoctor?.specialization} />
              <SummaryItem icon={CalendarIcon} label={t("date")} value={selectedDate.toLocaleDateString(isRTL ? "ar-EG" : "en-US")} subValue={selectedTime || "---"} />
              <SummaryItem icon={CreditCard} label={t("totalAmount")} value={`${selectedDoctor?.consultationFee || 0} ${isRTL ? "ج.م" : "LE"}`} />
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className={cn("text-[11px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest", isRTL ? "mr-1" : "ml-1")}>{t("type")}</label>
                  <p className="text-[15px] font-bold text-slate-900 dark:text-white capitalize">{t(selectedType.toLowerCase() as TranslationKey)}</p>
                </div>
                <div className="space-y-2">
                  <label className={cn("text-[11px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest", isRTL ? "mr-1" : "ml-1")}>{t("notes")}</label>
                  <Textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t("notes") + "..."} 
                    className={cn("min-h-[100px] rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/50 text-[13px] font-medium resize-none dark:text-white", isRTL && "text-right")}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-6">
              <Button 
                onClick={handleBook}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-2xl h-14 font-bold shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Check className="h-5 w-5" /> {t("bookAppointment")}</>}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface SummaryItemProps {
  icon: React.ElementType;
  label: string;
  value: string;
  subValue?: string;
}

function SummaryItem({ icon: Icon, label, value, subValue }: SummaryItemProps) {
  const { isRTL } = useTranslation();
  return (
    <div className={cn("flex gap-4 group", isRTL ? "flex-row-reverse" : "flex-row")}>
      <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0 transition-transform group-hover:scale-110">
        <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
      </div>
      <div className={cn("flex flex-col min-w-0", isRTL ? "text-right" : "text-left")}>
        <span className="text-[11px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">{label}</span>
        <span className="text-[15px] font-bold text-slate-900 dark:text-white mt-0.5 truncate">{value}</span>
        {subValue && <span className="text-[12px] font-medium text-slate-500 dark:text-slate-500 mt-0.5 truncate">{subValue}</span>}
      </div>
    </div>
  );
}

/* ── Add New Appointment View ───────────────────────────────────── */

function AddNewAppointmentView({ onBack }: { onBack: () => void }) {
  const { t, isRTL } = useTranslation();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const isFromDashboard = searchParams.get("from") === "dashboard";
  const toast = useToastStore();
  const [loading, setLoading] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [patients, setPatients] = useState<ApiPatient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<ApiPatient | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<ApiDoctor | null>(null);
  const [allDoctors, setAllDoctors] = useState<ApiDoctor[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [selectedType, setSelectedType] = useState<"CONSULTATION" | "FOLLOW_UP" | "PROCEDURE" | "EMERGENCY">("CONSULTATION");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [searchingPatients, setSearchingPatients] = useState(false);
  const [modalDepartment, setModalDepartment] = useState("all");

  useEffect(() => {
    void staffService.getDoctors().then(setAllDoctors);
  }, []);

  useEffect(() => {
    if (searchQuery.length > 2) {
      setSearchingPatients(true);
      const delay = setTimeout(async () => {
        try {
          const results = await patientService.getAll({ search: searchQuery });
          setPatients(results);
        } catch (e) {
          console.error(e);
        } finally {
          setSearchingPatients(false);
        }
      }, 300);
      return () => clearTimeout(delay);
    } else {
      setPatients([]);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      setLoadingSlots(true);
      void bookingService.getAvailableSlots(selectedDoctor.id, formatDateKey(selectedDate), {
        branchId: selectedDoctor.branchId || selectedDoctor.branches?.[0]?.id || user?.clinicId
      })
        .then(slots => {
          setAvailableSlots(slots);
          setLoadingSlots(false);
        })
        .catch(() => setLoadingSlots(false));
    }
  }, [selectedDoctor, selectedDate]);

  const handleBook = async () => {
    if (!selectedPatient || !selectedDoctor || !selectedTime) {
      toast.error(t("fillRequired"));
      return;
    }

    setLoading(true);
    try {
      let formattedTime = selectedTime;
      const [timePart, modifier] = selectedTime.split(' ');
      if (modifier) {
        const [h, minutes] = timePart.split(':').map(Number);
        let hours = h;
        if (modifier === 'PM' && hours < 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;
        formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }

      await bookingService.create({
        patientId: selectedPatient.id,
        patientName: selectedPatient.fullName,
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.fullName,
        date: formatDateKey(selectedDate),
        startTime: formattedTime,
        type: selectedType,
        notes: notes,
        amount: selectedDoctor.consultationFee || 0,
        branchId: selectedDoctor.branchId || selectedDoctor.branches?.[0]?.id || user?.clinicId,
      });
      toast.success(t("appointmentAddedSuccessfully") || t("patientAddedSuccessfully"));
      onBack();
    } catch (e) {
      toast.error(t("error"));
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="p-4 lg:p-8 space-y-10 bg-slate-50 min-h-screen pb-20 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[13px] font-bold text-slate-400">
             <span className="hover:text-blue-600 cursor-pointer transition-colors" onClick={onBack}>
               {isFromDashboard ? t("dashboard") : t("schedule")}
             </span>
             {isRTL ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
             <span className="text-slate-900">{t("newAppointment")}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t("newAppointment")}</h1>
          <p className="text-slate-400 text-[13px] font-medium">{t("managePatientRecords")}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onBack} disabled={loading} className="rounded-xl font-bold text-slate-400 border-slate-100 bg-white hover:bg-slate-50 h-11 px-8">
            {t("cancel")}
          </Button>
          <Button 
            onClick={handleBook} 
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 px-8 font-bold shadow-lg shadow-blue-500/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : t("saveAndConfirm")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-10 gap-10">
        <div className="xl:col-span-7 space-y-8">
          {/* 1. Select Patient */}
          <Card className="border-none shadow-[0_4px_20px_rgb(0,0,0,0.01)] rounded-[32px] bg-white p-8 space-y-8">
             <div className="flex items-center gap-4">
               <div className="h-10 w-10 rounded-[14px] bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center border border-blue-100 shadow-sm">
                 <UserIcon className="h-5 w-5 text-blue-600" />
               </div>
               <h2 className="text-[14px] font-black text-slate-800 uppercase tracking-[0.1em]">{t("selectPatient")}</h2>
             </div>
             
             <div className="space-y-4">
                {!selectedPatient ? (
                  <div className="relative max-w-2xl">
                    {searchingPatients ? (
                      <Loader2 className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500 animate-spin", isRTL ? "right-4" : "left-4")} />
                    ) : (
                      <Search className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300", isRTL ? "right-4" : "left-4")} />
                    )}
                    <Input 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t("searchPatientsPlaceholder")} 
                      className={cn("h-14 rounded-2xl border-slate-100 bg-slate-50/50 text-[15px] font-bold text-slate-700 placeholder:text-slate-300", isRTL ? "pr-11 pl-4" : "pl-11 pr-4")} 
                    />
                    {patients.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 max-h-60 overflow-y-auto no-scrollbar">
                        {patients.map(p => (
                          <div 
                            key={p.id} 
                            onClick={() => setSelectedPatient(p)}
                            className="p-4 hover:bg-slate-50 cursor-pointer flex items-center gap-4 border-b border-slate-50 last:border-none transition-colors"
                          >
                            <Avatar className="h-11 w-11 border-2 border-white shadow-sm">
                              <AvatarImage src={p.user?.avatarUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${p.fullName}`} />
                              <AvatarFallback className="bg-slate-100 text-slate-500 font-bold">{p.fullName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className={cn("flex flex-col", isRTL ? "text-right" : "text-left")}>
                              <span className="text-[15px] font-bold text-slate-900">{p.fullName}</span>
                              <span className="text-[12px] text-slate-400 font-bold font-mono tracking-wider">{p.phone}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-6 bg-blue-50/30 border border-blue-100 rounded-[28px] flex items-center justify-between shadow-sm group hover:border-blue-200 transition-all">
                    <div className="flex items-center gap-5">
                      <Avatar className="h-16 w-16 border-4 border-white shadow-lg transition-transform group-hover:scale-105">
                        <AvatarImage src={selectedPatient.user?.avatarUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${selectedPatient.fullName}`} />
                        <AvatarFallback className="bg-slate-100 font-bold">{selectedPatient.fullName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className={cn("flex flex-col", isRTL ? "text-right" : "text-left")}>
                        <span className="text-[18px] font-black text-slate-900">{selectedPatient.fullName}</span>
                        <div className="flex items-center gap-3 mt-1">
                           <Badge className="bg-white text-blue-600 border-none font-bold text-[10px] tracking-widest px-2 h-5 rounded-md shadow-sm">ID: #{selectedPatient.id.slice(-5).toUpperCase()}</Badge>
                           <span className="text-[13px] font-bold text-slate-400 font-mono">{selectedPatient.phone}</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" onClick={() => setSelectedPatient(null)} className="rounded-xl border-white bg-white text-blue-600 font-bold px-6 h-10 shadow-sm hover:shadow-md transition-all">{t("change")}</Button>
                  </div>
                )}
             </div>
          </Card>

          {/* 2. Select Doctor & Type */}
          <Card className="border-none shadow-[0_4px_20px_rgb(0,0,0,0.01)] rounded-[32px] bg-white p-8 space-y-8">
             <div className="flex items-center gap-4">
               <div className="h-10 w-10 rounded-[14px] bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center border border-blue-100 shadow-sm">
                 <Stethoscope className="h-5 w-5 text-blue-600" />
               </div>
               <h2 className="text-[14px] font-black text-slate-800 uppercase tracking-[0.1em]">{t("selectDoctor")}</h2>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                   <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">{t("type")}</label>
                   <div className="grid grid-cols-2 gap-3">
                      {["CONSULTATION", "FOLLOW_UP", "PROCEDURE", "EMERGENCY"].map((type) => (
                        <button 
                          key={type}
                          onClick={() => setSelectedType(type as "CONSULTATION" | "FOLLOW_UP" | "PROCEDURE" | "EMERGENCY")}
                          className={cn(
                            "h-12 rounded-2xl border text-[12px] font-bold transition-all",
                            selectedType === type 
                              ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/10" 
                              : "border-slate-100 bg-slate-50/50 text-slate-500 hover:border-blue-200"
                          )}
                        >
                          {t(type.toLowerCase() as TranslationKey)}
                        </button>
                      ))}
                   </div>
                </div>

                <div className="space-y-3">
                   <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">{t("departments")}</label>
                   <div className="flex flex-wrap gap-2">
                      {["all", "cardiology", "pediatrics", "orthopedics", "dermatology"].map((dept) => (
                        <button 
                          key={dept}
                          onClick={() => setModalDepartment(dept)}
                          className={cn(
                            "px-4 py-2 rounded-xl border text-[11px] font-bold transition-all",
                            modalDepartment === dept 
                              ? "bg-slate-900 border-slate-900 text-white" 
                              : "border-slate-100 bg-white text-slate-400 hover:border-slate-200"
                          )}
                        >
                          {dept === "all" ? t("allDepartments") : t(dept as TranslationKey)}
                        </button>
                      ))}
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {allDoctors
                  .filter(doc => modalDepartment === "all" || doc.specialization?.toLowerCase() === modalDepartment.toLowerCase())
                  .map(doc => (
                  <div 
                    key={doc.id}
                    onClick={() => setSelectedDoctor(doc)}
                    className={cn(
                      "p-5 rounded-[28px] border transition-all cursor-pointer group relative overflow-hidden",
                      selectedDoctor?.id === doc.id 
                        ? "border-blue-600 bg-blue-50/10 shadow-xl shadow-blue-500/5" 
                        : "border-slate-100 bg-white hover:border-blue-200 hover:shadow-md"
                    )}
                  >
                    {selectedDoctor?.id === doc.id && (
                       <div className="absolute top-4 right-4 h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 scale-110">
                          <Check className="h-3 w-3 text-white" />
                       </div>
                    )}
                    <div className="flex items-center gap-4">
                      <Avatar className="h-14 w-14 border-2 border-white shadow-md group-hover:scale-105 transition-transform">
                        <AvatarImage src={doc.user?.avatarUrl || `https://api.dicebear.com/9.x/avataaars/svg?seed=${doc.fullName}`} />
                        <AvatarFallback className="font-bold">{doc.fullName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[15px] font-black text-slate-900 truncate">{doc.fullName}</span>
                        <span className="text-[11px] font-bold text-slate-400 mt-0.5 tracking-tight">{doc.specialization}</span>
                        <div className="flex items-center gap-1.5 mt-2">
                           <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold text-[9px] px-2 h-4 rounded-md">{doc.consultationFee || 0} {isRTL ? "ج.م" : "LE"}</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
             </div>
          </Card>

          {/* 3. Date & Time */}
          <Card className="border-none shadow-[0_4px_20px_rgb(0,0,0,0.01)] rounded-[32px] bg-white p-8 space-y-8">
             <div className="flex items-center gap-4">
               <div className="h-10 w-10 rounded-[14px] bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center border border-blue-100 shadow-sm">
                 <CalendarIcon className="h-5 w-5 text-blue-600" />
               </div>
               <h2 className="text-[14px] font-black text-slate-800 uppercase tracking-[0.1em]">{t("selectDateTime")}</h2>
             </div>

             <div className="flex flex-col xl:flex-row gap-12">
                <div className="w-full xl:w-[320px] space-y-4">
                   <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">{t("selectDate")}</label>
                   <Input 
                    type="date" 
                    value={formatDateKey(selectedDate)} 
                    onChange={(e) => setSelectedDate(new Date(e.target.value))}
                    className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 text-[15px] font-bold text-slate-700 shadow-sm focus:ring-blue-500/5 focus:border-blue-300"
                   />
                </div>

                <div className="flex-1 space-y-6">
                   <div className="flex items-center justify-between">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-2">
                        <Clock className="h-3 w-3" /> {t("availableSlots")}
                      </label>
                      {loadingSlots && <Loader2 className="h-3 w-3 animate-spin text-blue-500" />}
                   </div>

                   <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {availableSlots.length > 0 ? (
                        availableSlots.map((time) => (
                          <button 
                            key={time} 
                            onClick={() => setSelectedTime(time)}
                            className={cn(
                              "h-12 rounded-2xl text-[13px] font-black border transition-all flex items-center justify-center",
                              selectedTime === time 
                                ? "bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-500/20 scale-[1.02]" 
                                : "bg-white border-slate-100 text-slate-400 hover:border-blue-200"
                            )}
                          >
                            {time}
                          </button>
                        ))
                      ) : (
                        <div className="col-span-full py-10 flex flex-col items-center justify-center bg-slate-50/50 rounded-[32px] border-2 border-dashed border-slate-100 opacity-50">
                           <Clock className="h-8 w-8 text-slate-200 mb-3" />
                           <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{t("noAvailableSlots")}</p>
                        </div>
                      )}
                   </div>
                </div>
             </div>
          </Card>
        </div>

        {/* Right Column: Summary */}
        <div className="xl:col-span-3 space-y-8">
           <Card className="border-none shadow-[0_4px_20px_rgb(0,0,0,0.01)] rounded-[32px] bg-white p-8 space-y-8">
              <div className="flex items-center gap-4">
                 <div className="h-10 w-10 rounded-[14px] bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-900/10">
                    <CalendarDays className="h-5 w-5 text-white" />
                 </div>
                 <h2 className="text-[14px] font-black text-slate-800 uppercase tracking-[0.1em]">{t("summary")}</h2>
              </div>

              <div className="space-y-8">
                 <SummaryItem icon={User} label={t("patient")} value={selectedPatient?.fullName || "---"} />
                 <SummaryItem icon={Stethoscope} label={t("doctor")} value={selectedDoctor?.fullName || "---"} subValue={selectedDoctor?.specialization} />
                 <SummaryItem icon={CalendarIcon} label={t("date")} value={selectedDate.toLocaleDateString(isRTL ? "ar-EG" : "en-US")} subValue={selectedTime || "---"} />
                 <SummaryItem icon={CreditCard} label={t("totalAmount")} value={`${selectedDoctor?.consultationFee || 0} ${isRTL ? "ج.م" : "LE"}`} />
                 
                 <div className="space-y-4 pt-4 border-t border-slate-50">
                    <div className="space-y-2.5">
                       <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.1em] ml-1">{t("notes")}</label>
                       <Textarea 
                         value={notes}
                         onChange={(e) => setNotes(e.target.value)}
                         placeholder={t("notes") + "..."} 
                         className={cn("min-h-[120px] rounded-[24px] border-slate-100 bg-slate-50/50 text-[14px] font-bold text-slate-700 placeholder:text-slate-200 focus:ring-blue-600/5 focus:border-blue-200 transition-all resize-none shadow-inner", isRTL && "text-right")}
                       />
                    </div>
                 </div>

                 <Button 
                    onClick={handleBook}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-[24px] h-16 font-black text-[16px] shadow-2xl shadow-blue-500/20 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98]"
                 >
                    {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <><CheckCircle2 className="h-5 w-5" /> {t("saveAndConfirm")}</>}
                 </Button>
              </div>
           </Card>

           <Card className="border-none shadow-[0_4px_20px_rgb(0,0,0,0.01)] rounded-[28px] bg-slate-900 p-8 text-white space-y-6">
              <div className="space-y-2">
                 <h3 className="text-[13px] font-black uppercase tracking-widest text-slate-400">{t("quickHelp")}</h3>
                 <p className="text-[14px] font-medium leading-relaxed opacity-80">{t("bookingInstructions") || "Select a patient, choose a specialized doctor, and pick an available time slot to confirm the appointment."}</p>
              </div>
              <div className="flex items-center gap-4 pt-2">
                 <div className="flex -space-x-3">
                    {[1,2,3].map(i => (
                       <Avatar key={i} className="h-8 w-8 border-2 border-slate-900 shadow-xl">
                          <AvatarImage src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${i * 55}`} />
                       </Avatar>
                    ))}
                 </div>
                 <span className="text-[11px] font-bold text-slate-400">{t("verifiedByReception")}</span>
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
}

/* ── Manage Appointment Modal ───────────────────────────────────── */

function ManageAppointmentModal({ 
  appointment, 
  isOpen, 
  onClose, 
  onUpdate 
}: { 
  appointment: ApiAppointment | null; 
  isOpen: boolean; 
  onClose: () => void; 
  onUpdate: () => void;
}) {
  const { t, isRTL } = useTranslation();
  const toast = useToastStore();
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  if (!appointment) return null;

  const handleUpdateStatus = async (status: string) => {
    setLoading(true);
    try {
      await bookingService.updateStatus(appointment.id, status as "SCHEDULED" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED");
      toast.success(t("statusUpdatedSuccessfully"));
      onUpdate();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(t("error"));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm(isRTL ? "هل أنت متأكد من إلغاء هذا الموعد؟" : "Are you sure you want to cancel this appointment?")) return;
    handleUpdateStatus("CANCELLED");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent dir={isRTL ? "rtl" : "ltr"} className="max-w-[550px] p-0 overflow-hidden border-none rounded-[40px] shadow-2xl bg-white dark:bg-[#0B1120] transition-all">
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-blue-50/50 to-transparent dark:from-blue-900/10 pointer-events-none" />
        
        <div className="p-10 relative z-10 space-y-10">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-5">
              <div className="h-14 w-14 rounded-2xl bg-white dark:bg-slate-900 shadow-xl shadow-blue-500/10 flex items-center justify-center border border-slate-50 dark:border-slate-800">
                <CalendarIcon className="h-7 w-7 text-blue-600 dark:text-blue-400" />
              </div>
              <div className={isRTL ? "text-right" : "text-left"}>
                <DialogTitle className="text-[22px] font-black text-slate-900 dark:text-white tracking-tight">{t("appointmentDetails")}</DialogTitle>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className={cn(
                    "h-2 w-2 rounded-full animate-pulse",
                    appointment.status === "SCHEDULED" ? "bg-slate-400" :
                    appointment.status === "CONFIRMED" ? "bg-amber-500" :
                    appointment.status === "IN_PROGRESS" ? "bg-blue-500" :
                    appointment.status === "COMPLETED" ? "bg-emerald-500" : "bg-rose-500"
                  )} />
                  <span className="text-slate-400 dark:text-slate-500 text-[13px] font-bold uppercase tracking-widest">
                    {t(appointment.status.toLowerCase() as TranslationKey)}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="h-10 w-10 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 md:gap-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 md:p-6 rounded-[32px] bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100/50 dark:border-slate-800/50">
               <div className={cn("space-y-1", isRTL ? "text-right" : "text-left")}>
                 <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t("patient")}</span>
                 <p className="text-[14px] md:text-[15px] font-bold text-slate-900 dark:text-white truncate">{appointment.patientName}</p>
                 <p className="text-[11px] md:text-[12px] font-medium text-slate-500 dark:text-slate-400 font-mono">{appointment.patientPhone}</p>
               </div>
               <div className={cn("space-y-1 pt-4 sm:pt-0 border-t sm:border-t-0", isRTL ? "sm:border-r sm:pr-6 sm:text-right" : "sm:border-l sm:pl-6 sm:text-left", "border-slate-200/50 dark:border-slate-800/50")}>
                 <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t("doctor")}</span>
                 <p className="text-[14px] md:text-[15px] font-bold text-slate-900 dark:text-white truncate">{appointment.doctorName || "---"}</p>
                 <p className="text-[11px] md:text-[12px] font-medium text-slate-500 dark:text-slate-400 truncate">{appointment.serviceName || t("consultation")}</p>
               </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-2 md:px-4">
              <SummaryItem icon={Clock} label={t("time")} value={appointment.startTime} subValue={`${appointment.durationMinutes} ${isRTL ? "دقيقة" : "minutes"}`} />
              <SummaryItem icon={CreditCard} label={t("paymentSummary")} value={appointment.amount ? `${appointment.amount} ${isRTL ? "ج.م" : "LE"}` : `0 ${isRTL ? "ج.م" : "LE"}`} subValue={appointment.status === "COMPLETED" ? t("paid") : t("pending")} />
            </div>
            
            {appointment.notes && (
              <div className="p-6 rounded-[28px] bg-blue-50/30 dark:bg-blue-900/5 border border-blue-100/30 dark:border-blue-800/30 space-y-3 relative overflow-hidden">
                <div className={cn("flex items-center gap-2 text-[10px] font-black text-blue-600/50 dark:text-blue-400/50 uppercase tracking-[0.2em]", isRTL ? "flex-row-reverse" : "flex-row")}>
                  <MessageSquare className="h-3 w-3" /> {t("notes")}
                </div>
                <p className={cn("text-[14px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed italic", isRTL ? "text-right" : "text-left")}>&quot;{appointment.notes}&quot;</p>
              </div>
            )}
          </div>

          <div className="space-y-6 pt-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <div className={cn("flex items-center gap-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]", isRTL ? "flex-row-reverse" : "flex-row")}>
                  <Activity className="h-3 w-3" /> {t("statusControl") || "Status Control"}
                </div>
                {loading && <Loader2 className="h-3 w-3 animate-spin text-blue-500" />}
              </div>
              
              {appointment.status === "SCHEDULED" && (
                <Button 
                  onClick={() => router.push("/reception/waiting-room")}
                  className={cn("w-full h-[72px] rounded-[28px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold shadow-xl shadow-blue-500/25 flex items-center justify-between px-8 transition-all hover:scale-[1.02] active:scale-[0.98] group border-t border-white/20", isRTL ? "flex-row-reverse" : "flex-row")}
                >
                  <div className={cn("flex items-center gap-4", isRTL ? "flex-row-reverse" : "flex-row")}>
                    <div className="h-11 w-11 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                      <UserCheck className="h-6 w-6" />
                    </div>
                    <div className={isRTL ? "text-right" : "text-left"}>
                      <span className="block text-[15px]">{t("checkIn")}</span>
                      <span className="block text-[10px] opacity-70 font-bold uppercase tracking-wider mt-0.5">{t("waitingRoom")}</span>
                    </div>
                  </div>
                  {isRTL ? <ChevronLeft className="h-5 w-5 opacity-40 group-hover:-translate-x-1 transition-transform" /> : <ChevronRight className="h-5 w-5 opacity-40 group-hover:translate-x-1 transition-transform" />}
                </Button>
              )}

              {appointment.status === "CONFIRMED" && (
                <Button 
                  onClick={() => handleUpdateStatus("IN_PROGRESS")}
                  disabled={loading}
                  className={cn("w-full h-[72px] rounded-[28px] bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold shadow-xl shadow-indigo-500/25 flex items-center justify-between px-8 transition-all hover:scale-[1.02] active:scale-[0.98] group border-t border-white/20", isRTL ? "flex-row-reverse" : "flex-row")}
                >
                  <div className={cn("flex items-center gap-4", isRTL ? "flex-row-reverse" : "flex-row")}>
                    <div className="h-11 w-11 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                      <Play className="h-6 w-6" />
                    </div>
                    <div className={isRTL ? "text-right" : "text-left"}>
                      <span className="block text-[15px]">{t("startConsultation")}</span>
                      <span className="block text-[10px] opacity-70 font-bold uppercase tracking-wider mt-0.5">{t("inProgress")}</span>
                    </div>
                  </div>
                  {isRTL ? <ChevronLeft className="h-5 w-5 opacity-40 group-hover:-translate-x-1 transition-transform" /> : <ChevronRight className="h-5 w-5 opacity-40 group-hover:translate-x-1 transition-transform" />}
                </Button>
              )}

              {appointment.status === "IN_PROGRESS" && (
                <Button 
                  onClick={() => handleUpdateStatus("COMPLETED")}
                  disabled={loading}
                  className={cn("w-full h-[72px] rounded-[28px] bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold shadow-xl shadow-emerald-500/25 flex items-center justify-between px-8 transition-all hover:scale-[1.02] active:scale-[0.98] group border-t border-white/20", isRTL ? "flex-row-reverse" : "flex-row")}
                >
                  <div className={cn("flex items-center gap-4", isRTL ? "flex-row-reverse" : "flex-row")}>
                    <div className="h-11 w-11 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div className={isRTL ? "text-right" : "text-left"}>
                      <span className="block text-[15px]">{t("markAsCompleted")}</span>
                      <span className="block text-[10px] opacity-70 font-bold uppercase tracking-wider mt-0.5">{t("completedToday")}</span>
                    </div>
                  </div>
                  {isRTL ? <ChevronLeft className="h-5 w-5 opacity-40 group-hover:-translate-x-1 transition-transform" /> : <ChevronRight className="h-5 w-5 opacity-40 group-hover:translate-x-1 transition-transform" />}
                </Button>
              )}
              
              <Button 
                variant="outline" 
                onClick={onClose}
                className="w-full h-14 rounded-2xl border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all active:scale-[0.98]"
              >
                {t("dismissDetails") || "Dismiss Details"}
              </Button>
            </div>

            {appointment.status !== "CANCELLED" && appointment.status !== "COMPLETED" && (
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800/50">
                <Button 
                  onClick={handleCancel}
                  disabled={loading}
                  className="w-full h-14 rounded-2xl bg-rose-50/50 dark:bg-rose-950/10 text-rose-600 dark:text-rose-400 border border-rose-100/50 dark:border-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/20 font-bold transition-all flex items-center justify-center gap-2 group active:scale-[0.98]"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                    <>
                      <XCircle className="h-5 w-5 group-hover:rotate-90 transition-transform duration-500" /> 
                      {t("cancelAppointment")}
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
