"use client";

import { CheckCircle2, XCircle, Calendar, Clock, MapPin, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";

interface BookingResultDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  status: "success" | "error";
  message?: string;
  details?: {
    doctorName: string;
    date: string;
    time: string;
    location: string;
  };
  onAction?: () => void;
}

export function BookingResultDialog({
  isOpen,
  onOpenChange,
  status,
  message,
  details,
  onAction,
}: BookingResultDialogProps) {
  const { t, isRTL } = useTranslation();

  const isSuccess = status === "success";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose
        dir={isRTL ? "rtl" : "ltr"}
        className={cn(
          "p-0 overflow-hidden border-none flex flex-col transition-all duration-500",
          "w-[90%] max-w-[400px] rounded-[32px] md:rounded-[40px] bg-white dark:bg-slate-900 shadow-2xl"
        )}
      >
        <div className="relative p-8 flex flex-col items-center text-center">
          {/* Status Icon with Animation */}
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 12, stiffness: 200 }}
            className={cn(
              "h-24 w-24 rounded-full flex items-center justify-center mb-6",
              isSuccess 
                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 shadow-lg shadow-emerald-500/20" 
                : "bg-rose-50 dark:bg-rose-500/10 text-rose-500 shadow-lg shadow-rose-500/20"
            )}
          >
            {isSuccess ? (
              <CheckCircle2 className="h-12 w-12 stroke-[2.5]" />
            ) : (
              <XCircle className="h-12 w-12 stroke-[2.5]" />
            )}
          </motion.div>

          {/* Title */}
          <DialogTitle asChild>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-2xl font-black text-slate-900 dark:text-white mb-2"
            >
              {isSuccess 
                ? (t("bookingSuccessful") || "Booking Successful!") 
                : (t("bookingFailed") || "Booking Failed")}
            </motion.h2>
          </DialogTitle>

          {/* Message */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-500 dark:text-slate-400 font-medium text-sm mb-8 px-4"
          >
            {message || (isSuccess 
              ? (t("bookingSuccessMsg") || "Your appointment has been confirmed. You will receive a notification shortly.")
              : (t("bookingErrorMsg") || "Something went wrong while processing your request. Please try again."))}
          </motion.p>

          {/* Details Card (Only on Success) */}
          {isSuccess && details && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="w-full bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-5 mb-8 border border-slate-100 dark:border-slate-800/60"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                  <div className="h-8 w-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
                    <Calendar className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t("date") || "Date"}</span>
                    <span className="text-sm font-bold">{details.date}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                  <div className="h-8 w-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
                    <Clock className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t("time") || "Time"}</span>
                    <span className="text-sm font-bold">{details.time}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                  <div className="h-8 w-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
                    <MapPin className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="flex flex-col items-start text-left">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{t("location") || "Location"}</span>
                    <span className="text-sm font-bold line-clamp-1">{details.location}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Action Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="w-full"
          >
            <Button
              onClick={() => {
                if (onAction) onAction();
                onOpenChange(false);
              }}
              className={cn(
                "w-full h-14 rounded-2xl font-black text-base shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2",
                isSuccess 
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25" 
                  : "bg-slate-900 dark:bg-white dark:text-slate-900 text-white hover:bg-slate-800"
              )}
            >
              {isSuccess ? (
                <>
                  {t("goToAppointments") || "Go to Appointments"}
                  <ArrowRight className={cn("h-5 w-5", isRTL && "rotate-180")} />
                </>
              ) : (
                t("tryAgain") || "Try Again"
              )}
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
