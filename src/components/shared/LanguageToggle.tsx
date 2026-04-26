"use client";

import React from "react";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/stores/useStore";
import { useTranslation } from "@/hooks/useTranslation";
import { cn } from "@/lib/utils";

interface LanguageToggleProps {
  className?: string;
  variant?: "outline" | "ghost" | "default";
  showLabel?: boolean;
}

export function LanguageToggle({ 
  className, 
  variant = "outline",
  showLabel = true 
}: LanguageToggleProps) {
  const { locale } = useTranslation();
  const { setLocale } = useStore();

  const toggleLanguage = () => {
    setLocale(locale === "en" ? "ar" : "en");
  };

  return (
    <Button
      variant={variant}
      size="sm"
      onClick={toggleLanguage}
      className={cn(
        "flex items-center gap-2 transition-all duration-300",
        variant === "outline" && "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800",
        className
      )}
    >
      <Languages className={cn("h-4 w-4", locale === "ar" ? "text-emerald-600" : "text-blue-600")} />
      {showLabel && (
        <span className="font-bold text-xs tracking-tight">
          {locale === "en" ? "العربية" : "English"}
        </span>
      )}
      {!showLabel && (
        <span className="font-bold text-[10px] uppercase">
          {locale === "en" ? "AR" : "EN"}
        </span>
      )}
    </Button>
  );
}
