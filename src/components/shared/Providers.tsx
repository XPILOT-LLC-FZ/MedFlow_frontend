"use client";

import React, { useEffect } from "react";
import { PatientChat } from "@/components/shared/PatientChat";
import { useStore } from "@/stores/useStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { ToastContainer } from "@/components/shared/ToastContainer";

export function Providers({ children }: { children: React.ReactNode }) {
  const { theme, locale } = useStore();
  const { bootSession } = useAuthStore();

  useEffect(() => {
    // Initialize auth session
    bootSession();
  }, [bootSession]);

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
