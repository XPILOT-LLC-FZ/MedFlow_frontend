"use client";

import React, { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Upload, FileText } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";

interface FileDropZoneProps {
  onFiles: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  uploading?: boolean;
  progress?: number;
}

export function FileDropZone({
  onFiles,
  accept = "image/*,.pdf",
  multiple = true,
  disabled = false,
  uploading = false,
  progress = 0,
}: FileDropZoneProps) {
  const { locale } = useTranslation();
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<{ name: string; type: string; url?: string }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const showPreview = useCallback((files: File[]) => {
    const previews = files.map((f) => ({
      name: f.name,
      type: f.type,
      url: f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined,
    }));
    setPreview(previews);
    setTimeout(() => setPreview([]), 3000);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (disabled || uploading) return;
      const files = Array.from(e.dataTransfer.files);
      if (files.length) {
        showPreview(files);
        onFiles(files);
      }
    },
    [disabled, uploading, onFiles, showPreview]
  );

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length) {
      showPreview(files);
      onFiles(files);
    }
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200",
          dragOver ? "border-primary bg-primary/5 scale-[1.01]" : "border-border hover:border-primary/50 hover:bg-muted/30",
          disabled && "opacity-50 cursor-not-allowed",
          uploading && "pointer-events-none"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleSelect}
          className="hidden"
          disabled={disabled}
        />

        <motion.div
          animate={{ y: dragOver ? -4 : 0 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Upload className={cn("h-10 w-10 mx-auto mb-3 transition-colors", dragOver ? "text-primary" : "text-muted-foreground/40")} />
          <p className="text-sm font-medium">
            {locale === "ar" ? "اسحب الملفات هنا أو اضغط للرفع" : "Drag & drop files here, or click to browse"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            PDF, JPG, PNG — {locale === "ar" ? "حد أقصى 10 ميجابايت" : "max 10 MB"}
          </p>
        </motion.div>

        {uploading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center">
            <div className="h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mb-2" />
            <p className="text-sm font-medium">{locale === "ar" ? "جارٍ الرفع..." : "Uploading..."}</p>
            {progress > 0 && (
              <div className="w-48 mt-2">
                <Progress value={progress} className="h-1.5" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* File previews */}
      {preview.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {preview.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted text-sm"
            >
              {f.url ? (
                <img src={f.url} alt={f.name} className="h-6 w-6 rounded object-cover" />
              ) : (
                <FileText className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="truncate max-w-[120px]">{f.name}</span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
