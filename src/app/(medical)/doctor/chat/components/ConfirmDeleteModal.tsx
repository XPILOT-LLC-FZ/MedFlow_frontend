"use client";

import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
}

export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
}: ConfirmDeleteModalProps) {
  const { locale } = useTranslation();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden rounded-[28px] border-none shadow-2xl">
        <div className="bg-white dark:bg-slate-950 p-8">
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-red-50 dark:bg-red-950/30 rounded-3xl flex items-center justify-center mb-6 text-red-500 shadow-sm">
              <Trash2 size={40} />
            </div>
            
            <DialogHeader className="space-y-3 mb-8">
              <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                {title || (locale === "ar" ? "حذف المحادثة؟" : "Delete Conversation?")}
              </DialogTitle>
              <DialogDescription className="text-[15px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed px-4">
                {description || (locale === "ar" 
                  ? "سيؤدي هذا إلى إزالة المحادثة نهائيًا. لا يمكنك التراجع عن هذا الإجراء." 
                  : "This will permanently remove this conversation. You cannot undo this action.")}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col w-full gap-3">
              <Button
                variant="destructive"
                onClick={onConfirm}
                className="h-14 rounded-2xl text-[15px] font-black shadow-lg shadow-red-200 dark:shadow-none hover:bg-red-600 transition-all active:scale-[0.98]"
              >
                {locale === "ar" ? "حذف المحادثة" : "Delete chat"}
              </Button>
              <Button
                variant="ghost"
                onClick={onClose}
                className="h-14 rounded-2xl text-[15px] font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all"
              >
                {locale === "ar" ? "إلغاء" : "Cancel"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
