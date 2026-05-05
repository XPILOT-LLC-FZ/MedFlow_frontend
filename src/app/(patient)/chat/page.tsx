"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo, Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Loader2, MessageSquare } from "lucide-react";
import {
  doctorChatService,
  type ChatConversation,
  type ChatMessage,
} from "@/services/doctorChatService";
import { staffService } from "@/services/staffService";
import type { ApiPublicDoctor } from "@/types";
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

function PatientChatPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const appointmentIdParam = searchParams.get("appointmentId");
  const doctorIdParam = searchParams.get("doctorId");
  const selectedConversationId = searchParams.get("conversationId");
  const { user } = useAuthStore();
  const { locale, t } = useTranslation();

  const formatDate = useCallback((iso: string) => {
    const d = new Date(iso);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return t("today") || "Today";
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return t("yesterday") || "Yesterday";
    return d.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", { month: "short", day: "numeric" });
  }, [t, locale]);

  const groupByDay = useCallback((messages: ChatMessage[]) => {
    const groups: Record<string, ChatMessage[]> = {};
    for (const msg of messages) {
      const key = formatDate(msg.createdAt);
      if (!groups[key]) groups[key] = [];
      groups[key].push(msg);
    }
    return Object.entries(groups);
  }, [formatDate]);

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [unreadByConversation, setUnreadByConversation] = useState<Record<string, number>>({});
  const [doctorAvatars, setDoctorAvatars] = useState<Record<string, string>>({});
  const hasAutoSelectedRef = useRef(false);

  useEffect(() => {
    const loadDoctorAvatars = async () => {
      try {
        const publicDocs = await staffService.getPublicDoctors();
        const map: Record<string, string> = {};
        publicDocs.forEach((doc: ApiPublicDoctor) => {
          if (doc.user?.avatarUrl) {
            map[doc.id] = doc.user.avatarUrl;
            if (doc.user.id) map[doc.user.id] = doc.user.avatarUrl;
            map[doc.fullName] = doc.user.avatarUrl;
          }
        });
        setDoctorAvatars(map);
      } catch (err) {
        console.error("Failed to fetch public doctors for avatars", err);
      }
    };
    if (user?.id) {
      void loadDoctorAvatars();
    }
  }, [user?.id]);
  const [lastActivityByConversation, setLastActivityByConversation] = useState<
    Record<string, string>
  >({});
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isConversationsLoading, setIsConversationsLoading] = useState(true);
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
    } finally {
      setIsConversationsLoading(false);
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
    if (!doctorIdParam || selectedConversationId || !user) return;
    const syncFromDoctor = async () => {
      try {
        const conversation = await doctorChatService.getConversationByParticipants(user.id, doctorIdParam);
        setConversations((prev) =>
          prev.some((c) => c.id === conversation.id) ? prev : [conversation, ...prev]
        );
        handleSelectConversation(conversation.id);
      } catch (err) {
        console.error("[patient-chat] Failed to sync from doctorId", err);
      }
    };
    void syncFromDoctor();
  }, [doctorIdParam, selectedConversationId, user, handleSelectConversation]);


  useEffect(() => {
    // Only auto-select on desktop. On mobile, we want to show the list first.
    if (typeof window === "undefined") return;
    const isMobile = window.innerWidth < 768;
    if (selectedConversationId || conversations.length === 0 || isMobile || hasAutoSelectedRef.current) return;
    hasAutoSelectedRef.current = true;
    handleSelectConversation(conversations[0].id);
  }, [selectedConversationId, conversations, handleSelectConversation]);

  useEffect(() => {
    if (isConversationsLoading) return;

    if (!selectedConversationId) {
      setIsLoading(false);
      setError(t("noConversationSelected") || "No conversation selected.");
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
  }, [selectedConversationId, scrollToBottom, locale, isConversationsLoading, t]);

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
          (t("medicalChat") || "Medical Chat"),
        subtitle:
          item.latestMessage?.text ??
          (t("startConversation") || "Start conversation"),
        unreadCount: unreadByConversation[item.id] ?? 0,
        lastMessageTime: item.latestMessage ? formatTime(item.latestMessage.createdAt) : undefined,
        lastMessageStatus: (item.latestMessage && item.latestMessage.senderId === user?.id) ? item.latestMessage.status : undefined,
        online: true, // Placeholder for online status
        avatarUrl:
          item.otherParticipantId ? doctorAvatars[item.otherParticipantId] :
          item.otherParticipantName ? doctorAvatars[item.otherParticipantName] :
          undefined,
      }));
    },
    [conversations, unreadByConversation, lastActivityByConversation, user?.id, doctorAvatars, t]
  );

  return (
    <ChatLayout
      sidebar={
        <ConversationList
          title={locale === "ar" ? "الرسائل" : "Messages"}
          items={conversationItems}
          selectedId={selectedConversationId ?? undefined}
          onSelect={handleSelectConversation}
          isDoctor={isDoctor}
          isLoading={isConversationsLoading}
        />
      }
      header={
        (() => {
          const selectedConv = conversations.find(c => c.id === selectedConversationId);
          return (
            <ChatHeader
              title={selectedConv?.otherParticipantName ?? (t("medicalChat") || "Doctor Chat")}
              avatarUrl={
                selectedConv?.otherParticipantId ? doctorAvatars[selectedConv.otherParticipantId] :
                selectedConv?.otherParticipantName ? doctorAvatars[selectedConv.otherParticipantName] :
                (selectedConv as { otherParticipantAvatarUrl?: string })?.otherParticipantAvatarUrl
              }
              isDoctor={isDoctor}
              connectionStatus={connectionStatus}
            />
          );
        })()
      }
      messages={
        <div className="h-full overflow-y-auto bg-background px-4 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {(isConversationsLoading || isLoading) && (
            <div className="flex h-full items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <Loader2 size={30} className="animate-spin text-primary" />
                <span className="text-sm">
                  {t("loadingConversation") || "Loading conversation..."}
                </span>
              </div>
            </div>
          )}

          {!isConversationsLoading && !isLoading && error && (
            <div className="flex h-full items-center justify-center">
              <div className="flex max-w-xs flex-col items-center gap-3 px-6 text-center">
                <div className="rounded-full bg-destructive/10 p-3 text-destructive">
                  <AlertCircle size={24} />
                </div>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </div>
          )}

          {!isConversationsLoading && !isLoading && !error && messages.length === 0 && (
            <div className="flex h-full items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="rounded-full bg-primary/10 p-3 text-primary">
                  <MessageSquare size={24} />
                </div>
                <p className="text-sm font-medium text-foreground">
                  {t("noMessagesYet") || "No messages yet"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("startTheConversationBelow") || "Start the conversation below"}
                </p>
              </div>
            </div>
          )}

          {!isConversationsLoading &&
            !isLoading &&
            !error &&
            groupByDay(messages).map(([day, dayMessages]) => (
              <div key={day}>
                <div className="my-8 flex items-center gap-4">
                  <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                  <span className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">
                    {day}
                  </span>
                  <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                </div>

                {dayMessages.map((msg, idx) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    mine={isMine(msg)}
                    showSender={idx === 0 || dayMessages[idx - 1].senderId !== msg.senderId}
                    senderFallback={t("otherParty") || "Other party"}
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
            placeholder={t("typeYourMessage") || "Type a message..."}
            disabled={isLoading || !!error}
            isSending={isSending}
          />
        ) : (
          <div className="border-t px-4 py-3 text-center text-sm text-muted-foreground">
            {t("selectConversationToStart") || "Select a conversation to start chatting"}
          </div>
        )
      }
    />
  );
}

export default function PatientChatPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    }>
      <PatientChatPageContent />
    </Suspense>
  );
}
