"use client";

import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ChatBot } from "@/components/shared/ChatBot";
import { FloatingChatButton } from "@/components/shared/FloatingChatButton";
import { useAuthStore } from "@/stores/useAuthStore";
import { useChatStore, type ChatMessage } from "@/stores/useChatStore";
import { usePathname } from "next/navigation";
import type { Locale } from "@/types";

export function PatientChat() {
  const pathname = usePathname();
  const isChatPage = pathname === "/chat";
  const isProfilePage = pathname === "/profile";

  const { user } = useAuthStore();
  const { messages } = useChatStore();
  const [open, setOpen] = useState(false);
  const [chatLocale, setChatLocale] = useState<Locale | null>(null);
  const participantId = user?.id ?? "guest";

  const unreadCount = useMemo(


    () =>
      messages.filter(
        (message: ChatMessage) =>
          message.patientId === participantId && message.sender === "clinic"
      ).length,
    [messages, participantId]
  );

  if (isChatPage || isProfilePage) return null;

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
