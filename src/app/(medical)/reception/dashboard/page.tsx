"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users,
  Clock,
  CheckCircle,
  CircleDollarSign,
  UserPlus,
  Calendar,
  UserCheck,
  CreditCard,
  CalendarDays,
  Dot,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "@/hooks/useTranslation";
import { dashboardService } from "@/services/dashboardService";
import { patientService } from "@/services/patientService";
import { formatDateKey } from "@/lib/dateUtils";
import { useBookingStore } from "@/stores/useBookingStore";
import { useToastStore } from "@/stores/useToastStore";
import { cn } from "@/lib/utils";
import { TranslationKey } from "@/lib/i18n";
import type { DashboardStaffSummaryData, DashboardAppointmentStatus, ApiPatient, DashboardStaffQueueItem, Appointment } from "@/types";
import { Check, X, Eye, Loader2 } from "lucide-react";

const toMinutes = (value: string): number | null => {
  if (!value) return null;
  const [time, modifier] = value.split(" ");
  const [hoursStr, minutesStr] = time.split(":").map(s => s.trim());
  let hours = Number(hoursStr);
  const minutes = Number(minutesStr);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;

  if (modifier === "PM" && hours < 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;

  return hours * 60 + minutes;
};

export default function ReceptionDashboard() {
  const { t, isRTL } = useTranslation();
  const toast = useToastStore();
  const { updateAppointment, fetchAppointments, appointments } = useBookingStore();
  const [dashboardData, setDashboardData] = React.useState<DashboardStaffSummaryData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [processingId, setProcessingId] = React.useState<string | null>(null);
  const [pendingPatients, setPendingPatients] = React.useState<ApiPatient[]>([]);
  const [discountInputs, setDiscountInputs] = React.useState<Record<string, number>>({});
  const [discountNotes, setDiscountNotes] = React.useState<Record<string, string>>({});
  const [previewCard, setPreviewCard] = React.useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = React.useState<Date>(new Date());

  const refreshDashboard = React.useCallback(async () => {
    try {
      const todayKey = formatDateKey(new Date());
      const [summary, patients] = await Promise.all([
        dashboardService.getStaffSummary({ period: "day" }),
        patientService.getAll({ insuranceStatus: "pending" }),
        fetchAppointments({ date: todayKey })
      ]);

      setDashboardData(summary);

      const filtered = (patients || []).filter((p: ApiPatient) => {
        let mh = p.medicalHistory;
        // Handle case where medicalHistory might be a string (from some legacy storage)
        if (typeof mh === "string") {
          try { mh = JSON.parse(mh); } catch { mh = {}; }
        }
        const mhObj = (mh as Record<string, unknown>) || {};
        const ins = (mhObj.insuranceDetails as Record<string, unknown>) || {};
        return ins.verificationStatus === "pending";
      });
      setPendingPatients(filtered);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setIsLoading(false);
    }
  }, [fetchAppointments]);

  const handleVerify = async (patientId: string, status: "verified" | "rejected") => {
    try {
      await patientService.verifyInsurance(patientId, {
        status,
        discountPercent: status === "verified" ? (discountInputs[patientId] || 0) : undefined,
        discountNote: status === "verified" ? (discountNotes[patientId] || "") : undefined,
        verifiedBy: "receptionist",
      });
      toast.success(status === "verified" ? t("insuranceApprovedSuccessfully") : t("insuranceRejectedSuccessfully"));
      void refreshDashboard();
    } catch (err) {
      console.error("Failed to verify insurance", err);
      toast.error(t("failedToVerifyInsurance"));
    }
  };

  const handleStatusUpdate = async (apptId: string, nextStatus: string) => {
    setProcessingId(apptId);
    try {
      const status = nextStatus.toUpperCase().replace("-", "_") as Appointment["status"];
      await updateAppointment(apptId, { status: status.toLowerCase().replace("_", "-") as Appointment["status"] });
      toast.success(`${t("appointmentStatusUpdated")}: ${t(status.toLowerCase().replace("_", "-") as TranslationKey)}`);
      void refreshDashboard();
    } catch {
      toast.error(t("error"));
    } finally {
      setProcessingId(null);
    }
  };

  useEffect(() => {
    void refreshDashboard();
    const interval = setInterval(() => void refreshDashboard(), 30000);
    return () => clearInterval(interval);
  }, [refreshDashboard]);

  const summary = dashboardData?.summaryCards;
  const activityLog = dashboardData?.activityLog || [];

  // Use store appointments to ensure patients don't disappear when status changes to IN_PROGRESS
  const todayAppointments = appointments.length > 0 ? appointments : (dashboardData?.queue.upcoming || []);
  const upcoming = dashboardData?.queue.upcoming || [];

  const computedAvgWait = React.useMemo(() => {
    if (summary?.averageWaitMinutes && summary.averageWaitMinutes > 0) return summary.averageWaitMinutes;

    const waitingPatients = upcoming.filter(a => a.status === "CONFIRMED");
    if (waitingPatients.length === 0) return 0;

    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();

    const total = waitingPatients.reduce((sum, a) => {
      const m = toMinutes(a.time);
      return m === null ? sum : sum + Math.max(0, nowMin - m);
    }, 0);

    return Math.round(total / waitingPatients.length);
  }, [summary?.averageWaitMinutes, upcoming]);

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="p-6 md:p-8 space-y-10 max-w-[1600px] mx-auto bg-slate-50 min-h-screen relative pb-24">

      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {t("dailyOverview")}
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            {t("efficientlyManaging", { count: summary?.totalToday || 0 })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 px-4 py-2.5 bg-white border border-slate-100 rounded-2xl shadow-sm">
            <CalendarDays className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-semibold text-slate-700">
              {new Date().toLocaleDateString(isRTL ? "ar-EG" : "en-US", {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
          <div className="flex items-center gap-1 px-4 py-2.5 bg-white border border-slate-100 rounded-2xl shadow-sm">
            <Dot className={cn("h-8 w-8 text-emerald-500", isRTL ? "-mr-2" : "-ml-2")} />
            <span className="text-sm font-semibold text-slate-700">
              {isRTL ? "حركة المرور: طبيعي" : "Live Traffic: Normal"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-100 rounded-2xl shadow-sm">
            <Clock className="h-4 w-4 text-slate-400" />
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              {t("lastUpdated")}: {lastUpdated.toLocaleTimeString(isRTL ? "ar-EG" : "en-US", { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Users} label={t("totalPatients")} value={isLoading ? "..." : (summary?.totalPatients || 0)} color="blue" />
        <StatCard icon={Clock} label={t("waiting")} value={isLoading ? "..." : (summary?.scheduledConfirmed || 0)} badge={isLoading ? undefined : `${t("avg")} ${computedAvgWait} ${t("min")}`} color="orange" />
        <StatCard icon={CheckCircle} label={t("completed")} value={isLoading ? "..." : (summary?.completed || 0)} color="purple" />
        <StatCard icon={CircleDollarSign} label={t("dailyRevenue")} value={isLoading ? "..." : `${summary?.todayRevenue?.toLocaleString() || 0} ${isRTL ? "ج.م" : "L.E"}`} color="green" />
      </div>

      {/* 3. Quick Actions */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">{t("quickActions")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <ActionCard icon={UserPlus} title={t("addPatient")} subtitle={t("registerNewVisitor")} href="/reception/patients?view=new&from=dashboard" />
          <ActionCard icon={Calendar} title={t("newAppointment")} subtitle={t("bookASession")} href="/reception/booking?view=new&from=dashboard" />
          <ActionCard icon={UserCheck} title={t("checkInPatients")} subtitle={t("confirmArrivalPatients")} href="/reception/waiting-room" />
          <ActionCard icon={CreditCard} title={t("payment")} subtitle={t("processPayment")} href="/reception/payments" />
        </div>
      </div>

      {/* Pending Insurance Verification */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">{t("pendingInsuranceVerification")}</h2>
            <div className="flex items-center gap-4">
              <p className="text-slate-400 text-sm font-medium">{t("reviewInsuranceCards")}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void refreshDashboard()}
                disabled={isLoading}
                className="h-7 px-2 text-[10px] font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg gap-1.5"
              >
                <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
                {isLoading ? t("refreshing") : t("refresh")}
              </Button>
            </div>
          </div>
          {pendingPatients.length > 0 && (
            <Badge className="bg-amber-50 text-amber-600 border-none font-bold rounded-lg px-2 py-1">
              {pendingPatients.length} {t("pending")}
            </Badge>
          )}
        </div>

        {pendingPatients.length === 0 ? (
          <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-[32px] overflow-hidden bg-white/60">
            <CardContent className="p-8 text-center text-slate-400 text-sm font-medium">
              {t("noResults")}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {pendingPatients.map((patient: ApiPatient) => {
              const mh = (patient.medicalHistory as Record<string, unknown>) || {};
              const ins = (mh.insuranceDetails as Record<string, unknown>) || {};
              const imageUrl = (ins.cardImageUrl as string) || '';
              return (
                <Card key={patient.id} className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[32px] overflow-hidden bg-white group hover:shadow-[0_20px_50px_rgb(59,130,246,0.03)] transition-all duration-300">
                  <CardContent className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-14 w-14 border-2 border-white shadow-md">
                        <AvatarImage src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${patient.fullName}`} />
                        <AvatarFallback>P</AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <h3 className="text-lg font-bold text-slate-900">{patient.fullName}</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t("insuranceProvider")}: {String(ins.provider) || 'N/A'}</p>
                        <p className="text-xs font-medium text-slate-400">{t("policyNumber")}: {String(ins.policyNumber) || 'N/A'} • {t("date")}: {String(ins.expiryDate) || 'N/A'}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className="bg-blue-50 text-blue-600 border-none font-bold text-[10px] tracking-wide rounded-lg px-2 py-1">
                            {String(ins.category) || t("other")}
                          </Badge>
                          {imageUrl && (
                            <Button
                              variant="ghost"
                              onClick={() => setPreviewCard(imageUrl)}
                              className="text-xs font-bold text-blue-600 hover:text-blue-700 p-0 flex items-center gap-1 h-auto"
                            >
                              <Eye className="w-3.5 h-3.5" /> {t("viewCard")}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Inline actions and inputs for discount/approval */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 shrink-0 bg-slate-50/50 p-4 rounded-[24px] border border-slate-100 dark:border-slate-800">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{t("discountPercent")}</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={discountInputs[patient.id] ?? ''}
                          onChange={(e) => setDiscountInputs(prev => ({ ...prev, [patient.id]: Number(e.target.value) }))}
                          placeholder="e.g. 10"
                          className="h-10 w-24 rounded-xl bg-white border border-slate-100 dark:border-slate-800 px-3 text-sm font-bold shadow-sm focus:border-blue-500 text-slate-800"
                        />
                      </div>

                      <div className="space-y-1 flex-1 sm:w-48">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{t("noteOptional")}</span>
                        <input
                          type="text"
                          value={discountNotes[patient.id] ?? ''}
                          onChange={(e) => setDiscountNotes(prev => ({ ...prev, [patient.id]: e.target.value }))}
                          placeholder={isRTL ? "مثال: تغطية VIP" : "e.g. VIP Coverage"}
                          className="h-10 w-full rounded-xl bg-white border border-slate-100 dark:border-slate-800 px-3 text-sm font-medium shadow-sm focus:border-blue-500 text-slate-800"
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-2 sm:pt-4">
                        <Button
                          variant="ghost"
                          onClick={() => handleVerify(patient.id, 'rejected')}
                          className="h-10 w-10 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 p-0 flex items-center justify-center transition active:scale-[0.96]"
                        >
                          <X className="w-5 h-5" />
                        </Button>
                        <Button
                          onClick={() => handleVerify(patient.id, 'verified')}
                          className="h-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm px-4 shadow-md shadow-emerald-500/20 flex items-center gap-2 transition active:scale-[0.98]"
                        >
                          <Check className="w-4 h-4" /> {t("approve")}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Card Image Lightbox modal */}
      {previewCard && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-2xl w-full bg-white dark:bg-slate-900 rounded-[32px] p-4 shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col gap-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="font-bold text-slate-800 dark:text-slate-100">{t("insuranceCardImage")}</h3>
              <Button
                variant="ghost"
                onClick={() => setPreviewCard(null)}
                className="h-8 w-8 rounded-full p-0 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="relative aspect-[3/2] w-full rounded-[24px] overflow-hidden bg-slate-50 border border-slate-100 dark:border-slate-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewCard} alt="Insurance card preview" className="w-full h-full object-contain select-none" />
            </div>
            <div className="flex justify-end">
              <Button
                onClick={() => setPreviewCard(null)}
                className="rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold px-6 h-11"
              >
                {t("close")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Today's Appointments */}
      <div className="space-y-6">

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">{t("todaysAppointments")}</h2>
            <p className="text-slate-400 text-sm font-medium">{t("managingUpcomingSessions", { count: upcoming.length || 0 })}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/reception/waiting-room">
              <Button variant="outline" className="rounded-xl border-slate-100 bg-white text-slate-500 gap-2 h-10">
                {t("viewAllAppointments")}
              </Button>
            </Link>
          </div>
        </div>

        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[32px] overflow-hidden bg-white">
          <CardContent className="p-0">
            <div className="overflow-x-auto no-scrollbar">
              <table className={cn("w-full min-w-[900px]", isRTL ? "text-right" : "text-left")}>
                <thead>
                  <tr className="border-b border-slate-50">
                    <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/30">{t("patient")}</th>
                    <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/30">{t("service")}</th>
                    <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/30">{t("time")}</th>
                    <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/30">{t("status")}</th>
                    <th className={cn("px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/30", isRTL ? "text-left" : "text-right")}>{t("actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {todayAppointments.filter((apt: Appointment | DashboardStaffQueueItem) => {
                    const status = (apt.status as string).toUpperCase();
                    return status === "SCHEDULED" || status === "IN_PROGRESS" || status === "IN-PROGRESS";
                  }).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-slate-400 text-sm font-medium">
                        {t("noResults")}
                      </td>
                    </tr>
                  ) : (
                    todayAppointments
                      .filter((apt: Appointment | DashboardStaffQueueItem) => {
                        const status = (apt.status as string).toUpperCase();
                        return status === "SCHEDULED" || status === "IN_PROGRESS" || status === "IN-PROGRESS";
                      })
                      .map((apt: Appointment | DashboardStaffQueueItem, idx: number) => {
                        return (
                          <tr key={apt.id || idx} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
                                  <AvatarImage src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${apt.patientName}`} />
                                  <AvatarFallback>P</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col overflow-hidden">
                                  <span className="text-sm font-bold text-slate-800 leading-tight truncate">{apt.patientName}</span>
                                  <span className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">
                                    {apt.patientId ? `#PT-${apt.patientId.slice(-4)}` : "ID: N/A"}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5 text-[13px] font-medium text-slate-500 truncate">{apt.serviceName}</td>
                            <td className="px-6 py-5 text-[13px] font-bold text-slate-900">{apt.time}</td>
                            <td className="px-6 py-5">
                              <StatusBadge
                                status={(apt.status as string).toUpperCase().replace("-", "_") as DashboardAppointmentStatus}
                                avgTime={summary?.averageWaitMinutes}
                              />
                            </td>
                            <td className={cn("px-6 py-5", isRTL ? "text-left" : "text-right")}>
                              <ActionButton
                                status={(apt.status as string).toUpperCase().replace("-", "_") as DashboardAppointmentStatus}
                                patientId={apt.patientId}
                                aptId={apt.id}
                                onUpdate={(s) => handleStatusUpdate(apt.id, s)}
                                loading={processingId === apt.id}
                              />
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-6 text-center border-t border-slate-50">
              <Link href="/reception/waiting-room">
                <button className="text-slate-400 text-sm font-semibold hover:text-blue-600 transition-colors">
                  {t("viewAllAppointments")} ({summary?.totalToday || 0} {t("today")})
                </button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 5. Live Queue & Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6 overflow-hidden">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">{t("livePatientQueue")}</h2>
            <div className="flex items-center gap-1.5">
              <Dot className="h-5 w-5 text-emerald-500" />
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{t("liveUpdates")}</span>
            </div>
          </div>
          <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[32px] overflow-hidden bg-white">
            <CardContent className="p-0">
              <div className="overflow-x-auto no-scrollbar">
                <table className={cn("w-full table-fixed min-w-[700px] lg:min-w-0", isRTL ? "text-right" : "text-left")}>
                  <thead>
                    <tr className="border-b border-slate-50">
                      <th className="w-[22%] px-4 py-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/10">{t("patient")}</th>
                      <th className="w-[20%] px-4 py-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/10">{t("doctor")}</th>
                      <th className="w-[16%] px-4 py-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/10">{t("scheduled")}</th>
                      <th className="w-[18%] px-4 py-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/10">{t("status")}</th>
                      <th className={cn("w-[14%] px-4 py-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/10", isRTL ? "text-left" : "text-right")}>{t("action")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {todayAppointments.filter((apt: Appointment | DashboardStaffQueueItem) => {
                      const status = (apt.status as string).toUpperCase();
                      return status === "CONFIRMED";
                    }).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-slate-400 text-sm font-medium">
                          {t("noResults")}
                        </td>
                      </tr>
                    ) : (
                      todayAppointments
                        .filter((apt: Appointment | DashboardStaffQueueItem) => {
                          const status = (apt.status as string).toUpperCase();
                          return status === "CONFIRMED";
                        })
                        .map((apt: Appointment | DashboardStaffQueueItem, i: number) => (
                          <tr key={apt.id || i} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-4 py-5">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-9 w-9 border-2 border-white shadow-sm shrink-0">
                                  <AvatarImage src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${apt.patientName}`} />
                                  <AvatarFallback>P</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col overflow-hidden">
                                  <span className="text-sm font-bold text-slate-800 leading-tight truncate">{apt.patientName}</span>
                                  <span className="text-[10px] font-bold text-slate-400 mt-0.5 tracking-wider">
                                    {apt.patientId ? `#PT-${apt.patientId.slice(-4)}` : "ID: N/A"}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-5 text-[13px] font-medium text-slate-400/80 truncate">{apt.doctorName}</td>
                            <td className="px-4 py-5 text-[13px] font-bold text-slate-500/90 truncate">{apt.time}</td>
                            <td className="px-4 py-5">
                              <QueueStatusBadge
                                status={(apt.status as string).toUpperCase().replace("-", "_") === "IN_PROGRESS" ? "IN_PROGRESS" : (apt.status as string).toUpperCase().replace("-", "_") === "CONFIRMED" ? "WAITING" : "UPCOMING"}
                                avgTime={summary?.averageWaitMinutes}
                              />
                            </td>
                            <td className={cn("px-4 py-5", isRTL ? "text-left" : "text-right")}>
                              {(apt.status as string).toUpperCase().replace("-", "_") === "SCHEDULED" ? (
                                <button
                                  onClick={() => handleStatusUpdate(apt.id, "CONFIRMED")}
                                  disabled={processingId === apt.id}
                                  className={cn("text-[12px] font-bold text-blue-600 hover:text-blue-700 whitespace-nowrap flex items-center gap-1", isRTL ? "justify-start mr-auto" : "justify-end ml-auto")}
                                >
                                  {processingId === apt.id && <Loader2 className="h-3 w-3 animate-spin" />}
                                  {t("checkIn")}
                                </button>
                              ) : (apt.status as string).toUpperCase().replace("-", "_") === "CONFIRMED" ? (
                                <button
                                  onClick={() => handleStatusUpdate(apt.id, "IN_PROGRESS")}
                                  disabled={processingId === apt.id}
                                  className={cn("text-[12px] font-bold text-emerald-600 hover:text-emerald-700 whitespace-nowrap flex items-center gap-1", isRTL ? "justify-start mr-auto" : "justify-end ml-auto")}
                                >
                                  {processingId === apt.id && <Loader2 className="h-3 w-3 animate-spin" />}
                                  {t("startSession")}
                                </button>
                              ) : (apt.status as string).toUpperCase().replace("-", "_") === "IN_PROGRESS" ? (
                                <button
                                  onClick={() => handleStatusUpdate(apt.id, "COMPLETED")}
                                  disabled={processingId === apt.id}
                                  className={cn("text-[12px] font-bold text-purple-600 hover:text-purple-700 whitespace-nowrap flex items-center gap-1", isRTL ? "justify-start mr-auto" : "justify-end ml-auto")}
                                >
                                  {processingId === apt.id && <Loader2 className="h-3 w-3 animate-spin" />}
                                  {t("complete")}
                                </button>
                              ) : (
                                <button className="text-[12px] font-bold text-slate-400 hover:text-slate-600 whitespace-nowrap">
                                  {t("viewFile")}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="p-6 text-center border-t border-slate-50 bg-white/50">
                <Link href="/reception/waiting-room">
                  <button className="text-slate-400 text-[13px] font-bold hover:text-blue-600 transition-colors">{t("viewAll")} {t("patientQueue")}</button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Recent Activity & Clinic Performance */}
        <div className="lg:col-span-4 space-y-8">
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">{t("recentActivity")}</h2>
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[32px] overflow-hidden bg-white">
              <CardContent className="p-8">
                <div className={cn("space-y-8 relative", isRTL ? "before:absolute before:right-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-100 pr-4" : "before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-100 pl-4")}>
                  {activityLog.length === 0 ? (
                    <div className="text-center text-slate-400 text-sm py-4">{t("noRecentActivity")}</div>
                  ) : (
                    activityLog.map((log, idx) => (
                      <TimelineItem
                        key={idx}
                        time={new Date(log.timestamp).toLocaleTimeString(isRTL ? "ar-EG" : "en-US", { hour: '2-digit', minute: '2-digit' })}
                        title={log.title}
                        subtitle={log.description}
                        active={idx === 0}
                      />
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[32px] overflow-hidden bg-white">
              <CardContent className="p-8 space-y-8">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">{t("analytics")}</h2>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                      <span>{t("dailyTargets")}</span><span className="text-slate-900">
                        {summary?.completed || 0} / {summary?.totalToday || 0}
                      </span>
                    </div>
                    <Progress value={summary?.totalToday ? (summary.completed / summary.totalToday) * 100 : 0} className="h-2 bg-slate-50 [&>div]:bg-emerald-500" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                      <span>{t("waitTimeEfficiency")}</span><span className="text-slate-900">88%</span>
                    </div>
                    <Progress value={88} className="h-2 bg-slate-50 [&>div]:bg-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  trend?: string;
  badge?: string;
  color: "blue" | "orange" | "purple" | "green";
}

function StatCard({ icon: Icon, label, value, trend, badge, color }: StatCardProps) {
  const { isRTL } = useTranslation();
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    orange: "bg-orange-50 text-orange-600",
    purple: "bg-purple-50 text-purple-600",
    green: "bg-emerald-50 text-emerald-600"
  };
  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
      <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[32px] overflow-hidden bg-white">
        <CardContent className="p-8 space-y-6">
          <div className="flex items-center gap-4">
            <div className={cn("p-4 rounded-[20px]", colorMap[color])}><Icon className="h-6 w-6" /></div>
            <span className="text-slate-500 text-sm font-semibold">{label}</span>
          </div>
          <div className="flex items-baseline justify-between">
            <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{value}</h3>
            {trend && (
              <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-50 border-none font-bold rounded-lg px-2 py-1 flex items-center gap-0.5">
                <svg viewBox="0 0 24 24" className={cn("h-3 w-3 fill-current", isRTL && "rotate-180")}>
                  <path d="M7 11l5-5 5 5M7 17l5-5 5 5" />
                </svg>
                {trend}
              </Badge>
            )}
            {badge && <Badge className="bg-orange-50 text-orange-600 hover:bg-orange-50 border-none font-bold rounded-lg px-2 py-1">{badge}</Badge>}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface ActionCardProps {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  href: string;
}

function ActionCard({ icon: Icon, title, subtitle, href }: ActionCardProps) {
  return (
    <Link href={href}>
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[32px] overflow-hidden bg-white text-center cursor-pointer group hover:shadow-[0_20px_50px_rgb(59,130,246,0.1)] transition-all duration-300">
          <CardContent className="p-8 space-y-4">
            <div className="mx-auto h-14 w-14 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform duration-300"><Icon className="h-6 w-6" /></div>
            <div className="space-y-1"><h3 className="text-lg font-bold text-slate-900">{title}</h3><p className="text-slate-400 text-sm font-medium">{subtitle}</p></div>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
}

interface StatusBadgeProps {
  status: DashboardAppointmentStatus;
  avgTime?: number;
}

function StatusBadge({ status, avgTime }: StatusBadgeProps) {
  const { t } = useTranslation();
  const configs: Record<string, { label: string; color: string }> = {
    CONFIRMED: { label: avgTime !== undefined ? `${t("liveQueue")} (${avgTime} ${t("min")})` : t("liveQueue"), color: "bg-amber-50 text-amber-600" },
    IN_PROGRESS: { label: t("inprogress"), color: "bg-blue-50 text-blue-600" },
    SCHEDULED: { label: t("booked"), color: "bg-slate-100 text-slate-500" },
    COMPLETED: { label: t("completed"), color: "bg-emerald-50 text-emerald-600" },
    CANCELLED: { label: t("cancelled"), color: "bg-red-50 text-red-600" },
    NO_SHOW: { label: t("cancelled"), color: "bg-red-50 text-red-600" }
  };
  const config = configs[status] || configs.SCHEDULED;
  return <Badge className={cn("rounded-full px-4 py-1 border-none font-bold text-[11px]", config.color)}>{config.label}</Badge>;
}

interface ActionButtonProps {
  status: DashboardAppointmentStatus;
  patientId?: string;
  aptId?: string;
  onUpdate?: (status: string) => void;
  loading?: boolean;
}

function ActionButton({ status, patientId, aptId, onUpdate, loading }: ActionButtonProps) {
  const { t, isRTL } = useTranslation();
  if (loading) return <Loader2 className={cn("h-4 w-4 animate-spin text-blue-600", isRTL ? "mr-auto" : "ml-auto")} />;

  if (status === "SCHEDULED") {
    return (
      <Button
        variant="link"
        onClick={() => onUpdate?.("CONFIRMED")}
        className={cn("text-blue-600 font-bold hover:no-underline px-0 transition-all", isRTL ? "hover:-translate-x-1" : "hover:translate-x-1")}
      >
        {t("checkIn")}
      </Button>
    );
  }

  if (status === "CONFIRMED") {
    return (
      <Button
        variant="link"
        onClick={() => onUpdate?.("IN_PROGRESS")}
        className={cn("text-emerald-600 font-bold hover:no-underline px-0 transition-all", isRTL ? "hover:-translate-x-1" : "hover:translate-x-1")}
      >
        {t("startSession")}
      </Button>
    );
  }

  if (status === "IN_PROGRESS") {
    return (
      <Button
        variant="link"
        onClick={() => onUpdate?.("COMPLETED")}
        className={cn("text-purple-600 font-bold hover:no-underline px-0 transition-all", isRTL ? "hover:-translate-x-1" : "hover:translate-x-1")}
      >
        {t("complete")}
      </Button>
    );
  }

  if (status === "COMPLETED") {
    return (
      <Link href={`/reception/payments?appointmentId=${aptId}`}>
        <Button variant="link" className={cn("text-blue-600 font-bold hover:no-underline px-0 transition-all", isRTL ? "hover:-translate-x-1" : "hover:translate-x-1")}>
          {t("collectPayment")}
        </Button>
      </Link>
    );
  }

  return (
    <Link href={`/reception/patients?id=${patientId}`}>
      <Button variant="link" className={cn("text-slate-400 font-bold hover:no-underline px-0 transition-all text-xs", isRTL ? "hover:-translate-x-1" : "hover:translate-x-1")}>
        {t("viewFile")}
      </Button>
    </Link>
  );
}

interface QueueStatusBadgeProps {
  status: "IN_PROGRESS" | "WAITING" | "UPCOMING";
  avgTime?: number;
}

function QueueStatusBadge({ status, avgTime }: QueueStatusBadgeProps) {
  const { t, isRTL } = useTranslation();
  const configs: Record<string, { label: string; color: string }> = {
    IN_PROGRESS: { label: isRTL ? "في الجلسة" : "IN-SESSION", color: "bg-blue-50 text-blue-600" },
    WAITING: { label: avgTime !== undefined ? `${t("liveQueue")} (${avgTime} ${t("min")})` : (isRTL ? "قائمة الانتظار" : "LIVE-QUEUE"), color: "bg-amber-50 text-amber-600" },
    UPCOMING: { label: isRTL ? "مجدول" : "BOOKED", color: "bg-slate-50 text-slate-400" }
  };
  const config = configs[status] || configs.UPCOMING;
  return <Badge className={cn("rounded-full px-3 py-1 border-none font-bold text-[10px] tracking-tight", config.color)}>{config.label}</Badge>;
}

interface TimelineItemProps {
  time: string;
  title: string;
  subtitle: string;
  active?: boolean;
}

function TimelineItem({ time, title, subtitle, active }: TimelineItemProps) {
  return (
    <div className="flex gap-6 relative">
      <div className={cn("z-10 h-[22px] w-[22px] rounded-full border-4 border-white shadow-sm transition-colors", active ? "bg-blue-600" : "bg-slate-200")} />
      <div className="flex flex-col gap-1">
        <span className={cn("text-[13px] font-bold", active ? "text-blue-600" : "text-slate-400")}>{time}</span>
        <div className="space-y-0.5">
          <p className="text-sm font-bold text-slate-900">{title}</p>
          <p className="text-xs font-medium text-slate-400">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}



