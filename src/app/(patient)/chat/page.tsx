"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Loader2, MessageSquare } from "lucide-react";
import {
  doctorChatService,
  type ChatConversation,
  type ChatMessage,
} from "@/services/doctorChatService";
import { useAuthStore } from "@/stores/useAuthStore";
import { useTranslation } from "@/hooks/useTranslation";
import { ChatLayout } from "./components/ChatLayout";
import { ConversationList } from "./components/ConversationList";
import { ChatHeader } from "./components/ChatHeader";
import { MessageBubble } from "./components/MessageBubble";
import { MessageInput } from "./components/MessageInput";

// ── Types ──────────────────────────────────────────────────────────────────

type ConnectionStatus = "connecting" | "connected" | "disconnected";

// ── Helpers ────────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
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
    idSet.has(msg.id)
      ? {
          ...msg,
          status,
          seenAt: status === "seen" ? seenAt : msg.seenAt,
        }
      : msg
  );
}

// ── Component ──────────────────────────────────────────────────────────────

export default function PatientChatPage() {
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
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("disconnected");
  const lastSyncedLatestRef = useRef<Record<string, string>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "instant",
    });
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
        console.debug("[patient-chat] listConversations", data);
      }
      setConversations(data);
      setConnectionStatus("connected");

      setUnreadByConversation((prev) => {
        const next = { ...prev };

        for (const conversation of data) {
          const latestTimestamp =
            conversation.latestMessage?.createdAt ?? conversation.createdAt;
          const previousTimestamp = lastSyncedLatestRef.current[conversation.id];

          if (
            previousTimestamp &&
            new Date(latestTimestamp).getTime() >
              new Date(previousTimestamp).getTime() &&
            conversation.latestMessage?.senderId &&
            conversation.latestMessage.senderId !== user?.id &&
            conversation.id !== selectedConversationId
          ) {
            next[conversation.id] = (next[conversation.id] ?? 0) + 1;
          }

          if (conversation.id === selectedConversationId) {
            next[conversation.id] = 0;
          }

          lastSyncedLatestRef.current[conversation.id] = latestTimestamp;
        }

        return next;
      });

      const seeded: Record<string, string> = {};
      for (const conversation of data) {
        seeded[conversation.id] =
          conversation.latestMessage?.createdAt ?? conversation.createdAt;
      }
      setLastActivityByConversation((prev) => ({ ...seeded, ...prev }));
    } catch {
      setConnectionStatus("disconnected");
      setConversations([]);
    }
  }, [selectedConversationId, user?.id]);

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
    void refreshAccessToken().catch(() => {
      setConnectionStatus("disconnected");
    });
  }, [selectedConversationId, accessToken, user, refreshAccessToken]);

  useEffect(() => {
    if (selectedConversationId || conversations.length === 0) return;
    handleSelectConversation(conversations[0].id);
  }, [selectedConversationId, conversations, handleSelectConversation]);

  useEffect(() => {
    if (!selectedConversationId) {
      setIsLoading(false);
      setError(
        locale === "ar"
          ? "لم يتم تحديد محادثة."
          : "No conversation selected."
      );
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
          setError(
            err instanceof Error ? err.message : "Failed to load conversation"
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void init();
    return () => {
      cancelled = true;
    };
  }, [selectedConversationId, scrollToBottom, locale]);

  useEffect(() => {
    if (!selectedConversationId) return;

    const interval = setInterval(() => {
      void doctorChatService
        .getMessages(selectedConversationId)
        .then((history) => {
          setMessages((prev) => {
            const previousTail = prev[prev.length - 1]?.id;
            const nextTail = history[history.length - 1]?.id;
            if (previousTail === nextTail && prev.length === history.length) {
              return prev;
            }
            return history;
          });
        })
        .catch(() => {
          setConnectionStatus("disconnected");
        });
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedConversationId]);

  const markSeen = useCallback(async () => {
    if (!selectedConversationId) return;
    try {
      const result = await doctorChatService.markConversationSeen(selectedConversationId);
      setUnreadByConversation((prev) => ({
        ...prev,
        [selectedConversationId]: 0,
      }));
      setMessages((prev) =>
        applyStatusToMessages(prev, result.messageIds, "seen", result.seenAt)
      );
    } catch {
      // non-blocking
    }
  }, [selectedConversationId]);

  useEffect(() => {
    if (!selectedConversationId) return;
    markSeen();
  }, [selectedConversationId, markSeen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    const onFocus = () => {
      markSeen();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [markSeen]);

  // ── Sending ────────────────────────────────────────────────────────────

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
    setLastActivityByConversation((prev) => ({
      ...prev,
      [selectedConversationId]: optimistic.createdAt,
    }));
    setMessages((prev) => [...prev, optimistic]);
    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === selectedConversationId
          ? { ...conversation, latestMessage: optimistic }
          : conversation
      )
    );

    try {
      const saved = await doctorChatService.sendMessage(selectedConversationId, text);
      setConnectionStatus("connected");
      setMessages((prev) =>
        prev.map((m) => (m.id === optimistic.id ? saved : m))
      );
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === selectedConversationId
            ? { ...conversation, latestMessage: saved }
            : conversation
        )
      );
      setIsSending(false);
    } catch {
      setConnectionStatus("disconnected");
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setIsSending(false);
    }
  }, [input, isSending, selectedConversationId, user]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isMine = (msg: ChatMessage) => msg.senderId === user?.id;
  const role = user?.role;
  const isDoctor = role === "DOCTOR";
  const conversationItems = useMemo(
    () => {
      const sorted = [...conversations].sort((a, b) => {
        const aScore = new Date(
          lastActivityByConversation[a.id] ??
            a.latestMessage?.createdAt ??
            a.createdAt
        ).getTime();
        const bScore = new Date(
          lastActivityByConversation[b.id] ??
            b.latestMessage?.createdAt ??
            b.createdAt
        ).getTime();
        return bScore - aScore;
      });
      return sorted.map((item) => ({
        id: item.id,
        title:
          item.otherParticipantName ??
          (locale === "ar" ? "محادثة طبية" : "Medical Chat"),
        subtitle:
          item.latestMessage?.text ??
          (locale === "ar" ? "ابدأ المحادثة" : "Start conversation"),
        unreadCount: unreadByConversation[item.id] ?? 0,
      }));
    },
    [conversations, locale, unreadByConversation, lastActivityByConversation]
  );

  return (
    <ChatLayout
      sidebar={
        <ConversationList
          title={locale === "ar" ? "محادثاتي مع الأطباء" : "My Consultations"}
          items={conversationItems}
          selectedId={selectedConversationId}
          onSelect={handleSelectConversation}
          isDoctor={isDoctor}
        />
      }
      header={
        <ChatHeader
          title={locale === "ar" ? "المحادثة مع الطبيب" : "Doctor Chat"}
          subtitle={
            selectedConversationId
              ? `#${selectedConversationId.slice(0, 8)}`
              : locale === "ar"
              ? "لا توجد محادثة محددة"
              : "No conversation selected"
          }
          isDoctor={isDoctor}
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
                <p className="text-xs text-muted-foreground">
                  {locale === "ar" ? "ابدأ المحادثة الآن" : "Start the conversation below"}
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

          <div ref={messagesEndRef} />
        </div>
      }
      input={
        selectedConversationId ? (
          <MessageInput
            value={input}
            onChange={setInput}
            onSend={handleSend}
            onKeyDown={handleKeyDown}
            placeholder={locale === "ar" ? "اكتب رسالتك..." : "Type a message..."}
            disabled={isLoading || !!error}
            isSending={isSending}
          />
        ) : (
          <div className="border-t px-4 py-3 text-center text-sm text-muted-foreground">
            {locale === "ar"
              ? "يرجى اختيار محادثة للبدء"
              : "Select a conversation to start chatting"}
          </div>
        )
      }
    />
  );
}
