"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import type { Role } from "@/types";

interface AuthGuardProps {
  children: React.ReactNode;
  /** Roles allowed to view this route. If empty/undefined, any authenticated user is allowed. */
  allowedRoles?: Role[];
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }

    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      // Authenticated but wrong role — send to their own dashboard
      const { getDashboardPath } = useAuthStore.getState();
      router.replace(getDashboardPath());
      return;
    }

    setChecked(true);
  }, [isAuthenticated, user, allowedRoles, router]);

  if (!checked) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
