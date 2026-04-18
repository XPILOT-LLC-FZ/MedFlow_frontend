"use client";

import { useCallback } from "react";
import { useStore } from "@/stores/useStore";
import { translations, TranslationKey } from "@/lib/i18n";

export function useTranslation() {
  const locale = useStore((s) => s.locale);
  const t = useCallback((key: TranslationKey) => translations[locale][key], [locale]);
  const isRTL = locale === "ar";
  return { t, locale, isRTL };
}
