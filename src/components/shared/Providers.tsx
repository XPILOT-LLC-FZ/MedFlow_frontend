"use client";

import React, { useEffect } from "react";
import { PatientChat } from "@/components/shared/PatientChat";
import { useStore } from "@/stores/useStore";
import { ToastContainer } from "@/components/shared/ToastContainer";

export function Providers({ children }: { children: React.ReactNode }) {
  const { theme, locale } = useStore();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.setAttribute("dir", locale === "ar" ? "rtl" : "ltr");
    root.setAttribute("lang", locale);
  }, [theme, locale]);

  return (
    <>
      {children}
      <PatientChat />
      <ToastContainer />
    </>
  );
}
