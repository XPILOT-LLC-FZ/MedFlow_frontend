"use client";

import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ChatBot } from "@/components/shared/ChatBot";
import { FloatingChatButton } from "@/components/shared/FloatingChatButton";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore } from "@/stores/useChatStore";
import type { Locale } from "@/types";

export function PatientChat() {
  const { user } = useAuthStore();
  const { messages } = useChatStore();
  const [open, setOpen] = useState(false);
  const [chatLocale, setChatLocale] = useState<Locale | null>(null);
  const participantId = user?.id ?? "guest";

  const unreadCount = useMemo(
    () => messages.filter((message) => message.patientId === participantId && message.sender === "clinic").length,
    [messages, participantId]
  );

  return (
    <>
      <AnimatePresence>
        {!open && <FloatingChatButton unreadCount={unreadCount} onClick={() => setOpen(true)} />}
      </AnimatePresence>

      <ChatBot
        open={open}
        onClose={() => setOpen(false)}
        chatLocale={chatLocale}
        onSelectLanguage={setChatLocale}
      />
    </>
  );
}
