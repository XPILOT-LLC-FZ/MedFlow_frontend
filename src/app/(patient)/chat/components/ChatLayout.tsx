"use client";

import React from "react";

interface ChatLayoutProps {
  sidebar: React.ReactNode;
  header: React.ReactNode;
  messages: React.ReactNode;
  input: React.ReactNode;
}

export function ChatLayout({ sidebar, header, messages, input }: ChatLayoutProps) {
  return (
    <div className="h-screen overflow-hidden bg-card">
      <div className="grid h-full grid-cols-1 overflow-hidden md:grid-cols-[320px_1fr]">
        <aside className="min-h-0 border-r bg-card">{sidebar}</aside>
        <section className="flex min-h-0 flex-col bg-muted/10">
          {header}
          <div className="min-h-0 flex-1">{messages}</div>
          {input}
        </section>
      </div>
    </div>
  );
}
