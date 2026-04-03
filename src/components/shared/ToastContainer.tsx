"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { useToastStore } from "@/stores/useToastStore";

const icons = {
  success: <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />,
  error: <XCircle className="h-5 w-5 text-red-500 shrink-0" />,
  info: <Info className="h-5 w-5 text-blue-500 shrink-0" />,
};

const bgColors = {
  success: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
  error: "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800",
  info: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800",
};

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-6 right-6 rtl:right-auto rtl:left-6 z-[100] flex flex-col gap-2 max-w-[380px]">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm ${bgColors[toast.type]}`}
          >
            {icons[toast.type]}
            <p className="text-sm font-medium text-foreground flex-1 pt-0.5">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-0.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
