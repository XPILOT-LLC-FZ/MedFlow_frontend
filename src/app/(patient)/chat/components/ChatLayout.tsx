"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface ChatLayoutProps {
  sidebar: React.ReactNode;
  header: React.ReactNode;
  messages: React.ReactNode;
  input: React.ReactNode;
}

export function ChatLayout({ sidebar, header, messages, input }: ChatLayoutProps) {
  const searchParams = useSearchParams();
  const selectedConversationId = searchParams.get("conversationId");

  return (
    <div className="h-full flex-1 overflow-hidden bg-background">
      <div className="grid h-full grid-cols-1 overflow-hidden md:grid-cols-[380px_1fr]">
        {/* Sidebar - Visible on desktop, and on mobile only when no conversation is selected */}
        <aside className={cn(
          "min-h-0 border-r bg-background transition-all duration-300 overflow-hidden flex flex-col",
          selectedConversationId ? "hidden md:flex" : "flex"
        )}>
          {sidebar}
        </aside>

        {/* Chat Area - Visible on desktop, and on mobile only when a conversation is selected */}
        <section className={cn(
          "flex min-h-0 flex-col transition-all duration-300 bg-[#F8FAFC] dark:bg-slate-950 overflow-hidden relative",
          selectedConversationId ? "flex" : "hidden md:flex"
        )}>
          <div className="sticky top-0 z-20 w-full flex-shrink-0">
            {header}
          </div>
          <div className="min-h-0 flex-1 overflow-hidden flex flex-col relative">
            {messages}
          </div>
          <div className="flex-shrink-0">
            {input}
          </div>
        </section>
      </div>
    </div>
  );
}
