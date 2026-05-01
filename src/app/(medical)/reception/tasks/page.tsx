"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  CalendarDays,
  Plus,
  Search,
  ChevronDown,
  Clock,
  ClipboardList,
  CheckSquare,
  CheckCircle2,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
  FileText,
  X,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { bookingService } from "@/services/bookingService";
import { useTranslation } from "@/hooks/useTranslation";
import { useToastStore } from "@/stores/useToastStore";
import { HandoffPdfModal } from "@/components/reception/HandoffPdfModal";
import { cn } from "@/lib/utils";
import type { ApiReceptionHandoff } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

type StatusFilter = "ALL" | "NEW" | "REVIEWED";

export default function ReceptionTasksPage() {
  const { locale } = useTranslation();
  const toastSuccess = useToastStore((s) => s.success);
  const toastError = useToastStore((s) => s.error);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [handoffs, setHandoffs] = useState<ApiReceptionHandoff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedHandoff, setSelectedHandoff] = useState<ApiReceptionHandoff | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // ── Data fetching ────────────────────────────────────────────
  const fetchHandoffs = useCallback(async () => {
    try {
      const result = await bookingService.getReceptionHandoffs({
        status: statusFilter === "ALL" ? undefined : (statusFilter as "NEW" | "REVIEWED"),
        limit: 50,
      });
      setHandoffs(result);
    } catch (error) {
      console.error("Failed to fetch handoffs:", error);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void fetchHandoffs();
    const interval = setInterval(() => void fetchHandoffs(), 30000);
    return () => clearInterval(interval);
  }, [fetchHandoffs]);

  // ── Derived data ─────────────────────────────────────────────
  const filteredHandoffs = useMemo(
    () =>
      handoffs.filter(
        (h) =>
          h.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          h.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (h.diagnosis || "").toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [handoffs, searchQuery]
  );

  const newCount = useMemo(() => handoffs.filter((h) => h.status === "NEW").length, [handoffs]);
  const reviewedCount = useMemo(() => handoffs.filter((h) => h.status === "REVIEWED").length, [handoffs]);

  // ── Actions ──────────────────────────────────────────────────
  const handleMarkAsReviewed = async (handoffId: string) => {
    try {
      await bookingService.markReceptionHandoffReviewed(handoffId);
      toastSuccess(locale === "ar" ? "تم تحديد المهمة كمكتملة" : "Task marked as reviewed");
      void fetchHandoffs();
    } catch {
      toastError(locale === "ar" ? "فشل تحديث الحالة" : "Failed to update status");
    }
  };

  const openPdfPreview = (handoff: ApiReceptionHandoff) => {
    setSelectedHandoff(handoff);
    setIsPdfModalOpen(true);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getTimeAgo = (dateStr: string) => {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return locale === "ar" ? "الآن" : "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return locale === "ar" ? `منذ ${minutes} دقيقة` : `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return locale === "ar" ? `منذ ${hours} ساعة` : `${hours}h ago`;
    return formatDate(dateStr);
  };

  const getTaskTitle = (h: ApiReceptionHandoff) => {
    if (h.diagnosis) return h.diagnosis;
    if (h.notesSnapshot) return h.notesSnapshot.slice(0, 40) + (h.notesSnapshot.length > 40 ? "…" : "");
    return locale === "ar" ? "ملاحظات سريرية" : "Clinical Notes";
  };

  const getPriority = (h: ApiReceptionHandoff): "High" | "Medium" | "Low" => {
    if (h.status === "NEW") {
      const seconds = Math.floor((Date.now() - new Date(h.createdAt).getTime()) / 1000);
      if (seconds > 3600) return "High";
      if (seconds > 1800) return "Medium";
    }
    return "Low";
  };

  const getStatus = (h: ApiReceptionHandoff): "Pending" | "In Progress" | "Done" => {
    if (h.status === "REVIEWED") return "Done";
    const seconds = Math.floor((Date.now() - new Date(h.createdAt).getTime()) / 1000);
    if (seconds > 1800) return "In Progress";
    return "Pending";
  };

  return (
    <div className="p-4 md:p-8 space-y-8 md:space-y-10 max-w-[1600px] mx-auto bg-[#F9FAFB] min-h-screen pb-24">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            {locale === "ar" ? "المهام" : "Tasks"}
          </h1>
          <p className="text-slate-500 text-xs md:text-sm font-medium">
            {locale === "ar"
              ? "إدارة ومتابعة العمليات الطبية عبر الأقسام."
              : "Manage and track medical operations across departments."}
          </p>
        </div>

        <div className="flex items-center gap-3 md:gap-4 overflow-x-auto no-scrollbar pb-2 md:pb-0">
          <div className="hidden lg:flex items-center gap-3 px-5 py-2.5 bg-white border border-slate-100 rounded-2xl shadow-sm cursor-pointer hover:bg-slate-50 transition-colors whitespace-nowrap">
            <CalendarDays className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-semibold text-slate-700">
              {new Date().toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </div>
          
          <div className="flex items-center gap-2 md:gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsLoading(true);
                void fetchHandoffs();
              }}
              className="border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl md:rounded-2xl h-10 md:h-12 px-4 md:px-5 flex items-center gap-2 font-bold shadow-sm transition-all whitespace-nowrap"
            >
              <RefreshCw className={cn("h-4 w-4 md:h-5 md:w-5", isLoading && "animate-spin")} />
              <span className="text-xs md:text-sm">{locale === "ar" ? "تحديث" : "Refresh"}</span>
            </Button>

            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl md:rounded-2xl h-10 md:h-12 px-4 md:px-6 flex items-center gap-2 font-bold shadow-lg shadow-blue-100 whitespace-nowrap"
            >
              <Plus className="h-4 w-4 md:h-5 md:w-5" />
              <span className="text-xs md:text-sm">{locale === "ar" ? "إنشاء مهمة" : "Create Task"}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <TaskSummaryCard
          label={locale === "ar" ? "مهام معلقة" : "Overdue tasks"}
          value={String(newCount)}
          icon={Clock}
          iconBg="bg-rose-50"
          iconColor="text-rose-500"
        />
        <TaskSummaryCard
          label={locale === "ar" ? "أولوية عالية" : "High priority"}
          value={String(handoffs.filter((h) => getPriority(h) === "High").length)}
          icon={ClipboardList}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <TaskSummaryCard
          label={locale === "ar" ? "مكتملة اليوم" : "Completed today"}
          value={String(reviewedCount)}
          icon={CheckSquare}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
          className="sm:col-span-2 md:col-span-1"
        />
      </div>

      {/* 3. Tasks Table */}
      <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[24px] md:rounded-[40px] overflow-hidden bg-white p-1 md:p-2">
        <CardContent className="p-4 md:p-6 space-y-6 md:space-y-8">
          {/* Filters Bar */}
          <div className="flex flex-col xl:flex-row xl:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder={
                  locale === "ar" ? "بحث في المهام أو المرضى..." : "Search tasks or patients..."
                }
                className="pl-11 h-11 md:h-12 rounded-xl md:rounded-2xl border-slate-100 bg-slate-50/30 focus:ring-blue-600/5 focus:border-blue-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 md:gap-3 overflow-x-auto no-scrollbar pb-1">
              <TableFilter
                label={
                  statusFilter === "ALL"
                    ? (locale === "ar" ? "كل الحالات" : "All states")
                    : statusFilter === "NEW"
                      ? (locale === "ar" ? "جديد" : "New")
                      : (locale === "ar" ? "تمت المراجعة" : "Reviewed")
                }
                onClick={() =>
                  setStatusFilter((prev) =>
                    prev === "ALL" ? "NEW" : prev === "NEW" ? "REVIEWED" : "ALL"
                  )
                }
              />
              <TableFilter label={locale === "ar" ? "كل الأطباء" : "All Doctors"} />
              <TableFilter label={locale === "ar" ? "كل الأولويات" : "All Priority"} />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto no-scrollbar rounded-2xl md:rounded-3xl border border-slate-50">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 md:py-5 text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-widest first:rounded-tl-2xl">
                    {locale === "ar" ? "عنوان المهمة" : "Task Title"}
                  </th>
                  <th className="px-6 py-4 md:py-5 text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    {locale === "ar" ? "التاريخ" : "Due Date"}
                  </th>
                  <th className="px-6 py-4 md:py-5 text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    {locale === "ar" ? "اسم المريض" : "Patient Name"}
                  </th>
                  <th className="px-6 py-4 md:py-5 text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    {locale === "ar" ? "الطبيب المعين" : "Assigned Doctor"}
                  </th>
                  <th className="px-6 py-4 md:py-5 text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    {locale === "ar" ? "الأولوية" : "Priority"}
                  </th>
                  <th className="px-6 py-4 md:py-5 text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    {locale === "ar" ? "الحالة" : "Status"}
                  </th>
                  <th className="px-6 py-4 md:py-5 text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right last:rounded-tr-2xl">
                    {locale === "ar" ? "الإجراءات" : "Actions"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading && handoffs.length === 0 ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={7} className="px-6 py-8">
                        <div className="h-6 bg-slate-100 rounded-xl animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : filteredHandoffs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-12 w-12 md:h-14 md:w-14 bg-slate-100 rounded-full flex items-center justify-center">
                          <ClipboardList className="h-6 w-6 md:h-7 md:w-7 text-slate-300" />
                        </div>
                        <p className="text-base md:text-lg font-bold text-slate-900">
                          {locale === "ar" ? "لا توجد مهام" : "No tasks found"}
                        </p>
                        <p className="text-xs md:text-sm text-slate-400 max-w-xs">
                          {locale === "ar"
                            ? "سيظهر هنا أي تقارير أو ملاحظات يتم إرسالها من الأطباء."
                            : "Reports and notes sent by doctors will appear here for processing."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredHandoffs.map((handoff) => (
                    <tr key={handoff.id} className="hover:bg-slate-50/30 transition-colors group">
                      <td className="px-6 py-5 md:py-6">
                        <div className="flex items-center gap-3">
                          <div className={cn("h-2 w-2 rounded-full shrink-0", handoff.status === "NEW" ? "bg-blue-600 animate-pulse" : "bg-slate-300")} />
                          <span className="text-sm font-bold text-slate-900 truncate max-w-[200px]">
                            {getTaskTitle(handoff)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 md:py-6 text-sm font-medium text-slate-500 whitespace-nowrap">
                        {formatDate(handoff.createdAt)}
                      </td>
                      <td className="px-6 py-5 md:py-6">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 border-2 border-white shadow-sm shrink-0">
                            <AvatarImage src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${handoff.patientName}`} />
                            <AvatarFallback>P</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-bold text-slate-700 truncate">{handoff.patientName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 md:py-6">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 border-2 border-white shadow-sm shrink-0">
                            <AvatarImage src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${handoff.doctorName}`} />
                            <AvatarFallback>D</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-bold text-slate-700 truncate">
                            {locale === "ar" ? "د." : "Dr."} {handoff.doctorName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 md:py-6">
                        <PriorityText priority={getPriority(handoff)} />
                      </td>
                      <td className="px-6 py-5 md:py-6">
                        <StatusBadge status={getStatus(handoff)} />
                      </td>
                      <td className="px-6 py-5 md:py-6 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                          {handoff.status === "NEW" && (
                            <button
                              onClick={() => handleMarkAsReviewed(handoff.id)}
                              className="p-2 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all duration-200"
                              title={locale === "ar" ? "إنهاء المهمة" : "Mark as done"}
                            >
                              <CheckCircle2 className="h-5 w-5" />
                            </button>
                          )}
                          {handoff.status === "REVIEWED" && (
                            <div className="p-2 rounded-xl text-blue-600 bg-blue-50">
                              <CheckCircle2 className="h-5 w-5" />
                            </div>
                          )}
                          <button
                            onClick={() => openPdfPreview(handoff)}
                            className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                            title={locale === "ar" ? "عرض وتحميل" : "View & PDF"}
                          >
                            <Download className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {filteredHandoffs.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
              <p className="text-xs md:text-sm font-medium text-slate-400">
                {locale === "ar" ? "عرض" : "Showing"}{" "}
                <span className="text-slate-900">1</span>{" "}
                {locale === "ar" ? "إلى" : "to"}{" "}
                <span className="text-slate-900">{Math.min(filteredHandoffs.length, 10)}</span>{" "}
                {locale === "ar" ? "من" : "of"}{" "}
                <span className="text-slate-900">{filteredHandoffs.length}</span>{" "}
                {locale === "ar" ? "نتيجة" : "results"}
              </p>
              <div className="flex items-center gap-2">
                <PaginationButton icon={ChevronLeft} disabled />
                <PaginationNumber number={1} active />
                {filteredHandoffs.length > 10 && <PaginationNumber number={2} />}
                <PaginationButton icon={ChevronRight} disabled={filteredHandoffs.length <= 10} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* PDF Modal */}
      {selectedHandoff && (
        <HandoffPdfModal
          handoff={selectedHandoff}
          isOpen={isPdfModalOpen}
          onClose={() => setIsPdfModalOpen(false)}
        />
      )}

      {/* Create Task Modal */}
      <CreateTaskModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        locale={locale}
      />
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────────── */

function CreateTaskModal({ isOpen, onClose, locale }: { isOpen: boolean, onClose: () => void, locale: string }) {
  const [priority, setPriority] = useState<"Low" | "Medium" | "High">("Low");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-[24px] md:rounded-[32px] border-none shadow-2xl bg-white max-h-[95vh] flex flex-col">
        <DialogHeader className="px-6 md:px-8 py-4 md:py-6 border-b border-slate-50 flex flex-row items-center justify-between shrink-0">
          <DialogTitle className="text-lg md:text-xl font-bold text-slate-900">
            {locale === "ar" ? "إنشاء مهمة جديدة" : "Create New Task"}
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 md:p-8 space-y-5 md:space-y-6 overflow-y-auto no-scrollbar flex-1">
          {/* Task Title */}
          <div className="space-y-1.5">
            <label className="text-xs md:text-sm font-bold text-slate-700">
              {locale === "ar" ? "عنوان المهمة" : "Task title"}
            </label>
            <Input 
              placeholder="e.g. Schedule MRI Review" 
              className="h-12 md:h-14 rounded-xl md:rounded-2xl border-slate-100 bg-slate-50/30 focus:ring-blue-600/5 focus:border-blue-200 font-medium text-sm md:text-base"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs md:text-sm font-bold text-slate-700">
              {locale === "ar" ? "الوصف" : "Description"}
            </label>
            <Textarea 
              placeholder="Provide additional context for the clinical staff..."
              className="min-h-[100px] md:min-h-[120px] rounded-xl md:rounded-2xl border-slate-100 bg-slate-50/30 focus:ring-blue-600/5 focus:border-blue-200 font-medium resize-none text-sm md:text-base"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Select Patient */}
            <div className="space-y-1.5">
              <label className="text-xs md:text-sm font-bold text-slate-700">
                {locale === "ar" ? "اختر المريض" : "Select patient"}
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Search name..." 
                  className="pl-11 h-12 md:h-14 rounded-xl md:rounded-2xl border-slate-100 bg-slate-50/30 text-sm md:text-base"
                />
              </div>
            </div>

            {/* Due Date */}
            <div className="space-y-1.5">
              <label className="text-xs md:text-sm font-bold text-slate-700">
                {locale === "ar" ? "تاريخ الاستحقاق" : "Due date"}
              </label>
              <div className="relative">
                <Input 
                  placeholder="MM / DD / YYYY" 
                  className="h-12 md:h-14 rounded-xl md:rounded-2xl border-slate-100 bg-slate-50/30 text-sm md:text-base"
                />
                <CalendarIcon className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Assign to Doctor */}
          <div className="space-y-1.5">
            <label className="text-xs md:text-sm font-bold text-slate-700">
              {locale === "ar" ? "تعيين للطبيب" : "Assign to doctor"}
            </label>
            <div className="flex items-center justify-between p-3 h-12 md:h-14 bg-slate-50/30 border border-slate-100 rounded-xl md:rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <Avatar className="h-7 w-7 md:h-8 md:w-8 shrink-0">
                  <AvatarImage src="https://api.dicebear.com/9.x/avataaars/svg?seed=SarahMiller" />
                  <AvatarFallback>D</AvatarFallback>
                </Avatar>
                <span className="text-xs md:text-sm font-bold text-slate-700 truncate">Dr. Sarah Miller</span>
              </div>
              <ChevronDown className="h-4 w-4 md:h-5 md:w-5 text-slate-400 shrink-0" />
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-2 pb-2">
            <label className="text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              {locale === "ar" ? "الأولوية" : "PRIORITY"}
            </label>
            <div className="flex p-1 bg-slate-50/50 rounded-xl md:rounded-2xl border border-slate-100">
              {(["Low", "Medium", "High"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={cn(
                    "flex-1 py-2.5 md:py-3 rounded-lg md:rounded-xl text-xs md:text-sm font-bold transition-all",
                    priority === p 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-200" 
                      : "text-slate-500 hover:bg-white"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8 bg-slate-50/50 flex items-center justify-end gap-3 md:gap-4 border-t border-slate-50 shrink-0">
          <Button variant="ghost" onClick={onClose} className="rounded-xl text-xs md:text-sm font-bold text-slate-500 hover:bg-slate-100 h-10 md:h-12 px-5">
            {locale === "ar" ? "إلغاء" : "Cancel"}
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 md:h-12 px-6 md:px-10 text-xs md:text-sm font-bold shadow-lg shadow-blue-100">
            {locale === "ar" ? "إرسال المهمة" : "Send Task"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TaskSummaryCard({ label, value, icon: Icon, iconBg, iconColor, className }: any) {
  return (
    <Card className={cn("border-none shadow-[0_8px_30px_rgb(0,0,0,0.03)] rounded-[24px] md:rounded-[32px] overflow-hidden bg-white", className)}>
      <CardContent className="p-6 md:p-8 flex items-center justify-between">
        <div className="space-y-2 md:space-y-4">
          <p className="text-slate-500 font-bold text-xs md:text-sm">{label}</p>
          <h3 className="text-3xl md:text-4xl font-black text-slate-900">{value}</h3>
        </div>
        <div className={cn("p-3 md:p-4 rounded-xl md:rounded-2xl", iconBg, iconColor)}>
          <Icon className="h-6 w-6 md:h-7 md:w-7" />
        </div>
      </CardContent>
    </Card>
  );
}

function TableFilter({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-2 md:gap-3 px-4 md:px-5 py-2.5 md:py-3 bg-white border border-slate-100 rounded-xl md:rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors whitespace-nowrap"
    >
      <span className="text-[11px] md:text-[13px] font-bold text-slate-500">{label}</span>
      <ChevronDown className="h-3 w-3 md:h-4 md:w-4 text-slate-400" />
    </div>
  );
}

function PriorityText({ priority }: { priority: "High" | "Medium" | "Low" }) {
  const configs = {
    High: "text-rose-500 bg-rose-50/50",
    Medium: "text-purple-500 bg-purple-50/50",
    Low: "text-slate-400 bg-slate-50/50",
  };
  return (
    <span className={cn("px-2.5 md:px-3 py-1 rounded-lg text-[9px] md:text-[11px] font-black uppercase tracking-wider", configs[priority])}>
      {priority}
    </span>
  );
}

function StatusBadge({ status }: { status: "Pending" | "In Progress" | "Done" }) {
  const configs = {
    Pending: "bg-orange-50 text-orange-400",
    "In Progress": "bg-blue-50 text-blue-600",
    Done: "bg-emerald-50 text-emerald-600",
  };
  return (
    <Badge className={cn("rounded-full px-3 md:px-4 py-1 md:py-1.5 border-none font-black text-[9px] md:text-[10px] uppercase tracking-widest", configs[status])}>
      {status}
    </Badge>
  );
}

function PaginationButton({ icon: Icon, disabled }: any) {
  return (
    <button
      disabled={disabled}
      className={cn(
        "h-9 w-9 md:h-10 md:w-10 flex items-center justify-center rounded-lg md:rounded-xl border border-slate-100 transition-all",
        disabled ? "bg-slate-50 text-slate-300 opacity-50 cursor-not-allowed" : "bg-white text-slate-500 hover:border-blue-600 hover:text-blue-600"
      )}
    >
      <Icon className="h-4 w-4 md:h-5 md:w-5" />
    </button>
  );
}

function PaginationNumber({ number, active }: { number: number; active?: boolean }) {
  return (
    <button
      className={cn(
        "h-9 w-9 md:h-10 md:w-10 flex items-center justify-center rounded-lg md:rounded-xl font-bold text-xs md:text-sm transition-all",
        active ? "bg-blue-600 text-white shadow-lg shadow-blue-100" : "text-slate-500 hover:bg-slate-100"
      )}
    >
      {number}
    </button>
  );
}
