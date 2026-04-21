"use client";

import React from "react";
import Image from "next/image";
import { Download, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";

interface FilePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file?: {
    name: string;
    fileUrl: string;
    fileType: string;
  } | null;
  children?: React.ReactNode; 
}

export function FilePreviewDialog({
  open,
  onOpenChange,
  file,
  children,
}: FilePreviewDialogProps) {
  const { locale } = useTranslation();

  const isImage = file?.fileType?.startsWith("image/");
  const isPdf = file?.fileType === "application/pdf";

  const handleDownload = () => {
    if (file?.fileUrl) {
      window.open(file.fileUrl, "_blank");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden flex flex-col p-0 gap-0 border-none shadow-2xl sm:rounded-2xl">
        <DialogHeader className="p-4 border-b bg-muted/30 flex flex-row items-center justify-between space-y-0 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
              <FileText className="h-4 w-4" />
            </div>
            <div className="flex flex-col min-w-0 pr-4">
              <DialogTitle className="text-sm font-bold truncate">
                {file?.name || (children ? (locale === "ar" ? "الوصفة الطبية" : "Medical Prescription") : (locale === "ar" ? "معاينة المستند" : "Document Preview"))}
              </DialogTitle>
              <DialogDescription className="text-[10px] truncate opacity-60">
                {file ? (isPdf ? "Portable Document Format (PDF)" : "Visual Media File") : (locale === "ar" ? "سجل طبي رسمي" : "Official Medical Record")}
              </DialogDescription>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {file?.fileUrl && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary transition-colors mx-8"
                onClick={handleDownload}
                title={locale === "ar" ? "تحميل" : "Download"}
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto bg-slate-900/5 dark:bg-slate-950/40 p-4 sm:p-8 flex items-center justify-center min-h-[40vh] scrollbar-thin">
          {children ? (
            <div className="w-full max-w-2xl mx-auto animate-in fade-in zoom-in duration-300">
              {children}
            </div>
          ) : file ? (
            <div className="w-full h-full flex items-center justify-center animate-in fade-in zoom-in duration-300">
              {isImage ? (
                <div className="relative group">
                  <Image
                    src={file.fileUrl}
                    alt={file.name}
                    width={1600}
                    height={1200}
                    className="max-w-full h-auto rounded-xl shadow-2xl border bg-white ring-1 ring-black/5"
                    unoptimized
                  />
                  <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-black/10 pointer-events-none" />
                </div>
              ) : isPdf ? (
                <iframe
                  src={`${file.fileUrl}#toolbar=0`}
                  className="w-full h-[75vh] rounded-xl border shadow-2xl bg-white ring-1 ring-black/5"
                  title={file.name}
                />
              ) : (
                <div className="text-center p-12 space-y-4 bg-background rounded-3xl shadow-xl border-2 border-dashed border-muted-foreground/20">
                    <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                        <FileText className="h-8 w-8 text-muted-foreground opacity-40" />
                    </div>
                    <div className="space-y-1">
                        <p className="font-bold">
                            {locale === "ar" ? "لا يمكن معاينة الملف" : "Preview not available"}
                        </p>
                        <p className="text-xs text-muted-foreground max-w-[200px] mx-auto">
                            {locale === "ar" ? "هذا النوع من الملفات يتطلب تحميلاً للمشاهدة" : "This file type requires downloading to be viewed locally."}
                        </p>
                    </div>
                    <Button onClick={handleDownload} variant="default" size="sm" className="rounded-full px-6">
                        {locale === "ar" ? "تحميل للمشاهدة" : "Download to view"}
                    </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center">
                <div className="h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
