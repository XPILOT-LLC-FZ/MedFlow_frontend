"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Loader2, MessageSquare } from "lucide-react";
import { io, Socket } from "socket.io-client";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  doctorChatService,
  type ChatConversation,
  type ChatMessage,
} from "@/services/doctorChatService";
import { ChatLayout } from "@/app/(patient)/chat/components/ChatLayout";
import { ConversationList } from "@/app/(patient)/chat/components/ConversationList";
import { ChatHeader } from "@/app/(patient)/chat/components/ChatHeader";
import { MessageBubble } from "@/app/(patient)/chat/components/MessageBubble";
import { MessageInput } from "@/app/(patient)/chat/components/MessageInput";

type ConnectionStatus = "connecting" | "connected" | "disconnected";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Today";
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function groupByDay(messages: ChatMessage[]) {
  const groups: Record<string, ChatMessage[]> = {};
  for (const msg of messages) {
    const key = formatDate(msg.createdAt);
    if (!groups[key]) groups[key] = [];
    groups[key].push(msg);
  }
  return Object.entries(groups);
}

function applyStatusToMessages(
  messages: ChatMessage[],
  messageIds: string[],
  status: ChatMessage["status"],
  seenAt: string | null = null
) {
  if (messageIds.length === 0) return messages;
  const idSet = new Set(messageIds);
  return messages.map((msg) =>
    idSet.has(msg.id) ? { ...msg, status, seenAt: status === "seen" ? seenAt : msg.seenAt } : msg
  );
}

export default function DoctorChatPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const appointmentIdParam = searchParams.get("appointmentId");
  const selectedConversationId = searchParams.get("conversationId") ?? "";
  const { user, accessToken, refreshAccessToken } = useAuthStore();
  const { locale } = useTranslation();

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [unreadByConversation, setUnreadByConversation] = useState<Record<string, number>>({});
  const [lastActivityByConversation, setLastActivityByConversation] = useState<
    Record<string, string>
  >({});
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const [isOtherTyping, setIsOtherTyping] = useState(false);

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingOptimisticIdsRef = useRef<string[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "instant" });
  }, []);

  const handleSelectConversation = useCallback(
    (id: string) => {
      setUnreadByConversation((prev) => ({ ...prev, [id]: 0 }));
      const params = new URLSearchParams(searchParams.toString());
      params.set("conversationId", id);
      params.delete("appointmentId");
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  const loadConversations = useCallback(async () => {
    try {
      const data = await doctorChatService.listConversations();
      if (process.env.NODE_ENV !== "production") {
        console.debug("[doctor-chat] listConversations", data);
      }
      setConversations(data);
      const seeded: Record<string, string> = {};
      for (const conversation of data) {
        seeded[conversation.id] = conversation.latestMessage?.createdAt ?? conversation.createdAt;
      }
      setLastActivityByConversation((prev) => ({ ...seeded, ...prev }));
    } catch {
      setConversations([]);
    }
  }, []);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    const refreshInterval = setInterval(() => {
      void loadConversations();
    }, 10000);
    const onFocus = () => {
      void loadConversations();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    window.addEventListener("appointment-booked", onFocus);

    return () => {
      clearInterval(refreshInterval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("appointment-booked", onFocus);
    };
  }, [loadConversations]);

  useEffect(() => {
    if (!appointmentIdParam || selectedConversationId) return;
    const syncFromAppointment = async () => {
      try {
        const conversation = await doctorChatService.getOrCreateConversation(appointmentIdParam);
        setConversations((prev) =>
          prev.some((c) => c.id === conversation.id) ? prev : [conversation, ...prev]
        );
        handleSelectConversation(conversation.id);
      } catch {
        setConnectionStatus("disconnected");
      }
    };
    void syncFromAppointment();
  }, [appointmentIdParam, selectedConversationId, handleSelectConversation]);

  useEffect(() => {
    if (!selectedConversationId || accessToken || !user) return;
    void refreshAccessToken().catch(() => setConnectionStatus("disconnected"));
  }, [selectedConversationId, accessToken, user, refreshAccessToken]);

  useEffect(() => {
    if (selectedConversationId || conversations.length === 0) return;
    handleSelectConversation(conversations[0].id);
  }, [selectedConversationId, conversations, handleSelectConversation]);

  useEffect(() => {
    if (!selectedConversationId) {
      setIsLoading(false);
      setError(locale === "ar" ? "لم يتم تحديد محادثة." : "No conversation selected.");
      return;
    }

    let cancelled = false;
    const init = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setMessages([]);
        const history = await doctorChatService.getMessages(selectedConversationId);
        if (cancelled) return;
        setMessages(history ?? []);
        await doctorChatService.markConversationSeen(selectedConversationId);
        setTimeout(() => scrollToBottom(false), 50);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load conversation");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void init();
    return () => {
      cancelled = true;
    };
  }, [selectedConversationId, locale, scrollToBottom]);

  useEffect(() => {
    if (conversations.length === 0 || !accessToken) {
      setConnectionStatus("disconnected");
      return;
    }

    setConnectionStatus("connecting");
    const wsUrl = process.env.NEXT_PUBLIC_BACKEND_WS_URL || "http://localhost:3001";
    const socket = io(`${wsUrl}/chat`, {
      transports: ["websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
    socketRef.current = socket;
    const connectTimeout = setTimeout(() => {
      setConnectionStatus((prev) => (prev === "connecting" ? "disconnected" : prev));
    }, 7000);

    socket.on("connect", () => {
      setConnectionStatus("connected");
      for (const conversation of conversations) {
        socket.emit("join_room", { conversationId: conversation.id, token: accessToken });
      }
    });
    socket.on("disconnect", () => setConnectionStatus("disconnected"));
    socket.on("connect_error", () => setConnectionStatus("disconnected"));

    socket.on("new_message", (msg: ChatMessage) => {
      const targetConversationId = msg.conversationId;
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        if (targetConversationId !== selectedConversationId) return prev;
        return [...prev, msg];
      });

      setLastActivityByConversation((prev) => ({ ...prev, [targetConversationId]: msg.createdAt }));
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === targetConversationId
            ? { ...conversation, latestMessage: msg }
            : conversation
        )
      );

      if (targetConversationId !== selectedConversationId && msg.senderId !== user?.id) {
        setUnreadByConversation((prev) => ({
          ...prev,
          [targetConversationId]: (prev[targetConversationId] ?? 0) + 1,
        }));
      }

      if (targetConversationId === selectedConversationId && msg.senderId !== user?.id) {
        socket.emit("mark_seen", { conversationId: msg.conversationId, token: accessToken });
      }
    });

    socket.on("message_sent", (msg: ChatMessage) => {
      const optimisticId = pendingOptimisticIdsRef.current.shift();
      if (!optimisticId) return;
      setMessages((prev) => prev.map((m) => (m.id === optimisticId ? msg : m)));
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === msg.conversationId
            ? { ...conversation, latestMessage: msg }
            : conversation
        )
      );
    });

    socket.on("message_delivered", (payload: { conversationId: string; messageIds: string[] }) => {
      if (payload.conversationId !== selectedConversationId) return;
      setMessages((prev) => applyStatusToMessages(prev, payload.messageIds, "delivered"));
    });

    socket.on(
      "message_seen",
      (payload: { conversationId: string; messageIds: string[]; seenAt: string | null }) => {
        if (payload.conversationId !== selectedConversationId) return;
        setMessages((prev) =>
          applyStatusToMessages(prev, payload.messageIds, "seen", payload.seenAt)
        );
      }
    );

    socket.on("user_typing", () => {
      setIsOtherTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setIsOtherTyping(false), 2500);
    });

    return () => {
      clearTimeout(connectTimeout);
      socket.disconnect();
      socketRef.current = null;
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [selectedConversationId, accessToken, conversations, user?.id]);

  const markSeen = useCallback(async () => {
    if (!selectedConversationId || !accessToken) return;
    try {
      const result = await doctorChatService.markConversationSeen(selectedConversationId);
      setMessages((prev) => applyStatusToMessages(prev, result.messageIds, "seen", result.seenAt));
      socketRef.current?.emit("mark_seen", { conversationId: selectedConversationId, token: accessToken });
    } catch {
      // non-blocking
    }
  }, [selectedConversationId, accessToken]);

  useEffect(() => {
    if (!selectedConversationId) return;
    void markSeen();
  }, [selectedConversationId, markSeen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    const onFocus = () => {
      void markSeen();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [markSeen]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isSending || !selectedConversationId || !user) return;

    setIsSending(true);
    setInput("");
    const optimisticId = `opt-${Date.now()}`;
    const optimistic: ChatMessage = {
      id: optimisticId,
      conversationId: selectedConversationId,
      senderId: user.id,
      senderName: user.name,
      text,
      status: "sent",
      seenAt: null,
      createdAt: new Date().toISOString(),
    };

    pendingOptimisticIdsRef.current.push(optimisticId);
    setMessages((prev) => [...prev, optimistic]);
    setLastActivityByConversation((prev) => ({ ...prev, [selectedConversationId]: optimistic.createdAt }));
    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === selectedConversationId
          ? { ...conversation, latestMessage: optimistic }
          : conversation
      )
    );

    try {
      const socket = socketRef.current;
      if (socket?.connected) {
        socket.emit("send_message", { conversationId: selectedConversationId, text, token: accessToken });
      } else {
        const saved = await doctorChatService.sendMessage(selectedConversationId, text);
        setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? saved : m)));
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    } finally {
      setIsSending(false);
    }
  }, [input, isSending, selectedConversationId, user, accessToken]);

  const handleTyping = () => {
    if (!selectedConversationId || !accessToken) return;
    socketRef.current?.emit("typing", { conversationId: selectedConversationId, token: accessToken });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const isMine = (msg: ChatMessage) => msg.senderId === user?.id;
  const conversationItems = useMemo(() => {
    const sorted = [...conversations].sort((a, b) => {
      const aScore = new Date(lastActivityByConversation[a.id] ?? a.latestMessage?.createdAt ?? a.createdAt).getTime();
      const bScore = new Date(lastActivityByConversation[b.id] ?? b.latestMessage?.createdAt ?? b.createdAt).getTime();
      return bScore - aScore;
    });
    return sorted.map((item) => ({
      id: item.id,
      title: item.otherParticipantName ?? (locale === "ar" ? "محادثة مريض" : "Patient Chat"),
      subtitle: item.latestMessage?.text ?? (locale === "ar" ? "ابدأ المحادثة" : "Start conversation"),
      unreadCount: unreadByConversation[item.id] ?? 0,
    }));
  }, [conversations, locale, unreadByConversation, lastActivityByConversation]);

  return (
    <div className="h-screen overflow-hidden">
      <ChatLayout
        sidebar={
          <ConversationList
            title={locale === "ar" ? "محادثات المرضى" : "Patient Conversations"}
            items={conversationItems}
            selectedId={selectedConversationId}
            onSelect={handleSelectConversation}
            isDoctor
          />
        }
        header={
          <ChatHeader
            title={locale === "ar" ? "المحادثة مع المريض" : "Patient Chat"}
            subtitle={
              selectedConversationId
                ? `#${selectedConversationId.slice(0, 8)}`
                : locale === "ar"
                ? "لا توجد محادثة محددة"
                : "No conversation selected"
            }
            isDoctor
            connectionStatus={connectionStatus}
          />
        }
        messages={
          <div className="h-full overflow-y-auto bg-background px-4 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {isLoading && (
              <div className="flex h-full items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <Loader2 size={30} className="animate-spin text-primary" />
                  <span className="text-sm">
                    {locale === "ar" ? "جارٍ تحميل المحادثة..." : "Loading conversation..."}
                  </span>
                </div>
              </div>
            )}

            {!isLoading && error && (
              <div className="flex h-full items-center justify-center">
                <div className="flex max-w-xs flex-col items-center gap-3 px-6 text-center">
                  <div className="rounded-full bg-destructive/10 p-3 text-destructive">
                    <AlertCircle size={24} />
                  </div>
                  <p className="text-sm text-muted-foreground">{error}</p>
                </div>
              </div>
            )}

            {!isLoading && !error && messages.length === 0 && (
              <div className="flex h-full items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="rounded-full bg-primary/10 p-3 text-primary">
                    <MessageSquare size={24} />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {locale === "ar" ? "لا توجد رسائل بعد" : "No messages yet"}
                  </p>
                </div>
              </div>
            )}

            {!isLoading &&
              !error &&
              groupByDay(messages).map(([day, dayMessages]) => (
                <div key={day}>
                  <div className="my-4 flex items-center gap-3">
                    <hr className="flex-1 border-border" />
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                      {day}
                    </span>
                    <hr className="flex-1 border-border" />
                  </div>

                  {dayMessages.map((msg, idx) => (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      mine={isMine(msg)}
                      showSender={idx === 0 || dayMessages[idx - 1].senderId !== msg.senderId}
                      senderFallback={locale === "ar" ? "الطرف الآخر" : "Other party"}
                      formattedTime={formatTime(msg.createdAt)}
                    />
                  ))}
                </div>
              ))}

            <AnimatePresence>
              {isOtherTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="mb-2 flex justify-start"
                >
                  <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm border bg-card px-4 py-2.5 shadow-sm">
                    <span className="text-xs text-muted-foreground">
                      {locale === "ar" ? "يكتب..." : "Typing..."}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={messagesEndRef} />
          </div>
        }
        input={
          selectedConversationId ? (
            <MessageInput
              value={input}
              onChange={(value) => {
                setInput(value);
                handleTyping();
              }}
              onSend={() => void handleSend()}
              onKeyDown={handleKeyDown}
              placeholder={locale === "ar" ? "اكتب رسالتك..." : "Type a message..."}
              disabled={isLoading || !!error}
              isSending={isSending}
            />
          ) : (
            <div className="border-t px-4 py-3 text-center text-sm text-muted-foreground">
              {locale === "ar" ? "يرجى اختيار محادثة للبدء" : "Select a chat to start"}
            </div>
          )
        }
      />
    </div>
  );
}
