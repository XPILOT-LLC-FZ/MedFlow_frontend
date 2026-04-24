"use client";

import React from "react";
import { Bell, Filter, CheckCircle2, Trash2, ShieldCheck, Stethoscope, User, ConciergeBell, AlertTriangle, Activity, ClipboardCheck, MessageSquare, Calendar, Forward, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { notificationsService } from "@/services/notificationsService";
import type { InAppNotification } from "@/types";

interface NotificationsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  notifications: InAppNotification[];
  onRefresh: () => void;
  locale: string;
}

export function NotificationsDialog({
  isOpen,
  onOpenChange,
  notifications,
  onRefresh,
  locale
}: NotificationsDialogProps) {
  const [filter, setFilter] = React.useState<"all" | "unread" | "doctor" | "patients" | "reception">("all");
  const unreadCount = notifications.filter(n => !n.readAt).length;

  const filteredNotifications = React.useMemo(() => {
    switch (filter) {
      case "unread":
        return notifications.filter(n => !n.readAt);
      case "doctor":
        // Focus on "what is wrong" - Alerts, Critical issues, Lab results, and Tasks
        return notifications.filter(n => 
          n.type === "CRITICAL" || 
          n.type === "ALERT" || 
          n.type === "LAB_RESULT" || 
          n.type === "TASK_EVENT" ||
          n.type === "RECEPTION_INBOX_ASSIGNED"
        );
      case "patients":
        return notifications.filter(n => 
          n.audience === "PATIENT" || 
          n.payload?.action === "created" || 
          n.type === "SURVEY_FEEDBACK" ||
          n.title?.toLowerCase().includes("booked")
        );
      case "reception":
        return notifications.filter(n => 
          n.audience === "RECEPTION" || 
          n.payload?.action === "status-changed" ||
          n.type === "RECEPTION_HANDOFF" ||
          n.type === "WHATSAPP_INBOUND" ||
          n.title?.toLowerCase().includes("status updated")
        );
      default:
        return notifications;
    }
  }, [notifications, filter]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl border-none">
        <DialogHeader className="px-6 pt-6 pb-4 bg-white dark:bg-slate-900 border-b border-slate-50 dark:border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-50">
                {locale === "ar" ? "مركز الإشعارات" : "Notification Center"}
              </DialogTitle>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {locale === "ar" 
                  ? `${notifications.length} إجمالي • ${unreadCount} غير مقروءة` 
                  : `${notifications.length} total • ${unreadCount} unread`}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Filter Bar */}
        <div className="px-5 py-2.5 border-b border-slate-50 dark:border-slate-800/50 bg-white dark:bg-slate-900 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <Filter className="h-3.5 w-3.5 text-slate-400 mr-1.5 shrink-0" />
            {[
              { id: "all", label: locale === "ar" ? "الكل" : "All" },
              { id: "unread", label: locale === "ar" ? `غير مقروء (${unreadCount})` : `Unread (${unreadCount})` },
              { id: "doctor", label: locale === "ar" ? "الطبيب" : "Doctor" },
              { id: "patients", label: locale === "ar" ? "المرضى" : "Patients" },
              { id: "reception", label: locale === "ar" ? "الاستقبال" : "Reception" }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as typeof filter)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap",
                  filter === f.id 
                    ? "bg-blue-600 text-white" 
                    : "text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4 shrink-0 ml-4">
            <button 
              onClick={() => {
                Promise.all(notifications.filter(n => !n.readAt).map(n => notificationsService.markInAppRead(n.id)))
                  .then(onRefresh);
              }}
              className="text-[11px] font-bold text-blue-600 hover:text-blue-700"
            >
              {locale === "ar" ? "تحديد الكل" : "Mark All"}
            </button>
          </div>
        </div>
        
        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3 bg-slate-50/30 dark:bg-slate-950/20">
          {filteredNotifications.length === 0 ? (
            <div className="py-16 text-center">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900 mb-3">
                <Bell className="h-7 w-7 text-slate-300" />
              </div>
              <p className="text-xs font-medium text-slate-400">
                {locale === "ar" ? "لا توجد إشعارات حالياً" : "No notifications found"}
              </p>
            </div>
          ) : (
            filteredNotifications.map((n) => {
              const isAdmin = n.audience === "ADMIN";
              const isDoctor = n.audience === "DOCTOR";
              const isPatient = n.audience === "PATIENT";
              const isReception = n.audience === "RECEPTION";

              return (
                <div 
                  key={n.id}
                  className={cn(
                    "rounded-xl border p-4 transition-all hover:shadow-md bg-white dark:bg-slate-900",
                    isAdmin ? "border-purple-100 dark:border-purple-900/30" :
                    isDoctor ? "border-blue-100 dark:border-blue-900/30" :
                    isPatient ? "border-emerald-100 dark:border-emerald-900/30" :
                    isReception ? "border-amber-100 dark:border-amber-900/30" :
                    "border-slate-100 dark:border-slate-800/50",
                    !n.readAt && (
                      isAdmin ? "ring-2 ring-purple-200/50" :
                      isDoctor ? "ring-2 ring-blue-200/50" :
                      isPatient ? "ring-2 ring-emerald-200/50" :
                      isReception ? "ring-2 ring-amber-200/50" :
                      "ring-2 ring-slate-100/50"
                    )
                  )}
                >
                  <div className="flex gap-3.5">
                    <div className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform",
                       isAdmin ? "bg-purple-100 text-purple-600" :
                       isDoctor ? "bg-blue-100 text-blue-600" :
                       isPatient ? "bg-emerald-100 text-emerald-600" :
                       n.type === "CRITICAL" ? "bg-rose-100 text-rose-500" :
                       n.type === "ALERT" ? "bg-amber-100 text-amber-500" :
                       n.type === "LAB_RESULT" ? "bg-indigo-100 text-indigo-500" :
                       "bg-slate-100 text-slate-500"
                    )}>
                      {n.type === "CRITICAL" ? <AlertTriangle className="h-5 w-5" /> : 
                       n.type === "ALERT" ? <AlertCircle className="h-5 w-5" /> : 
                       n.type === "LAB_RESULT" ? <Activity className="h-5 w-5" /> : 
                       n.type === "TASK_EVENT" ? <ClipboardCheck className="h-5 w-5" /> : 
                       n.type === "CHAT_MESSAGE" || n.type === "WHATSAPP_INBOUND" ? <MessageSquare className="h-5 w-5" /> : 
                       n.type === "APPOINTMENT_EVENT" ? <Calendar className="h-5 w-5" /> : 
                       n.type === "RECEPTION_HANDOFF" ? <Forward className="h-5 w-5" /> : 
                       isAdmin ? <ShieldCheck className="h-5 w-5" /> : 
                       isDoctor ? <Stethoscope className="h-5 w-5" /> : 
                       isPatient ? <User className="h-5 w-5" /> : 
                       isReception ? <ConciergeBell className="h-5 w-5" /> : 
                       <Bell className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col gap-0.5">
                          <h4 className={cn(
                            "flex items-center gap-2 text-[14px] text-slate-800 dark:text-slate-100",
                            !n.readAt ? "font-bold" : "font-medium"
                          )}>
                            {n.title}
                            {!n.readAt && <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />}
                          </h4>
                        </div>
                        <span 
                          title={new Date(n.createdAt).toLocaleString()}
                          className="text-[10px] font-bold text-slate-400 dark:text-slate-500 whitespace-nowrap uppercase tracking-tight mt-1"
                        >
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="mt-1 text-[12px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                        {n.body}
                      </p>
                      
                      <div className="mt-3 pt-3 border-t border-slate-50 dark:border-slate-800/50 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {!n.readAt && (
                            <button 
                              onClick={() => notificationsService.markInAppRead(n.id).then(onRefresh)}
                              className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600 hover:text-blue-700"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              {locale === "ar" ? "تحديد كمقروء" : "Mark Read"}
                            </button>
                          )}
                        </div>
                        <button 
                          onClick={() => notificationsService.deleteInAppNotification(n.id).then(onRefresh)}
                          className="flex items-center gap-1.5 text-[11px] font-bold text-rose-500 hover:text-rose-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {locale === "ar" ? "حذف" : "Delete"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-50 dark:border-slate-800/50 flex items-center justify-between bg-white dark:bg-slate-900">
          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
            {locale === "ar" 
              ? `عرض ${filteredNotifications.length} من ${notifications.length} إشعارات` 
              : `Showing ${filteredNotifications.length} of ${notifications.length} notifications`}
          </p>
          <DialogClose asChild>
            <Button className="h-9 rounded-xl bg-blue-600 px-6 text-[12px] font-bold text-white hover:bg-blue-700 transition-all hover:scale-[1.02]">
              {locale === "ar" ? "إغلاق" : "Close"}
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
