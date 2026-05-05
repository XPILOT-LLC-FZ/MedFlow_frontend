"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  CalendarDays,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Mail,
  MessageCircle,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { prescriptionService } from "@/services/prescriptionService";
import { useTranslation } from "@/hooks/useTranslation";
import { useToastStore } from "@/stores/useToastStore";
import type { ApiPrescription, PrescriptionStatus } from "@/types";

type StatusFilter = "ALL" | "ISSUED" | "SENT" | "DRAFT";

export default function ReceptionPrescriptionsPage() {
  const { t, isRTL, locale } = useTranslation();
  const toastSuccess = useToastStore((s) => s.success);
  const toastError = useToastStore((s) => s.error);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [prescriptions, setPrescriptions] = useState<ApiPrescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPrescriptions = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await prescriptionService.getAll({
        status: statusFilter === "ALL" ? undefined : statusFilter as PrescriptionStatus,
      });
      setPrescriptions(data);
    } catch (error) {
      console.error("Failed to fetch prescriptions:", error);
      toastError(t("error"));
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, t, toastError]);

  useEffect(() => {
    void fetchPrescriptions();
  }, [fetchPrescriptions]);

  const filteredPrescriptions = useMemo(() => {
    return prescriptions.filter((p) => {
      const pName = p.patient?.fullName || "";
      const dName = p.doctor?.fullName || "";
      const query = searchQuery.toLowerCase();
      return pName.toLowerCase().includes(query) || dName.toLowerCase().includes(query);
    });
  }, [prescriptions, searchQuery]);

  const readyCount = useMemo(() => prescriptions.filter(p => p.status === "ISSUED").length, [prescriptions]);
  const sentCount = useMemo(() => prescriptions.filter(p => p.status === "SENT").length, [prescriptions]);
  const totalCount = prescriptions.length;
  const efficiencyRate = useMemo(() => {
    if (totalCount === 0) return 0;
    return Math.round((sentCount / totalCount) * 100);
  }, [sentCount, totalCount]);

  const handleSend = async (id: string) => {
    try {
      await prescriptionService.update(id, { status: "SENT" });
      toastSuccess(t("statusUpdatedSuccessfully"));
      void fetchPrescriptions();
    } catch {
      toastError(t("error"));
    }
  };

  const mapStatus = (s: PrescriptionStatus): "Ready" | "Sent" | "Pending" => {
    if (s === "SENT") return "Sent";
    if (s === "ISSUED") return "Ready";
    return "Pending";
  };

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="p-4 lg:p-6 space-y-6 lg:space-y-8 w-full mx-auto bg-slate-50 min-h-screen pb-24 overflow-x-hidden relative -m-4 md:-m-6">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className={cn("space-y-1", isRTL ? "text-right" : "text-left")}>
          <h1 className="text-xl md:text-[22px] font-bold text-slate-900 tracking-tight">
            {t("prescriptions") || (isRTL ? "الوصفات الطبية" : "Prescriptions")}
          </h1>
          <p className="text-slate-400 text-xs md:text-sm font-medium">
            {isRTL
              ? "إدارة ومتابعة العمليات الطبية عبر الأقسام."
              : "Manage and track medical operations across departments."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 md:gap-3 px-3 md:px-5 py-1.5 md:py-2.5 bg-white border border-slate-100 rounded-xl md:rounded-2xl shadow-sm cursor-pointer hover:bg-slate-50 transition-colors whitespace-nowrap">
            <CalendarDays className="h-4 w-4 md:h-5 md:w-5 text-indigo-600" />
            <span className="text-[12px] md:text-sm font-semibold text-slate-700">
              {new Date().toLocaleDateString(isRTL ? "ar-EG" : "en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <ChevronDown className="h-3 w-3 md:h-4 md:w-4 text-slate-400" />
          </div>
        </div>
      </div>

      {/* 2. Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 w-full lg:w-3/4 xl:w-2/3">
        {/* Efficiency Rate Card */}
        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-[24px] md:rounded-[32px] overflow-hidden bg-white">
          <CardContent className="p-5 md:p-8 space-y-4 md:space-y-6">
            <div className={cn("flex items-center justify-between", isRTL ? "flex-row-reverse" : "flex-row")}>
              <span className="text-slate-900 font-bold text-xs md:text-sm">
                {t("efficiencyRate") || (isRTL ? "معدل الكفاءة" : "Efficiency rate")}
              </span>
              <div className="flex items-center gap-1 text-emerald-500 text-[10px] md:text-xs font-bold">
                <TrendingUp className="h-3 w-3" />
                +5.2%
              </div>
            </div>
            <div className="space-y-3 md:space-y-4">
              <div className={cn("flex items-baseline gap-2", isRTL ? "flex-row-reverse" : "flex-row")}>
                <h3 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter">{efficiencyRate.toLocaleString(isRTL ? "ar-EG" : "en-US")}%</h3>
                <span className="text-slate-400 text-[10px] md:text-sm font-bold truncate">
                  {isRTL ? "وصفات تم إرسالها < 2س" : "prescriptions sent < 2h"}
                </span>
              </div>
              <Progress value={efficiencyRate} className="h-2 md:h-2.5 bg-slate-50 rounded-full [&>div]:bg-blue-600" />
            </div>
          </CardContent>
        </Card>

        {/* Ready for Pickup Card */}
        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-[24px] md:rounded-[32px] overflow-hidden bg-white">
          <CardContent className="p-5 md:p-8 space-y-4 md:space-y-6">
            <span className={cn("block text-slate-900 font-bold text-xs md:text-sm", isRTL ? "text-right" : "text-left")}>
              {t("readyForPickup") || (isRTL ? "جاهزة للاستلام" : "Ready for pickup")}
            </span>
            <div className="space-y-3 md:space-y-4">
              <div className={cn("flex items-baseline gap-2", isRTL ? "flex-row-reverse" : "flex-row")}>
                <h3 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter">{readyCount.toLocaleString(isRTL ? "ar-EG" : "en-US")}</h3>
                <span className="text-slate-400 text-[10px] md:text-sm font-bold truncate">
                  {t("awaitingPatientCollection") || (isRTL ? "بانتظار استلام المريض" : "awaiting patient collection")}
                </span>
              </div>
              <div className={cn("flex items-center", isRTL ? "flex-row-reverse" : "flex-row")}>
                <div className={cn("flex items-center", isRTL ? "space-x-reverse -space-x-2 md:-space-x-3" : "-space-x-2 md:-space-x-3")}>
                  {prescriptions.filter(p => p.status === "ISSUED").slice(0, 3).map((p) => (
                    <Avatar key={p.id} className="h-7 w-7 md:h-9 md:w-9 border-2 md:border-4 border-white shadow-sm shrink-0">
                      <AvatarImage src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${p.patient?.fullName}`} />
                      <AvatarFallback>P</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                {readyCount > 3 && (
                  <span className={cn("text-slate-400 text-[10px] md:text-xs font-bold", isRTL ? "mr-3" : "ml-3")}>+{ (readyCount - 3).toLocaleString(isRTL ? "ar-EG" : "en-US") } {isRTL ? "أكثر" : "more"}</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Main Content Section */}
      <Card className="border-none shadow-[0_8px_40px_rgb(0,0,0,0.03)] rounded-[24px] md:rounded-[40px] overflow-hidden bg-white p-1">
        <CardContent className="p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8">
          {/* Filters Bar */}
          <div className={cn("flex flex-col xl:flex-row xl:items-center justify-between gap-4 md:gap-6", isRTL ? "xl:flex-row-reverse" : "xl:flex-row")}>
            <div className="relative w-full max-w-[400px]">
              <Search className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300", isRTL ? "right-4" : "left-4")} />
              <Input
                placeholder={isRTL ? "البحث في المهام أو المرضى..." : "Search tasks or patients..."}
                className={cn("h-11 md:h-12 rounded-xl md:rounded-2xl border-slate-100 bg-slate-50/20 focus:ring-blue-600/5 focus:border-blue-200 text-sm", isRTL ? "pr-11 text-right" : "pl-11 text-left")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className={cn("flex items-center gap-2 md:gap-3 overflow-x-auto no-scrollbar pb-1", isRTL ? "flex-row-reverse" : "flex-row")}>
              <TableFilter 
                label={statusFilter === "ALL" ? (isRTL ? "كل الحالات" : "All states") : statusFilter} 
                onClick={() => {
                  const states: StatusFilter[] = ["ALL", "ISSUED", "SENT", "DRAFT"];
                  const next = states[(states.indexOf(statusFilter) + 1) % states.length];
                  setStatusFilter(next);
                }}
              />
              <TableFilter label={t("allDoctors")} />
              <TableFilter label={t("allPriority") || (isRTL ? "كل الأولويات" : "All Priority")} />
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto no-scrollbar rounded-2xl md:rounded-3xl border border-slate-50">
            <table className="w-full text-left border-collapse table-fixed min-w-[950px] xl:min-w-full">
              <thead>
                <tr className="bg-slate-50/30">
                  <th className={cn("w-[22%] px-4 md:px-6 py-4 md:py-5 text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-widest", isRTL ? "text-right last:rounded-tl-3xl" : "text-left first:rounded-tl-3xl")}>
                    {t("patientName")}
                  </th>
                  <th className={cn("w-[18%] px-4 md:px-6 py-4 md:py-5 text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-widest", isRTL ? "text-right" : "text-left")}>
                    {t("assignedDoctor") || (isRTL ? "الطبيب المعين" : "ASSIGNED DOCTOR")}
                  </th>
                  <th className={cn("w-[15%] px-4 md:px-6 py-4 md:py-5 text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-widest", isRTL ? "text-right" : "text-left")}>
                    {t("dateAndTime") || (isRTL ? "التاريخ والوقت" : "DATE & TIME")}
                  </th>
                  <th className={cn("w-[14%] px-4 md:px-6 py-4 md:py-5 text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-widest", isRTL ? "text-right" : "text-left")}>
                    {t("type")}
                  </th>
                  <th className="w-[10%] px-4 md:px-6 py-4 md:py-5 text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">
                    {isRTL ? "الحالة" : "Status"}
                  </th>
                  <th className="w-[10%] px-4 md:px-6 py-4 md:py-5 text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">
                    {t("comms") || (isRTL ? "التواصل" : "Comms")}
                  </th>
                  <th className={cn("w-[11%] px-4 md:px-6 py-4 md:py-5 text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right", isRTL ? "text-left first:rounded-tr-3xl" : "text-right last:rounded-tr-3xl")}>
                    {isRTL ? "الإجراءات" : "Actions"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading && prescriptions.length === 0 ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={7} className="px-6 py-8">
                        <div className="h-6 bg-slate-100 rounded-xl animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : filteredPrescriptions.length === 0 ? (
                   <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-slate-400 font-medium">
                      {isRTL ? "لا توجد وصفات طبية" : "No prescriptions found"}
                    </td>
                  </tr>
                ) : (
                  filteredPrescriptions.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/30 transition-colors group">
                      <td className="px-4 md:px-6 py-4 md:py-6 overflow-hidden">
                        <div className={cn("flex items-center gap-3 md:gap-4 min-w-0", isRTL ? "flex-row-reverse" : "flex-row")}>
                          <Avatar className="h-8 w-8 md:h-11 md:w-11 border-2 border-white shadow-sm shrink-0">
                            <AvatarImage src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${item.patient?.fullName}`} />
                            <AvatarFallback className="bg-indigo-50 text-indigo-500 font-bold text-[10px]">{item.patient?.fullName?.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className={cn("flex flex-col min-w-0", isRTL ? "text-right" : "text-left")}>
                            <span className="text-[13px] md:text-[15px] font-bold text-slate-800 leading-tight truncate">
                              {item.patient?.fullName}
                            </span>
                            <span className="text-[9px] md:text-[11px] font-bold text-slate-400 mt-1 truncate">
                              PID: {item.patientId.slice(-6).toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4 md:py-6 overflow-hidden">
                        <div className={cn("flex items-center gap-2 md:gap-3 min-w-0", isRTL ? "flex-row-reverse" : "flex-row")}>
                          <Avatar className="h-7 w-7 md:h-9 md:w-9 border-2 border-white shadow-sm shrink-0">
                            <AvatarImage src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${item.doctor?.fullName}`} />
                            <AvatarFallback>D</AvatarFallback>
                          </Avatar>
                          <span className="text-[12px] md:text-[14px] font-bold text-slate-700 truncate">
                            {item.doctor?.fullName}
                          </span>
                        </div>
                      </td>
                      <td className={cn("px-4 md:px-6 py-4 md:py-6", isRTL ? "text-right" : "text-left")}>
                        <div className="text-[12px] md:text-[14px] font-bold text-slate-700 truncate">
                          {new Date(item.createdAt).toLocaleDateString(isRTL ? "ar-EG" : "en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </div>
                        <div className="text-[9px] md:text-[11px] font-bold text-slate-400 mt-0.5 uppercase tracking-tight truncate">
                          {new Date(item.createdAt).toLocaleTimeString(isRTL ? "ar-EG" : "en-US", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </td>
                      <td className={cn("px-4 md:px-6 py-4 md:py-6", isRTL ? "text-right" : "text-left")}>
                        <span className="text-[9px] md:text-[11px] font-black text-indigo-500 bg-indigo-50/50 px-2 md:px-2.5 py-1 rounded-md uppercase tracking-wider whitespace-nowrap">
                          {isRTL ? "استشارة" : "CONSULTATION"}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-4 md:py-6 text-center">
                        <StatusBadge status={mapStatus(item.status)} />
                      </td>
                      <td className="px-4 md:px-6 py-4 md:py-6">
                        <div className="flex items-center justify-center gap-3 md:gap-5">
                          <Mail className={cn("h-4 w-4 md:h-5 md:w-5 transition-colors", item.status === "SENT" ? "text-blue-600 fill-blue-50" : "text-slate-200")} />
                          <MessageCircle className={cn("h-4 w-4 md:h-5 md:w-5 transition-colors text-slate-200")} />
                        </div>
                      </td>
                      <td className={cn("px-4 md:px-6 py-4 md:py-6", isRTL ? "text-left" : "text-right")}>
                        <Button
                          size="sm"
                          onClick={() => handleSend(item.id)}
                          className={cn(
                            "rounded-[10px] md:rounded-[14px] px-4 md:px-7 font-black text-[9px] md:text-[11px] h-8 md:h-11 uppercase tracking-widest shadow-sm transition-all whitespace-nowrap",
                            item.status === "SENT" 
                              ? "bg-slate-50 text-slate-400 hover:bg-slate-100" 
                              : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/10"
                          )}
                        >
                          {item.status === "SENT" ? (isRTL ? "إعادة إرسال" : "Resend") : (isRTL ? "إرسال" : "Send")}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {filteredPrescriptions.length > 0 && (
            <div className={cn("flex flex-col sm:flex-row items-center justify-between gap-4 pt-4", isRTL ? "sm:flex-row-reverse" : "sm:flex-row")}>
              <p className="text-[11px] md:text-[13px] font-bold text-slate-400">
                {isRTL ? "عرض" : "Showing"} <span className="text-slate-900">{ (1).toLocaleString(isRTL ? "ar-EG" : "en-US") }</span> {isRTL ? "إلى" : "to"} <span className="text-slate-900">{Math.min(filteredPrescriptions.length, 10).toLocaleString(isRTL ? "ar-EG" : "en-US")}</span> {isRTL ? "من" : "of"} <span className="text-slate-900">{filteredPrescriptions.length.toLocaleString(isRTL ? "ar-EG" : "en-US")}</span> {isRTL ? "نتيجة" : "results"}
              </p>
              <div className={cn("flex items-center gap-2", isRTL ? "flex-row-reverse" : "flex-row")}>
                <PaginationButton icon={isRTL ? ChevronRight : ChevronLeft} disabled />
                <PaginationNumber number={1} active />
                {filteredPrescriptions.length > 10 && <PaginationNumber number={2} />}
                <PaginationButton icon={isRTL ? ChevronLeft : ChevronRight} disabled={filteredPrescriptions.length <= 10} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────────── */

function TableFilter({ label, onClick }: { label: string; onClick?: () => void }) {
  const { isRTL } = useTranslation();
  return (
    <div 
      onClick={onClick}
      className={cn("flex items-center gap-2 md:gap-4 px-3 md:px-5 py-2 md:py-3 bg-white border border-slate-100 rounded-xl md:rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors whitespace-nowrap", isRTL ? "flex-row-reverse" : "flex-row")}
    >
      <span className="text-[11px] md:text-[13px] font-bold text-slate-500">{label}</span>
      <ChevronDown className="h-3 w-3 md:h-4 md:w-4 text-slate-400" />
    </div>
  );
}

function StatusBadge({ status }: { status: "Ready" | "Sent" | "Pending" }) {
  const { isRTL } = useTranslation();
  const configs = {
    Ready: "bg-orange-50 text-orange-400",
    Sent: "bg-emerald-50 text-emerald-600",
    Pending: "bg-slate-100 text-slate-400",
  };
  
  const labels = {
    Ready: isRTL ? "جاهزة" : "Ready",
    Sent: isRTL ? "تم الإرسال" : "Sent",
    Pending: isRTL ? "قيد الانتظار" : "Pending"
  };

  return (
    <Badge className={cn("rounded-lg md:rounded-[14px] px-3 md:px-5 py-1 md:py-2 border-none font-black text-[9px] md:text-[11px] uppercase tracking-widest whitespace-nowrap", configs[status])}>
      {labels[status]}
    </Badge>
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
        "h-9 w-9 md:h-11 md:w-11 flex items-center justify-center rounded-xl md:rounded-[14px] border border-slate-100 transition-all",
        disabled ? "bg-slate-50 text-slate-100 cursor-not-allowed" : "bg-white text-slate-400 hover:border-blue-600 hover:text-blue-600"
      )}
    >
      <Icon className="h-4 w-4 md:h-5 md:w-5" />
    </button>
  );
}

function PaginationNumber({ number, active }: { number: number; active?: boolean }) {
  const { isRTL } = useTranslation();
  return (
    <button
      className={cn(
        "h-9 w-9 md:h-11 md:w-11 flex items-center justify-center rounded-xl md:rounded-[14px] font-bold text-[12px] md:text-[14px] transition-all",
        active ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "text-slate-500 hover:bg-slate-100"
      )}
    >
      {number.toLocaleString(isRTL ? "ar-EG" : "en-US")}
    </button>
  );
}
