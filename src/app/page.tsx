"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";
import PublicPage from "./(public)/page";

export default function RootPage() {
  const router = useRouter();
  const { isAuthenticated, getPostAuthPath } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(getPostAuthPath());
    }
  }, [isAuthenticated, getPostAuthPath, router]);

  if (isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return <PublicPage />;
}
