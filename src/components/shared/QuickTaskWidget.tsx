"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  CheckSquare, 
  Plus, 
  Clock, 
  Trash2, 
  CheckCircle2, 
  User,
  Loader2,
  ClipboardCheck
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { tasksService } from "@/services/tasksService";
import { staffService } from "@/services/staffService";
import { useTranslation } from "@/hooks/useTranslation";
import { ApiQuickTask, TaskStatus, TaskPriority, ApiDoctor } from "@/types";

interface QuickTaskWidgetProps {
  doctorId?: string;
  isReception?: boolean;
}

export function QuickTaskWidget({ doctorId, isReception = false }: QuickTaskWidgetProps) {
  const { locale } = useTranslation();
  const [tasks, setTasks] = useState<ApiQuickTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [doctors, setDoctors] = useState<ApiDoctor[]>([]);
  
  // Create task form state
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPriority, setNewPriority] = useState<TaskPriority>("NORMAL");
  const [newDoctorId, setNewNewDoctorId] = useState(doctorId || "");

  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await tasksService.getAll({ 
        doctorId: isReception ? undefined : doctorId 
      });
      setTasks(data);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    } finally {
      setIsLoading(false);
    }
  }, [doctorId, isReception]);

  const fetchDoctors = useCallback(async () => {
    if (!isReception) return;
    try {
      const data = await staffService.getDoctors();
      setDoctors(data);
    } catch (error) {
      console.error("Failed to fetch doctors:", error);
    }
  }, [isReception]);

  useEffect(() => {
    void fetchTasks();
    void fetchDoctors();
  }, [fetchTasks, fetchDoctors]);

  const handleToggleStatus = async (task: ApiQuickTask) => {
    const newStatus: TaskStatus = task.status === "COMPLETED" ? "PENDING" : "COMPLETED";
    try {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
      await tasksService.update(task.id, { status: newStatus });
    } catch (error) {
      console.error("Failed to update task status:", error);
      // Revert on error
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: task.status } : t));
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      setTasks(prev => prev.filter(t => t.id !== id));
      await tasksService.delete(id);
    } catch (error) {
      console.error("Failed to delete task:", error);
      void fetchTasks(); // Refresh list on error
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDoctorId) return;

    setIsSubmitting(true);
    try {
      const task = await tasksService.create({
        title: newTitle,
        description: newDescription,
        priority: newPriority,
        doctorId: newDoctorId,
      });
      setTasks(prev => [task, ...prev]);
      setIsCreateModalOpen(false);
      // Reset form
      setNewTitle("");
      setNewDescription("");
      setNewPriority("NORMAL");
      if (!doctorId) setNewNewDoctorId("");
    } catch (error) {
      console.error("Failed to create task:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingTasks = tasks.filter(t => t.status !== "COMPLETED");
  const completedTasks = tasks.filter(t => t.status === "COMPLETED");

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case "URGENT": return "text-rose-500 bg-rose-50 dark:bg-rose-900/20";
      case "HIGH": return "text-amber-500 bg-amber-50 dark:bg-amber-900/20";
      case "NORMAL": return "text-blue-500 bg-blue-50 dark:bg-blue-900/20";
      case "LOW": return "text-slate-400 bg-slate-50 dark:bg-slate-800/40";
      default: return "text-slate-400 bg-slate-50";
    }
  };

  return (
    <Card className="rounded-2xl border-slate-100 dark:border-slate-800/60 shadow-sm transition-all hover:shadow-md dark:bg-slate-900/40 overflow-hidden h-full flex flex-col">
      <CardHeader className="px-5 pb-3 pt-5 border-b border-slate-50 dark:border-slate-800/50 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600">
            <CheckSquare className="h-4.5 w-4.5" />
          </div>
          <div className="flex flex-col">
            <CardTitle className="text-[15px] font-bold text-slate-800 dark:text-slate-100">
              {locale === "ar" ? "المهام السريعة" : "Quick Tasks"}
            </CardTitle>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {pendingTasks.length} {locale === "ar" ? "مهام معلقة" : "tasks pending"}
            </p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsCreateModalOpen(true)}
          className="h-8 w-8 p-0 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-0 custom-scrollbar">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
            <p className="text-xs text-slate-400 font-medium">{locale === "ar" ? "جار التحميل..." : "Loading tasks..."}</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <div className="h-10 w-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
              <ClipboardCheck className="h-5 w-5 text-slate-300" />
            </div>
            <p className="text-xs text-slate-400 font-medium">{locale === "ar" ? "لا توجد مهام" : "No tasks found"}</p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Pending Tasks */}
            <div className="space-y-2.5">
              {pendingTasks.map((task) => (
                <div
                  key={task.id}
                  className={cn(
                    "group rounded-xl border p-3.5 transition-all shadow-none relative",
                    task.priority === "URGENT"
                      ? "border-rose-100 bg-rose-50/40 dark:border-rose-900/30 dark:bg-rose-900/10"
                      : "border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900/30 hover:bg-slate-50 dark:hover:bg-slate-900/50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleToggleStatus(task)}
                      className="mt-0.5 h-5 w-5 shrink-0 rounded border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 hover:border-blue-500 transition-colors flex items-center justify-center"
                    >
                      <div className="h-2 w-2 rounded-sm bg-blue-600 opacity-0 group-hover:opacity-10 transition-opacity" />
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <p className="text-[12px] font-bold text-slate-700 dark:text-slate-200 leading-snug truncate">
                            {task.title}
                          </p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-7 w-7 p-0 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleDeleteTask(task.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <span className={cn(
                          "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-tight",
                          getPriorityColor(task.priority)
                        )}>
                          {task.priority}
                        </span>
                        
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                          <Clock className="h-3 w-3" />
                          <span>{formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}</span>
                        </div>

                        {isReception && task.doctor && (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-blue-500">
                            <User className="h-3 w-3" />
                            <span className="truncate max-w-[80px]">Dr. {task.doctor.fullName.split(' ')[0]}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <div className="pt-2">
                <p className="mb-3 px-1 text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center justify-between">
                  <span>{locale === "ar" ? "مكتملة" : "Completed"}</span>
                  <span className="h-px flex-1 mx-3 bg-slate-100 dark:bg-slate-800" />
                  <span>{completedTasks.length}</span>
                </p>
                <div className="space-y-2">
                  {completedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="group rounded-xl border border-transparent bg-slate-50/40 dark:bg-slate-900/10 p-3 transition-all hover:bg-slate-50 dark:hover:bg-slate-900/30"
                    >
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => handleToggleStatus(task)}
                          className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </button>
                        <p className="text-[12px] font-medium text-slate-400 line-through decoration-slate-300 truncate flex-1">
                          {task.title}
                        </p>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteTask(task.id)}
                          className="h-7 w-7 p-0 text-slate-300 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Create Task Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl p-0 overflow-hidden border-none dark:bg-slate-900">
          <form onSubmit={handleCreateTask}>
            <DialogHeader className="px-6 py-5 border-b border-slate-50 dark:border-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600">
                  <Plus className="h-5 w-5" />
                </div>
                <DialogTitle className="text-[18px] font-bold text-slate-800 dark:text-slate-100">
                  {locale === "ar" ? "إضافة مهمة جديدة" : "Add New Task"}
                </DialogTitle>
              </div>
            </DialogHeader>

            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <label htmlFor="title" className="text-[13px] font-bold text-slate-700 dark:text-slate-300">
                  {locale === "ar" ? "عنوان المهمة" : "Task Title"}
                </label>
                <Input
                  id="title"
                  placeholder={locale === "ar" ? "مثلاً: الاتصال بالمريض أحمد" : "e.g. Call patient Sarah"}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="rounded-xl border-slate-200 focus:ring-blue-500/20 h-11 text-sm font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-700 dark:text-slate-300">
                    {locale === "ar" ? "الأولوية" : "Priority"}
                  </label>
                  <Select 
                    value={newPriority} 
                    onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                    options={[
                      { value: "LOW", label: "Low" },
                      { value: "NORMAL", label: "Normal" },
                      { value: "HIGH", label: "High" },
                      { value: "URGENT", label: "Urgent" },
                    ]}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-700 dark:text-slate-300">
                    {locale === "ar" ? "الطبيب" : "Assign To"}
                  </label>
                  {isReception ? (
                    <Select 
                      value={newDoctorId} 
                      onChange={(e) => setNewNewDoctorId(e.target.value)}
                      placeholder="Select Doctor"
                      required
                      options={doctors.map(dr => ({
                        value: dr.id,
                        label: `Dr. ${dr.fullName.split(' ')[0]}`
                      }))}
                    />
                  ) : (
                    <div className="h-11 flex items-center px-4 rounded-xl border border-slate-100 bg-slate-50 text-[13px] font-bold text-slate-500">
                      You
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="desc" className="text-[13px] font-bold text-slate-700 dark:text-slate-300">
                  {locale === "ar" ? "الوصف (اختياري)" : "Description (Optional)"}
                </label>
                <Textarea
                  id="desc"
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="rounded-xl"
                  placeholder="Details about the task..."
                />
              </div>
            </div>

            <DialogFooter className="p-6 bg-slate-50/50 dark:bg-slate-950/20 border-t border-slate-50 dark:border-slate-800/50">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-xl text-[13px] font-bold"
              >
                {locale === "ar" ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !newTitle.trim()}
                className="rounded-xl bg-blue-600 text-[13px] font-bold text-white hover:bg-blue-700 active:scale-[0.98] transition-all min-w-[100px]"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (locale === "ar" ? "حفظ" : "Save Task")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
