"use client";

import { useCallback } from "react";
import { useStore } from "@/stores/useStore";
import { translations, TranslationKey } from "@/lib/i18n";

export function useTranslation() {
  const locale = useStore((s) => s.locale);
  const t = useCallback((key: TranslationKey, params?: Record<string, string | number>): string => {
    let text = (translations[locale][key as keyof typeof translations[typeof locale]] || key) as string;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  }, [locale]);
  const isRTL = locale === "ar";
  return { t, locale, isRTL };
}
