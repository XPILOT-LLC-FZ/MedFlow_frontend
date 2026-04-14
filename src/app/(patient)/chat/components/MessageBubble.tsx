"use client";

import { Check, CheckCheck } from "lucide-react";
import { motion } from "framer-motion";
import type { ChatMessage } from "@/services/doctorChatService";

interface MessageBubbleProps {
  message: ChatMessage;
  mine: boolean;
  showSender: boolean;
  senderFallback: string;
  formattedTime: string;
}

function StatusIcon({ status }: { status: ChatMessage["status"] }) {
  if (status === "seen") {
    return <CheckCheck size={12} className="text-primary" />;
  }
  if (status === "delivered") {
    return <CheckCheck size={12} className="text-muted-foreground" />;
  }
  return <Check size={12} className="text-muted-foreground" />;
}

export function MessageBubble({
  message,
  mine,
  showSender,
  senderFallback,
  formattedTime,
}: MessageBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`mb-2 flex ${mine ? "justify-end" : "justify-start"}`}
    >
      <div className={`flex max-w-[78%] flex-col ${mine ? "items-end" : "items-start"}`}>
        {showSender && !mine ? (
          <span className="mb-1 ml-2 text-[11px] font-medium text-muted-foreground">
            {message.senderName ?? senderFallback}
          </span>
        ) : null}

        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-snug shadow-sm ${
            mine
              ? "rounded-br-sm bg-primary text-primary-foreground shadow-primary/20"
              : "rounded-bl-sm border bg-background text-foreground"
          }`}
        >
          {message.text}
        </div>

        <div className={`mt-1 flex items-center gap-1 ${mine ? "" : "pl-1.5"}`}>
          <span className="text-[10px] text-muted-foreground">{formattedTime}</span>
          {mine ? <StatusIcon status={message.status} /> : null}
        </div>
      </div>
    </motion.div>
  );
}
