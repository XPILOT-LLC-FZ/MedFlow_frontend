"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import PublicPage from "./(public)/page";

export default function RootPage() {
  const router = useRouter();
  const { isAuthenticated, getDashboardPath } = useAuthStore();
  const [showLanding, setShowLanding] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(getDashboardPath());
    } else {
      setShowLanding(true);
    }
  }, [isAuthenticated, getDashboardPath, router]);

  if (!showLanding) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return <PublicPage />;
}
