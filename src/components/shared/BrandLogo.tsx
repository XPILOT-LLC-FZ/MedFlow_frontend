"use client";

import React from "react";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  captionClassName?: string;
  showWordmark?: boolean;
  showCaption?: boolean;
  theme?: "light" | "dark";
};

export function BrandLogo({
  className,
  iconClassName,
  textClassName,
  captionClassName,
  showWordmark = true,
  showCaption = false,
  theme = "light",
}: BrandLogoProps) {
  const isDark = theme === "dark";

  return (
    <div className={cn("inline-flex items-center gap-3", className)}>
      <div
        className={cn(
          "relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl shadow-[0_14px_30px_-16px_rgba(14,165,233,0.9)]",
          "bg-[linear-gradient(135deg,#0f172a_0%,#0ea5e9_45%,#38bdf8_100%)]",
          iconClassName
        )}
      >
        <div className="absolute inset-[1px] rounded-[15px] bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.28),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.02))]" />
        <svg
          viewBox="0 0 48 48"
          aria-hidden="true"
          className="relative z-10 h-6 w-6 text-white"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M11 30c2.8-7.4 6.4-11.1 10.7-11.1 4.4 0 6.7 4.9 10.2 4.9 1.9 0 3.7-1 5.1-3" strokeWidth="3.2" />
          <path d="M11 21.5c2.7-4.4 5.8-6.6 9.4-6.6 4.9 0 7.7 5.6 11.7 5.6 1.6 0 3.1-.5 4.9-2" strokeWidth="2.6" opacity="0.92" />
          <path d="M34.5 10.5v7" strokeWidth="2.8" />
          <path d="M31 14h7" strokeWidth="2.8" />
        </svg>
      </div>

      {showWordmark && (
        <div className="min-w-0">
          <div
            className={cn(
              "truncate text-xl font-semibold tracking-[-0.03em]",
              isDark ? "text-white" : "text-slate-950",
              textClassName
            )}
          >
            Med<span className={isDark ? "text-sky-200" : "text-sky-600"}>Flow</span>
          </div>
          {showCaption && (
            <p
              className={cn(
                "truncate text-[11px] font-medium uppercase tracking-[0.28em]",
                isDark ? "text-white/70" : "text-slate-500",
                captionClassName
              )}
            >
              Connected Care
            </p>
          )}
        </div>
      )}
    </div>
  );
}
