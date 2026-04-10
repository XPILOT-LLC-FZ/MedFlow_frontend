"use client";

import { useAuthStore } from "@/stores/useAuthStore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Role } from "@/types";

type PersistApi = {
  hasHydrated?: () => boolean;
  onFinishHydration?: (callback: () => void) => (() => void) | void;
};

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: Role[];
  fallbackPath?: string;
}

/**
 * RoleGuard component to protect UI sections and pages based on user roles.
 */
export function RoleGuard({ children, allowedRoles, fallbackPath }: RoleGuardProps) {
  const router = useRouter();
  const { user, isAuthenticated, accessToken, refreshToken, bootSession } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(() => {
    const persistApi = (useAuthStore as unknown as { persist?: PersistApi }).persist;
    return !persistApi?.hasHydrated || persistApi.hasHydrated();
  });
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (isHydrated) {
      return;
    }

    // Wait for Zustand persist hydration before making redirect decisions.
    const persistApi = (useAuthStore as unknown as { persist?: PersistApi }).persist;
    if (!persistApi?.onFinishHydration) {
      queueMicrotask(() => setIsHydrated(true));
      return;
    }

    const unsub = persistApi.onFinishHydration(() => {
      setIsHydrated(true);
    });

    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, [isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;

    let cancelled = false;

    const verifyAccess = async () => {
      setIsChecking(true);

      // If tokens are present but auth state is not ready yet, recover the session first.
      if (!isAuthenticated && (accessToken || refreshToken)) {
        try {
          await bootSession();
        } catch {
          // no-op, redirects handled below
        }
      }

      if (cancelled) return;

      const state = useAuthStore.getState();
      if (!state.isAuthenticated || !state.user) {
        router.replace("/login");
        return;
      }

      if (!allowedRoles.includes(state.user.role)) {
        const targetPath = fallbackPath || state.getDashboardPath();
        router.replace(targetPath);
        return;
      }

      setIsChecking(false);
    };

    verifyAccess();

    return () => {
      cancelled = true;
    };
  }, [
    isHydrated,
    user,
    isAuthenticated,
    accessToken,
    refreshToken,
    bootSession,
    allowedRoles,
    fallbackPath,
    router,
  ]);

  if (!isHydrated || isChecking || !isAuthenticated || !user || !allowedRoles.includes(user.role)) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Verifying permissions...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
