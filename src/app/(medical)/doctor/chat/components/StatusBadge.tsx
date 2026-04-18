"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "online" | "offline" | "typing" | "away";
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "relative flex h-3 w-3",
        className
      )}
    >
      {status === "online" && (
        <>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500 border-2 border-background"></span>
        </>
      )}
      {status === "away" && (
        <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-400 border-2 border-background"></span>
      )}
      {status === "offline" && (
        <span className="relative inline-flex h-3 w-3 rounded-full bg-slate-300 border-2 border-background"></span>
      )}
      {status === "typing" && (
        <span className="relative inline-flex h-3 w-3 rounded-full bg-blue-500 border-2 border-background animate-pulse"></span>
      )}
    </span>
  );
}
