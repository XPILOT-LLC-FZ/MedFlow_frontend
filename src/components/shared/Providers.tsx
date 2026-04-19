"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ChatWidget } from "@/components/ChatWidget";
import { useStore } from "@/stores/useStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { ToastContainer } from "@/components/shared/ToastContainer";

type PersistApi = {
  hasHydrated?: () => boolean;
  onFinishHydration?: (callback: () => void) => (() => void) | void;
};

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, locale } = useStore();
  const { bootSession } = useAuthStore();
  const [mounted, setMounted] = React.useState(false);
  const [isAuthHydrated, setIsAuthHydrated] = React.useState(() => {
    const persistApi = (useAuthStore as unknown as { persist?: PersistApi }).persist;
    return !persistApi?.hasHydrated || persistApi.hasHydrated();
  });

  const isAuthPage = pathname?.startsWith("/login") || pathname?.startsWith("/signup");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isAuthHydrated) {
      return;
    }

    const persistApi = (useAuthStore as unknown as { persist?: PersistApi }).persist;

    if (!persistApi?.onFinishHydration) {
      queueMicrotask(() => setIsAuthHydrated(true));
      return;
    }

    const unsub = persistApi.onFinishHydration(() => {
      setIsAuthHydrated(true);
    });

    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, [isAuthHydrated]);

  useEffect(() => {
    if (!isAuthHydrated || isAuthPage) return;

    // Initialize auth session
    bootSession();
  }, [bootSession, isAuthHydrated, isAuthPage]);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.setAttribute("dir", locale === "ar" ? "rtl" : "ltr");
    root.setAttribute("lang", locale);
  }, [theme, locale, mounted]);

  // Prevent hydration mismatch by returning null or a simplified loader during SSR
  if (!mounted) {
    return <div style={{ visibility: "hidden" }}>{children}</div>;
  }

  return (
    <>
      {children}
      {!isAuthPage && <ChatWidget />}
      <ToastContainer />
    </>
  );
}
