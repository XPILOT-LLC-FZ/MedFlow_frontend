"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  CalendarDays,
  Plus,
  Search,
  ChevronDown,
  Clock,
  ClipboardList,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit3,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { bookingService } from "@/services/bookingService";
import { useTranslation } from "@/hooks/useTranslation";
import { TranslationKey } from "@/lib/i18n";
import { useToastStore } from "@/stores/useToastStore";
import { HandoffPdfModal } from "@/components/reception/HandoffPdfModal";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { patientService } from "@/services/patientService";
import { staffService } from "@/services/staffService";
import { tasksService } from "@/services/tasksService";
import type { ApiReceptionHandoff, ApiQuickTask, ApiPatient, ApiDoctor } from "@/types";
import { useAuthStore } from "@/stores/useAuthStore";

type StatusFilter = "ALL" | "NEW" | "REVIEWED";

export default function ReceptionTasksPage() {
  const { t, isRTL } = useTranslation();
  const toastSuccess = useToastStore((s) => s.success);
  const toastError = useToastStore((s) => s.error);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [tasks, setTasks] = useState<(ApiReceptionHandoff | ApiQuickTask)[]>([]);
  const [selectedHandoff, setSelectedHandoff] = useState<ApiReceptionHandoff | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ApiQuickTask | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const role = useAuthStore((s) => s.user?.role);

  // ── Data fetching ────────────────────────────────────────────
  const fetchTasks = useCallback(async () => {
    try {
      const [handoffResults, quickTaskResults] = await Promise.all([
        bookingService.getReceptionHandoffs({
          status: statusFilter === "ALL" ? undefined : (statusFilter === "REVIEWED" ? "REVIEWED" : "NEW"),
          limit: 50,
        }),
        tasksService.getAll({
          status: statusFilter === "ALL" ? undefined : (statusFilter === "REVIEWED" ? "COMPLETED" : "PENDING") as "PENDING" | "IN_PROGRESS" | "COMPLETED",
        })
      ]);

      const combined = [...handoffResults, ...quickTaskResults].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setTasks(combined);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void fetchTasks();
    const interval = setInterval(() => void fetchTasks(), 30000);
    return () => clearInterval(interval);
  }, [fetchTasks]);

  // ── Derived data ─────────────────────────────────────────────
  const filteredTasks = useMemo(
    () =>
      tasks.filter(
        (t) => {
          const name = 'patientName' in t ? t.patientName : (t.patient?.fullName || "");
          const dName = 'doctorName' in t ? t.doctorName : (t.doctor?.fullName || "");
          const title = 'diagnosis' in t ? (t.diagnosis || t.notesSnapshot || "") : (t as ApiQuickTask).title;
          
          return (
            name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            dName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            title.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }
      ),
    [tasks, searchQuery]
  );

  const newCount = useMemo(() => tasks.filter((t) => (t.status === "NEW" || t.status === "PENDING")).length, [tasks]);
  const reviewedCount = useMemo(() => tasks.filter((t) => (t.status === "REVIEWED" || t.status === "COMPLETED")).length, [tasks]);

  // ── Actions ──────────────────────────────────────────────────

  const handleEdit = (task: ApiReceptionHandoff | ApiQuickTask) => {
    if ('patientName' in task) {
      // Reception handoffs are not editable via quick task editor — open PDF instead
      openPdfPreview(task as ApiReceptionHandoff);
      return;
    }
    setEditingTask(task as ApiQuickTask);
    setIsCreateModalOpen(true);
  };

  const handleDelete = async (task: ApiReceptionHandoff | ApiQuickTask) => {
    if ('patientName' in task) {
      // Deleting reception handoffs is not supported from the UI
      toastError(isRTL ? "لا يمكن حذف هذه المهمة" : "Cannot delete this handoff");
      return;
    }

    if (!confirm(isRTL ? "هل أنت متأكد أنك تريد حذف المهمة؟" : "Are you sure you want to delete this task?")) return;

    try {
      await tasksService.delete(task.id);
      toastSuccess(t("statusUpdatedSuccessfully"));
      void fetchTasks();
    } catch (err) {
      console.error("Failed to delete task", err);
      toastError(t("error"));
    }
  };

  const openPdfPreview = (handoff: ApiReceptionHandoff) => {
    setSelectedHandoff(handoff);
    setIsPdfModalOpen(true);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(isRTL ? "ar-EG" : "en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getTaskTitle = (t: ApiReceptionHandoff | ApiQuickTask) => {
    if ('diagnosis' in t) {
      const h = t as ApiReceptionHandoff;
      if (h.diagnosis) return h.diagnosis;
      if (h.notesSnapshot) return h.notesSnapshot.slice(0, 40) + (h.notesSnapshot.length > 40 ? "…" : "");
      return isRTL ? "ملاحظات سريرية" : "Clinical Notes";
    }
    return (t as ApiQuickTask).title;
  };

  const getPriority = (t: ApiReceptionHandoff | ApiQuickTask): "High" | "Medium" | "Low" => {
    if ('priority' in t) {
      const p = (t as ApiQuickTask).priority;
      if (p === "HIGH" || p === "URGENT") return "High";
      if (p === "NORMAL") return "Medium";
      return "Low";
    }
    if (t.status === "NEW") {
      const seconds = Math.floor((Date.now() - new Date(t.createdAt).getTime()) / 1000);
      if (seconds > 3600) return "High";
      if (seconds > 1800) return "Medium";
    }
    return "Low";
  };

  const getStatus = (t: ApiReceptionHandoff | ApiQuickTask): "Pending" | "In Progress" | "Done" => {
    if (t.status === "REVIEWED" || t.status === "COMPLETED") return "Done";
    if ('status' in t && t.status === "IN_PROGRESS") return "In Progress";
    
    const seconds = Math.floor((Date.now() - new Date(t.createdAt).getTime()) / 1000);
    if (seconds > 1800) return "In Progress";
    return "Pending";
  };

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="p-4 md:p-8 space-y-8 md:space-y-10 max-w-[1600px] mx-auto bg-slate-50 min-h-screen pb-24 relative -m-4 md:-m-8">
      {/* 1. Header Section */}
      <div className={cn("flex flex-col md:flex-row md:items-end justify-between gap-6", isRTL ? "md:flex-row-reverse" : "md:flex-row")}>
        <div className={cn("space-y-1", isRTL ? "text-right" : "text-left")}>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            {t("tasks") || (isRTL ? "المهام" : "Tasks")}
          </h1>
          <p className="text-slate-500 text-xs md:text-sm font-medium">
            {isRTL
              ? "إدارة ومتابعة العمليات الطبية عبر الأقسام."
              : "Manage and track medical operations across departments."}
          </p>
        </div>

        <div className={cn("flex items-center gap-3 md:gap-4 overflow-x-auto no-scrollbar pb-2 md:pb-0", isRTL ? "flex-row-reverse" : "flex-row")}>
          <div className={cn("hidden lg:flex items-center gap-3 px-5 py-2.5 bg-white border border-slate-100 rounded-2xl shadow-sm cursor-pointer hover:bg-slate-50 transition-colors whitespace-nowrap", isRTL ? "flex-row-reverse" : "flex-row")}>
            <CalendarDays className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-semibold text-slate-700">
              {new Date().toLocaleDateString(isRTL ? "ar-EG" : "en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </div>
          
          <div className={cn("flex items-center gap-2 md:gap-3", isRTL ? "flex-row-reverse" : "flex-row")}>
            <Button
              variant="outline"
              onClick={() => {
                setIsLoading(true);
                void fetchTasks();
              }}
              className={cn("border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-xl md:rounded-2xl h-10 md:h-12 px-4 md:px-5 flex items-center gap-2 font-bold shadow-sm transition-all whitespace-nowrap", isRTL ? "flex-row-reverse" : "flex-row")}
            >
              <RefreshCw className={cn("h-4 w-4 md:h-5 md:w-5", isLoading && "animate-spin")} />
              <span className="text-xs md:text-sm">{t("refresh") || (isRTL ? "تحديث" : "Refresh")}</span>
            </Button>

            <Button
              onClick={() => { setEditingTask(null); setIsCreateModalOpen(true); }}
              className={cn("bg-blue-600 hover:bg-blue-700 text-white rounded-xl md:rounded-2xl h-10 md:h-12 px-4 md:px-6 flex items-center gap-2 font-bold shadow-lg shadow-blue-500/10 whitespace-nowrap", isRTL ? "flex-row-reverse" : "flex-row")}
            >
              <Plus className="h-4 w-4 md:h-5 md:w-5" />
              <span className="text-xs md:text-sm">{t("createTask") || (isRTL ? "إنشاء مهمة" : "Create Task")}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Summary Cards Grid */}
      <div className={cn("grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6", isRTL ? "direction-rtl" : "direction-ltr")}>
        <TaskSummaryCard
          label={t("overdueTasks") || (isRTL ? "مهام معلقة" : "Overdue tasks")}
          value={newCount.toLocaleString(isRTL ? "ar-EG" : "en-US")}
          icon={Clock}
          iconBg="bg-rose-50"
          iconColor="text-rose-500"
        />
        <TaskSummaryCard
          label={t("highPriority") || (isRTL ? "أولوية عالية" : "High priority")}
          value={tasks.filter((t) => getPriority(t) === "High").length.toLocaleString(isRTL ? "ar-EG" : "en-US")}
          icon={ClipboardList}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <TaskSummaryCard
          label={t("completedToday") || (isRTL ? "مكتملة اليوم" : "Completed today")}
          value={reviewedCount.toLocaleString(isRTL ? "ar-EG" : "en-US")}
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
          <div className={cn("flex flex-col xl:flex-row xl:items-center gap-4", isRTL ? "xl:flex-row-reverse" : "xl:flex-row")}>
            <div className="relative flex-1">
              <Search className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400", isRTL ? "right-4" : "left-4")} />
              <Input
                placeholder={isRTL ? "بحث في المهام أو المرضى..." : "Search tasks or patients..."}
                className={cn("h-11 md:h-12 rounded-xl md:rounded-2xl border-slate-100 bg-slate-50/30 focus:ring-blue-600/5 focus:border-blue-200", isRTL ? "pr-11 text-right" : "pl-11 text-left")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className={cn("flex items-center gap-2 md:gap-3 overflow-x-auto no-scrollbar pb-1", isRTL ? "flex-row-reverse" : "flex-row")}>
              <TableFilter
                label={
                  statusFilter === "ALL"
                    ? (isRTL ? "كل الحالات" : "All states")
                    : statusFilter === "NEW"
                      ? (isRTL ? "جديد" : "New")
                      : (isRTL ? "تمت المراجعة" : "Reviewed")
                }
                onClick={() =>
                  setStatusFilter((prev) =>
                    prev === "ALL" ? "NEW" : prev === "NEW" ? "REVIEWED" : "ALL"
                  )
                }
              />
              <TableFilter label={t("allDoctors")} />
              <TableFilter label={t("allPriority") || (isRTL ? "كل الأولويات" : "All Priority")} />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto no-scrollbar rounded-2xl md:rounded-3xl border border-slate-50">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className={cn("px-6 py-4 md:py-5 text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-widest", isRTL ? "text-right last:rounded-tl-2xl" : "text-left first:rounded-tl-2xl")}>
                    {t("taskTitle") || (isRTL ? "عنوان المهمة" : "Task Title")}
                  </th>
                  <th className={cn("px-6 py-4 md:py-5 text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-widest", isRTL ? "text-right" : "text-left")}>
                    {t("dueDate") || (isRTL ? "تاريخ الاستحقاق" : "Due Date")}
                  </th>
                  <th className={cn("px-6 py-4 md:py-5 text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-widest", isRTL ? "text-right" : "text-left")}>
                    {t("patientName")}
                  </th>
                  <th className={cn("px-6 py-4 md:py-5 text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-widest", isRTL ? "text-right" : "text-left")}>
                    {t("assignedDoctor") || (isRTL ? "الطبيب المعين" : "Assigned Doctor")}
                  </th>
                  <th className={cn("px-6 py-4 md:py-5 text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-widest", isRTL ? "text-right" : "text-left")}>
                    {isRTL ? "الأولوية" : "Priority"}
                  </th>
                  <th className={cn("px-6 py-4 md:py-5 text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-widest", isRTL ? "text-right" : "text-left")}>
                    {isRTL ? "الحالة" : "Status"}
                  </th>
                  <th className={cn("px-6 py-4 md:py-5 text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right", isRTL ? "text-left first:rounded-tr-2xl" : "text-right last:rounded-tr-2xl")}>
                    {isRTL ? "الإجراءات" : "Actions"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading && tasks.length === 0 ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={7} className="px-6 py-8">
                        <div className="h-6 bg-slate-100 rounded-xl animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-12 w-12 md:h-14 md:w-14 bg-slate-100 rounded-full flex items-center justify-center">
                          <ClipboardList className="h-6 w-6 md:h-7 md:w-7 text-slate-300" />
                        </div>
                        <p className="text-base md:text-lg font-bold text-slate-900">
                          {isRTL ? "لا توجد مهام" : "No tasks found"}
                        </p>
                        <p className="text-xs md:text-sm text-slate-400 max-w-xs">
                          {isRTL
                            ? "سيظهر هنا أي تقارير أو ملاحظات يتم إرسالها من الأطباء."
                            : "Reports and notes sent by doctors will appear here for processing."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((task) => {
                    const patientName = 'patientName' in task ? task.patientName : (task.patient?.fullName || (isRTL ? "عام" : "General"));
                    const doctorName = 'doctorName' in task ? task.doctorName : (task.doctor?.fullName || (isRTL ? "غير محدد" : "Unassigned"));
                    const isNew = task.status === "NEW" || task.status === "PENDING";
                    
                    return (
                      <tr key={task.id} className="hover:bg-slate-50/30 transition-colors group">
                        <td className="px-6 py-5 md:py-6">
                          <div className={cn("flex items-center gap-3", isRTL ? "flex-row-reverse" : "flex-row")}>
                            <div className={cn("h-2 w-2 rounded-full shrink-0", isNew ? "bg-blue-600 animate-pulse" : "bg-slate-300")} />
                            <span className={cn("text-sm font-bold text-slate-900 truncate max-w-[200px]", isRTL ? "text-right" : "text-left")}>
                              {getTaskTitle(task)}
                            </span>
                          </div>
                        </td>
                        <td className={cn("px-6 py-5 md:py-6 text-sm font-medium text-slate-500 whitespace-nowrap", isRTL ? "text-right" : "text-left")}>
                          {formatDate(task.createdAt)}
                        </td>
                        <td className="px-6 py-5 md:py-6">
                          <div className={cn("flex items-center gap-3", isRTL ? "flex-row-reverse" : "flex-row")}>
                            <Avatar className="h-8 w-8 border-2 border-white shadow-sm shrink-0">
                              <AvatarImage src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${patientName}`} />
                              <AvatarFallback>P</AvatarFallback>
                            </Avatar>
                            <span className={cn("text-sm font-bold text-slate-700 truncate", isRTL ? "text-right" : "text-left")}>{patientName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 md:py-6">
                          <div className={cn("flex items-center gap-3", isRTL ? "flex-row-reverse" : "flex-row")}>
                            <Avatar className="h-8 w-8 border-2 border-white shadow-sm shrink-0">
                              <AvatarImage src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${doctorName}`} />
                              <AvatarFallback>D</AvatarFallback>
                            </Avatar>
                            <span className={cn("text-sm font-bold text-slate-700 truncate", isRTL ? "text-right" : "text-left")}>
                              {isRTL ? "د." : "Dr."} {doctorName}
                            </span>
                          </div>
                        </td>
                        <td className={cn("px-6 py-5 md:py-6", isRTL ? "text-right" : "text-left")}>
                          <PriorityText priority={getPriority(task)} />
                        </td>
                        <td className={cn("px-6 py-5 md:py-6", isRTL ? "text-right" : "text-left")}>
                          <StatusBadge status={getStatus(task)} />
                        </td>
                        <td className={cn("px-6 py-5 md:py-6", isRTL ? "text-left" : "text-right")}>
                          <div className={cn("flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity", isRTL ? "justify-start flex-row-reverse" : "justify-end flex-row")}>
                            {/* removed check/true icon per request */}
                            {'patientName' in task ? (
                              <>
                                <button
                                  onClick={() => openPdfPreview(task as ApiReceptionHandoff)}
                                  className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                                  title={isRTL ? "عرض وتحميل" : "View & PDF"}
                                >
                                  <Download className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(task)}
                                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all duration-200"
                                  title={isRTL ? "حذف" : "Delete"}
                                >
                                  <Trash2 className="h-5 w-5" />
                                </button>
                              </>
                              ) : (
                              role === "STAFF" ? (
                                <>
                                  <button
                                    onClick={() => handleEdit(task)}
                                    className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                                    title={isRTL ? "تعديل" : "Edit"}
                                  >
                                    <Edit3 className="h-5 w-5" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(task)}
                                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all duration-200"
                                    title={isRTL ? "حذف" : "Delete"}
                                  >
                                    <Trash2 className="h-5 w-5" />
                                  </button>
                                </>
                              ) : null
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {filteredTasks.length > 0 && (
            <div className={cn("flex flex-col sm:flex-row items-center justify-between gap-4 pt-4", isRTL ? "sm:flex-row-reverse" : "sm:flex-row")}>
              <p className="text-xs md:text-sm font-medium text-slate-400">
                {isRTL ? "عرض" : "Showing"}{" "}
                <span className="text-slate-900">{ (1).toLocaleString(isRTL ? "ar-EG" : "en-US") }</span>{" "}
                {isRTL ? "إلى" : "to"}{" "}
                <span className="text-slate-900">{Math.min(filteredTasks.length, 10).toLocaleString(isRTL ? "ar-EG" : "en-US")}</span>{" "}
                {isRTL ? "من" : "of"}{" "}
                <span className="text-slate-900">{filteredTasks.length.toLocaleString(isRTL ? "ar-EG" : "en-US")}</span>{" "}
                {isRTL ? "نتيجة" : "results"}
              </p>
              <div className={cn("flex items-center gap-2", isRTL ? "flex-row-reverse" : "flex-row")}>
                <PaginationButton icon={isRTL ? ChevronRight : ChevronLeft} disabled />
                <PaginationNumber number={1} active />
                {filteredTasks.length > 10 && <PaginationNumber number={2} />}
                <PaginationButton icon={isRTL ? ChevronLeft : ChevronRight} disabled={filteredTasks.length <= 10} />
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
        onClose={() => { setIsCreateModalOpen(false); setEditingTask(null); }} 
        isRTL={isRTL}
        t={t}
        initialTask={editingTask}
        onSaved={() => { setEditingTask(null); void fetchTasks(); }}
      />
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────────── */

function CreateTaskModal({ isOpen, onClose, isRTL, t, initialTask, onSaved }: { isOpen: boolean; onClose: () => void; isRTL: boolean; t: (key: TranslationKey) => string; initialTask?: ApiQuickTask | null; onSaved?: () => void }) {
  const toastSuccess = useToastStore((s) => s.success);
  const toastError = useToastStore((s) => s.error);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<"Low" | "Medium" | "High">("Low");
  
  const [patients, setPatients] = useState<ApiPatient[]>([]);
  const [doctors, setDoctors] = useState<ApiDoctor[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setIsLoadingData] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const loadData = async () => {
      setIsLoadingData(true);
      try {
        const [pData, dData] = await Promise.all([
          patientService.getAll(),
          staffService.getDoctors({ status: "ACTIVE" })
        ]);
        setPatients(pData);
        setDoctors(dData);
      } catch (err) {
        console.error("Failed to load task creation data", err);
      } finally {
        setIsLoadingData(false);
      }
    };
    void loadData();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (initialTask) {
      setTitle(initialTask.title || "");
      setDescription(initialTask.description || "");
      setSelectedPatientId(initialTask.patientId || "");
      setSelectedDoctorId(initialTask.doctorId || "");
      setDueDate(initialTask.dueDate ? initialTask.dueDate.split("T")[0] : "");
      const p = initialTask.priority === "HIGH" ? "High" : initialTask.priority === "NORMAL" ? "Medium" : "Low";
      setPriority(p as "Low" | "Medium" | "High");
    } else {
      // reset when creating
      setTitle("");
      setDescription("");
      setSelectedPatientId("");
      setSelectedDoctorId("");
      setDueDate("");
      setPriority("Low");
    }
  }, [isOpen, initialTask]);

  const handleSubmit = async () => {
    if (!title || !selectedPatientId || !selectedDoctorId) {
      toastError(isRTL ? "يرجى ملء الحقول المطلوبة واختيار طبيب" : "Please fill required fields and select a doctor");
      return;
    }

    setIsSubmitting(true);
    try {
      if (initialTask) {
        await tasksService.update(initialTask.id, {
          title,
          description,
          patientId: selectedPatientId,
          doctorId: selectedDoctorId,
          dueDate: dueDate || undefined,
          priority: (priority === "Medium" ? "NORMAL" : priority.toUpperCase()) as "LOW" | "NORMAL" | "HIGH" | "URGENT",
        });
      } else {
        await tasksService.create({
          title,
          description,
          patientId: selectedPatientId,
          doctorId: selectedDoctorId,
          dueDate: dueDate || undefined,
          priority: (priority === "Medium" ? "NORMAL" : priority.toUpperCase()) as "LOW" | "NORMAL" | "HIGH" | "URGENT",
        });
      }
      toastSuccess(t("statusUpdatedSuccessfully"));
      onClose();
      // Reset form
      setTitle("");
      setDescription("");
      setSelectedPatientId("");
      setSelectedDoctorId("");
      setDueDate("");
      setPriority("Low");
      if (onSaved) onSaved();
    } catch {
      toastError(t("error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent dir={isRTL ? "rtl" : "ltr"} className="max-w-2xl p-0 overflow-hidden rounded-[24px] md:rounded-[32px] border-none shadow-2xl bg-white max-h-[95vh] flex flex-col">
        <DialogHeader className={cn("px-6 md:px-8 py-4 md:py-6 border-b border-slate-50 flex flex-row items-center justify-between shrink-0", isRTL ? "flex-row-reverse" : "flex-row")}>
          <DialogTitle className={cn("text-lg md:text-xl font-bold text-slate-900", isRTL ? "text-right" : "text-left")}>
            {t("createTask") || (isRTL ? "إنشاء مهمة جديدة" : "Create New Task")}
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 md:p-8 space-y-5 md:space-y-6 overflow-y-auto no-scrollbar flex-1">
          {/* Task Title */}
          <div className="space-y-1.5">
            <label className={cn("block text-xs md:text-sm font-bold text-slate-700", isRTL ? "text-right" : "text-left")}>
              {t("taskTitle") || (isRTL ? "عنوان المهمة" : "Task title")} *
            </label>
            <Input 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Schedule MRI Review" 
              className={cn("h-12 md:h-14 rounded-xl md:rounded-2xl border-slate-100 bg-slate-50/30 focus:ring-blue-600/5 focus:border-blue-200 font-medium text-sm md:text-base", isRTL ? "text-right" : "text-left")}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className={cn("block text-xs md:text-sm font-bold text-slate-700", isRTL ? "text-right" : "text-left")}>
              {t("description")}
            </label>
            <Textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide additional context for the clinical staff..."
              className={cn("min-h-[100px] md:min-h-[120px] rounded-xl md:rounded-2xl border-slate-100 bg-slate-50/30 focus:ring-blue-600/5 focus:border-blue-200 font-medium resize-none text-sm md:text-base", isRTL ? "text-right" : "text-left")}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Select Patient */}
            <div className="space-y-1.5">
              <label className={cn("block text-xs md:text-sm font-bold text-slate-700", isRTL ? "text-right" : "text-left")}>
                {t("selectPatient")} *
              </label>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className={cn("w-full h-12 md:h-14 px-4 rounded-xl md:rounded-2xl border-slate-100 bg-slate-50/30 text-sm md:text-base outline-none focus:ring-2 focus:ring-blue-500/20", isRTL ? "text-right" : "text-left")}
              >
                <option value="">{isRTL ? "اختر مريضاً..." : "Select a patient..."}</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.fullName}</option>
                ))}
              </select>
            </div>

            {/* Due Date */}
            <div className="space-y-1.5">
              <label className={cn("block text-xs md:text-sm font-bold text-slate-700", isRTL ? "text-right" : "text-left")}>
                {t("dueDate") || (isRTL ? "تاريخ الاستحقاق" : "Due date")}
              </label>
              <Input 
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={cn("h-12 md:h-14 rounded-xl md:rounded-2xl border-slate-100 bg-slate-50/30 text-sm md:text-base", isRTL ? "text-right" : "text-left")}
              />
            </div>
          </div>

          {/* Assign to Doctor */}
          <div className="space-y-1.5">
            <label className={cn("block text-xs md:text-sm font-bold text-slate-700", isRTL ? "text-right" : "text-left")}>
              {t("assignedDoctor") || (isRTL ? "تعيين للطبيب" : "Assign to doctor")} *
            </label>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className={cn("w-full h-12 md:h-14 px-4 rounded-xl md:rounded-2xl border-slate-100 bg-slate-50/30 text-sm md:text-base outline-none focus:ring-2 focus:ring-blue-500/20", isRTL ? "text-right" : "text-left")}
            >
              <option value="">{isRTL ? "اختر طبيباً..." : "Select a doctor..."}</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id}>{d.fullName}</option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div className="space-y-2 pb-2">
            <label className={cn("block text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-widest", isRTL ? "text-right" : "text-left")}>
              {isRTL ? "الأولوية" : "PRIORITY"}
            </label>
            <div className={cn("flex p-1 bg-slate-50/50 rounded-xl md:rounded-2xl border border-slate-100", isRTL ? "flex-row-reverse" : "flex-row")}>
              {(["Low", "Medium", "High"] as const).map((p) => {
                const labels = {
                  Low: isRTL ? "منخفضة" : "Low",
                  Medium: isRTL ? "متوسطة" : "Medium",
                  High: isRTL ? "عالية" : "High"
                };
                return (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={cn(
                      "flex-1 py-2.5 md:py-3 rounded-lg md:rounded-xl text-xs md:text-sm font-bold transition-all",
                      priority === p 
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/10" 
                        : "text-slate-500 hover:bg-white"
                    )}
                  >
                    {labels[p]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className={cn("p-6 md:p-8 bg-slate-50/50 flex items-center gap-3 md:gap-4 border-t border-slate-50 shrink-0", isRTL ? "flex-row-reverse justify-start" : "justify-end flex-row")}>
          <Button variant="ghost" onClick={onClose} className="rounded-xl text-xs md:text-sm font-bold text-slate-500 hover:bg-slate-100 h-10 md:h-12 px-5">
            {isRTL ? "إلغاء" : "Cancel"}
          </Button>
          <Button 
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 md:h-12 px-6 md:px-10 text-xs md:text-sm font-bold shadow-lg shadow-blue-500/10"
          >
            {isSubmitting ? (isRTL ? "جاري الإرسال..." : "Sending...") : (isRTL ? "إرسال المهمة" : "Send Task")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface TaskSummaryCardProps {
  label: string;
  value: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  className?: string;
}

function TaskSummaryCard({ label, value, icon: Icon, iconBg, iconColor, className }: TaskSummaryCardProps) {
  const { isRTL } = useTranslation();
  return (
    <Card className={cn("border-none shadow-[0_8px_30px_rgb(0,0,0,0.03)] rounded-[24px] md:rounded-[32px] overflow-hidden bg-white", className)}>
      <CardContent className={cn("p-6 md:p-8 flex items-center justify-between", isRTL ? "flex-row-reverse" : "flex-row")}>
        <div className={cn("space-y-2 md:space-y-4", isRTL ? "text-right" : "text-left")}>
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
  const { isRTL } = useTranslation();
  return (
    <div
      onClick={onClick}
      className={cn("flex items-center gap-2 md:gap-3 px-4 md:px-5 py-2.5 md:py-3 bg-white border border-slate-100 rounded-xl md:rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors whitespace-nowrap", isRTL ? "flex-row-reverse" : "flex-row")}
    >
      <span className="text-[11px] md:text-[13px] font-bold text-slate-500">{label}</span>
      <ChevronDown className="h-3 w-3 md:h-4 md:w-4 text-slate-400" />
    </div>
  );
}

function PriorityText({ priority }: { priority: "High" | "Medium" | "Low" }) {
  const { isRTL } = useTranslation();
  const configs = {
    High: "text-rose-500 bg-rose-50/50",
    Medium: "text-purple-500 bg-purple-50/50",
    Low: "text-slate-400 bg-slate-50/50",
  };
  
  const labels = {
    High: isRTL ? "عالية" : "High",
    Medium: isRTL ? "متوسطة" : "Medium",
    Low: isRTL ? "منخفضة" : "Low"
  };

  return (
    <span className={cn("px-2.5 md:px-3 py-1 rounded-lg text-[9px] md:text-[11px] font-black uppercase tracking-wider", configs[priority])}>
      {labels[priority]}
    </span>
  );
}

function StatusBadge({ status }: { status: "Pending" | "In Progress" | "Done" }) {
  const { isRTL } = useTranslation();
  const configs = {
    Pending: "bg-orange-50 text-orange-400",
    "In Progress": "bg-blue-50 text-blue-600",
    Done: "bg-emerald-50 text-emerald-600",
  };

  const labels = {
    Pending: isRTL ? "قيد الانتظار" : "Pending",
    "In Progress": isRTL ? "قيد التنفيذ" : "In Progress",
    Done: isRTL ? "مكتمل" : "Done"
  };

  return (
    <Badge className={cn("rounded-full px-3 md:px-4 py-1 md:py-1.5 border-none font-black text-[9px] md:text-[10px] uppercase tracking-widest", configs[status])}>
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
        "h-9 w-9 md:h-10 md:w-10 flex items-center justify-center rounded-lg md:rounded-xl border border-slate-100 transition-all",
        disabled ? "bg-slate-50 text-slate-300 opacity-50 cursor-not-allowed" : "bg-white text-slate-500 hover:border-blue-600 hover:text-blue-600"
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
        "h-9 w-9 md:h-10 md:w-10 flex items-center justify-center rounded-lg md:rounded-xl font-bold text-xs md:text-sm transition-all",
        active ? "bg-blue-600 text-white shadow-lg shadow-blue-500/10" : "text-slate-500 hover:bg-slate-100"
      )}
    >
      {number.toLocaleString(isRTL ? "ar-EG" : "en-US")}
    </button>
  );
}
