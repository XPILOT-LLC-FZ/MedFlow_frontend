"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import { PatientChat } from "@/components/shared/PatientChat";
import { useStore } from "@/stores/useStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { ToastContainer } from "@/components/shared/ToastContainer";

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, locale } = useStore();
  const { bootSession } = useAuthStore();

  const isAuthPage = pathname?.startsWith("/login") || pathname?.startsWith("/signup");

  useEffect(() => {
    if (isAuthPage) return;

    // Initialize auth session
    bootSession();
  }, [bootSession, isAuthPage]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.setAttribute("dir", locale === "ar" ? "rtl" : "ltr");
    root.setAttribute("lang", locale);
  }, [theme, locale]);

  return (
    <>
      {children}
      {!isAuthPage && <PatientChat />}
      <ToastContainer />
    </>
  );
}
