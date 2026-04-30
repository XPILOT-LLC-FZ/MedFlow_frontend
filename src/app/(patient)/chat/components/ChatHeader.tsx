"use client";

import { ChevronLeft, Loader2, Stethoscope, UserRound, Phone, Video } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ChatHeaderProps {
  title: string;
  isDoctor: boolean;
  connectionStatus: "connecting" | "connected" | "disconnected";
}

export function ChatHeader({
  title,
  isDoctor,
  connectionStatus,
}: ChatHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleBack = () => {
    router.push("/chat");
  };

  return (
    <div className="sticky top-0 z-20 border-b border-slate-100 bg-white/95 dark:bg-slate-900/95 px-4 py-4 backdrop-blur-xl transition-all duration-300">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Mobile Back Button */}
          <button
            onClick={handleBack}
            className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ChevronLeft className="h-6 w-6 text-slate-600 dark:text-slate-400" />
          </button>

          {/* Avatar & Name */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-11 w-11 border-2 border-background shadow-sm">
                <AvatarFallback className="bg-slate-100 dark:bg-slate-800">
                  {isDoctor ? <UserRound size={22} className="text-slate-400" /> : <Stethoscope size={22} className="text-slate-400" />}
                </AvatarFallback>
              </Avatar>
              <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-[16px] font-bold text-slate-900 dark:text-slate-50 leading-tight">
                {title}
              </h1>
              <p className="text-[12px] font-medium text-emerald-500">
                Online
              </p>
            </div>
          </div>
        </div>

        {/* Action Icons as per reference image */}
        <div className="flex items-center gap-2">
          <button className="h-10 w-10 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <Phone size={20} className="stroke-[1.5]" />
          </button>
          <button className="h-10 w-10 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <Video size={22} className="stroke-[1.5]" />
          </button>
        </div>
      </div>
    </div>
  );
}
