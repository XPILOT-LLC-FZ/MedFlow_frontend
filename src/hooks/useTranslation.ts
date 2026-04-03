"use client";

import { useStore } from "@/stores/useStore";
import { translations, TranslationKey } from "@/lib/i18n";

export function useTranslation() {
  const locale = useStore((s) => s.locale);
  const t = (key: TranslationKey) => translations[locale][key];
  const isRTL = locale === "ar";
  return { t, locale, isRTL };
}
