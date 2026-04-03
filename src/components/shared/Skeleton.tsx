"use client";

import { cn } from "@/lib/utils";

function Bone({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-lg bg-muted", className)} />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border bg-card p-5 space-y-3">
      <div className="flex items-center gap-3">
        <Bone className="h-10 w-10 rounded-xl" />
        <div className="space-y-2 flex-1">
          <Bone className="h-4 w-24" />
          <Bone className="h-3 w-16" />
        </div>
      </div>
      <Bone className="h-8 w-full" />
    </div>
  );
}

export function SkeletonStatsRow({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${count} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <Bone className="h-4 w-20" />
            <Bone className="h-8 w-8 rounded-lg" />
          </div>
          <Bone className="h-7 w-16" />
          <Bone className="h-3 w-12" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="border-b px-4 py-3 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Bone key={i} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="px-4 py-3 flex gap-4 border-b last:border-0">
          {Array.from({ length: cols }).map((_, c) => (
            <Bone key={c} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="rounded-xl border bg-card p-5 space-y-3">
      <Bone className="h-4 w-32" />
      <Bone className="h-[250px] w-full rounded-lg" />
    </div>
  );
}

export function SkeletonPage() {
  return (
    <div className="space-y-6 max-w-7xl animate-in fade-in duration-300">
      <div className="space-y-2">
        <Bone className="h-7 w-48" />
        <Bone className="h-4 w-64" />
      </div>
      <SkeletonStatsRow />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonChart />
        <SkeletonChart />
      </div>
      <SkeletonTable />
    </div>
  );
}
