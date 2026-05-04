"use client";

import { Trash2, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";
import type { Appointment } from "@/types";

interface CancelAppointmentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
  onConfirm: () => void;
}

export function CancelAppointmentDialog({
  isOpen,
  onOpenChange,
  appointment,
  onConfirm,
}: CancelAppointmentDialogProps) {
  const { locale, isRTL } = useTranslation();

  if (!appointment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        dir={isRTL ? "rtl" : "ltr"}
        className={cn(
          "p-6 overflow-y-auto border-none flex flex-col transition-all duration-300 rounded-3xl",
          "w-full max-w-sm mx-auto my-5 bg-white dark:bg-slate-900 shadow-xl",
          isRTL ? "font-cairo" : ""
        )}
      >
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="h-14 w-14 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center border border-rose-100 dark:border-rose-800/40 shrink-0">
            <AlertTriangle className="h-7 w-7 text-rose-500" />
          </div>

          <div className="space-y-1.5">
            <DialogTitle className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight">
              {locale === "ar" ? "إلغاء الموعد" : "Cancel Appointment"}
            </DialogTitle>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              {locale === "ar"
                ? `هل أنت متأكد من رغبتك في إلغاء الموعد مع ${appointment.doctorName}؟`
                : `Are you sure you want to cancel the appointment with ${appointment.doctorName}?`}
            </p>
          </div>

          <div className="w-full flex flex-col gap-2.5 pt-3">
            <Button
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
              className="w-full h-11 rounded-2xl font-bold bg-rose-500 hover:bg-rose-600 text-white transition-all duration-200 border-none shadow-sm flex items-center justify-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              <span>{locale === "ar" ? "نعم، إلغاء" : "Yes, cancel"}</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full h-11 rounded-2xl font-bold border-slate-100 dark:border-slate-800 bg-slate-50/50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all duration-200"
            >
              {locale === "ar" ? "تراجع" : "Go back"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
