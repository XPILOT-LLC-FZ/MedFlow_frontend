"use client";

import { Loader2, Stethoscope, UserRound, Wifi, WifiOff } from "lucide-react";

interface ChatHeaderProps {
  title: string;
  subtitle: string;
  isDoctor: boolean;
  connectionStatus: "connecting" | "connected" | "disconnected";
}

export function ChatHeader({
  title,
  subtitle,
  isDoctor,
  connectionStatus,
}: ChatHeaderProps) {
  return (
    <div className="border-b bg-background/95 px-5 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex items-center gap-3">
        <div className="rounded-xl border bg-card p-2.5 text-muted-foreground shadow-sm">
          {isDoctor ? <UserRound size={18} /> : <Stethoscope size={18} />}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold text-foreground">{title}</h1>
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border bg-card px-2.5 py-1 text-[11px] shadow-sm">
          {connectionStatus === "connected" ? (
            <>
              <Wifi size={12} className="text-success" />
              <span className="text-success">Live</span>
            </>
          ) : connectionStatus === "connecting" ? (
            <>
              <Loader2 size={12} className="animate-spin text-warning" />
              <span className="text-warning">Connecting</span>
            </>
          ) : (
            <>
              <WifiOff size={12} className="text-destructive" />
              <span className="text-destructive">Offline</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
