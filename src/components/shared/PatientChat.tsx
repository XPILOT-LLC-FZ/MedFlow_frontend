"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, X, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChatStore } from "@/stores/useChatStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useTranslation } from "@/hooks/useTranslation";

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex justify-start"
    >
      <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </motion.div>
  );
}

export function PatientChat() {
  const { locale } = useTranslation();
  const { user } = useAuthStore();
  const { messages, sendMessage } = useChatStore();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const patientId = user?.id ?? "guest";
  const patientMessages = messages.filter((m) => m.patientId === patientId);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [patientMessages.length, open, isTyping]);

  const handleSend = () => {
    if (!text.trim()) return;
    sendMessage(patientId, text.trim());
    setText("");
    // Show typing indicator for clinic auto-reply
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 1400);
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const unreadCount = patientMessages.filter((m) => m.sender === "clinic").length;

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 rtl:right-auto rtl:left-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center"
          >
            <MessageCircle className="h-6 w-6" />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-medium"
              >
                {unreadCount}
              </motion.span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 rtl:right-auto rtl:left-6 z-50 w-[360px] max-h-[500px] rounded-2xl border bg-card shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-primary text-primary-foreground">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Bot className="h-5 w-5" />
                  <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    {locale === "ar" ? "دعم ClinicOS" : "ClinicOS Support"}
                  </p>
                  <p className="text-xs opacity-80">
                    {isTyping
                      ? locale === "ar" ? "يكتب..." : "Typing..."
                      : locale === "ar" ? "متصل الآن" : "Online"}
                  </p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[280px] max-h-[340px]">
              {patientMessages.length === 0 && !isTyping && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <Bot className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p>{locale === "ar" ? "مرحبًا! كيف يمكننا مساعدتك؟" : "Hi! How can we help you?"}</p>
                </div>
              )}
              {patientMessages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.sender === "patient" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                      msg.sender === "patient"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md"
                    }`}
                  >
                    <p>{msg.text}</p>
                    <p className={`text-[10px] mt-1 ${msg.sender === "patient" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                      {formatTime(msg.timestamp)}
                    </p>
                  </div>
                </motion.div>
              ))}
              <AnimatePresence>
                {isTyping && <TypingIndicator />}
              </AnimatePresence>
            </div>

            {/* Input */}
            <div className="p-3 border-t bg-card">
              <form
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="flex gap-2"
              >
                <Input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={locale === "ar" ? "اكتب رسالتك..." : "Type a message..."}
                  className="flex-1 rounded-full text-sm"
                />
                <Button type="submit" size="icon" className="rounded-full shrink-0" disabled={!text.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
