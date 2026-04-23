"use client";

import React from "react";
import { Bell, Filter, AlertCircle, CheckCircle2, Trash2 } from "lucide-react";
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
  const unreadCount = notifications.filter(n => !n.readAt).length;

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
              { id: "alerts", label: locale === "ar" ? "تنبيهات" : "Alerts" },
              { id: "info", label: locale === "ar" ? "معلومات" : "Info" }
            ].map((filter, i) => (
              <button
                key={filter.id}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap",
                  i === 0 
                    ? "bg-blue-600 text-white" 
                    : "text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
                )}
              >
                {filter.label}
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
              {locale === "ar" ? "تحديد الكل كمقروء" : "Mark All Read"}
            </button>
          </div>
        </div>
        
        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3 bg-slate-50/30 dark:bg-slate-950/20">
          {notifications.length === 0 ? (
            <div className="py-16 text-center">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900 mb-3">
                <Bell className="h-7 w-7 text-slate-300" />
              </div>
              <p className="text-xs font-medium text-slate-400">
                {locale === "ar" ? "لا توجد إشعارات حالياً" : "No notifications at this time"}
              </p>
            </div>
          ) : (
            notifications.map((n) => (
              <div 
                key={n.id}
                className={cn(
                  "rounded-xl border border-slate-100 bg-white dark:border-slate-800/50 dark:bg-slate-900 p-4 transition-all hover:border-slate-200 dark:hover:border-slate-700",
                  !n.readAt && "border-blue-100 dark:border-blue-900/30 ring-1 ring-blue-50 dark:ring-blue-900/10"
                )}
              >
                <div className="flex gap-3.5">
                  <div className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                    n.type === "CRITICAL" ? "bg-rose-50 dark:bg-rose-900/20 text-rose-500" :
                    n.type === "SUCCESS" ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500" :
                    "bg-blue-50 dark:bg-blue-900/20 text-blue-500"
                  )}>
                    {n.type === "CRITICAL" ? <AlertCircle className="h-4.5 w-4.5" /> : 
                     n.type === "SUCCESS" ? <CheckCircle2 className="h-4.5 w-4.5" /> : 
                     <Bell className="h-4.5 w-4.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="flex items-center gap-2 text-[14px] font-bold text-slate-800 dark:text-slate-100">
                        {n.title}
                        {!n.readAt && <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />}
                      </h4>
                      <span 
                        title={new Date(n.createdAt).toLocaleString()}
                        className="text-[10px] font-bold text-slate-400 dark:text-slate-500 whitespace-nowrap uppercase tracking-tight"
                      >
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="mt-1 text-[12px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                      {n.body}
                    </p>
                    
                    <div className="mt-3 pt-3 border-t border-slate-50 dark:border-slate-800/50 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{n.type}</span>
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
            ))
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-50 dark:border-slate-800/50 flex items-center justify-between bg-white dark:bg-slate-900">
          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
            {locale === "ar" 
              ? `عرض ${notifications.length} من ${notifications.length} إشعارات` 
              : `Showing ${notifications.length} of ${notifications.length} notifications`}
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
