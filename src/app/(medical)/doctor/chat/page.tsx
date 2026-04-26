"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";
import type { TranslationKey } from "@/lib/i18n";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  doctorChatService,
  type ChatConversation,
  type ChatMessage,
} from "@/services/doctorChatService";
import { patientService } from "@/services/patientService";
import { bookingService } from "@/services/bookingService";
import { patientDocumentService } from "@/services/patientDocumentService";

import { DoctorChatSidebar } from "./components/DoctorChatSidebar";
import { DoctorChatMain } from "./components/DoctorChatMain";
import { DoctorChatContactInfo } from "./components/DoctorChatContactInfo";
import { Loader2, AlertCircle } from "lucide-react";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function applyStatusToMessages(
  messages: ChatMessage[],
  messageIds: string[],
  status: ChatMessage["status"],
  seenAt: string | null = null
) {
  if (messageIds.length === 0) return messages;
  const idSet = new Set(messageIds);
  return messages.map((message) =>
    idSet.has(message.id)
      ? {
          ...message,
          status,
          seenAt: status === "seen" ? seenAt : message.seenAt,
        }
      : message
  );
}

export default function DoctorChatPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const appointmentIdParam = searchParams.get("appointmentId");
  const conversationIdParam = searchParams.get("conversationId");
  const legacyConversationIdParam = searchParams.get("id");
  const selectedConversationId = conversationIdParam ?? legacyConversationIdParam ?? "";
  
  const { user, accessToken, refreshAccessToken } = useAuthStore();
  const { t, locale } = useTranslation();

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [unreadByConversation, setUnreadByConversation] = useState<Record<string, number>>({});
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);



  // Conversation metadata (favorites, archived, muted)
  const [convMeta, setConvMeta] = useState<Record<string, { isFavorite?: boolean; isArchived?: boolean; isMuted?: boolean }>>({});

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("doctor_chat_meta");
    if (saved) {
      try {
        setConvMeta(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse chat meta", e);
      }
    }
  }, []);

  // Save to localStorage whenever meta changes
  useEffect(() => {
    if (Object.keys(convMeta).length > 0) {
      localStorage.setItem("doctor_chat_meta", JSON.stringify(convMeta));
    }
  }, [convMeta]);

  // Right sidebar data
  const [showContactInfo, setShowContactInfo] = useState(true);
  const [patientDetails, setPatientDetails] = useState<
    | {
        id: string;
        name: string;
        role: string;
        email?: string;
        phone?: string;
        age?: number;
        bloodType?: string;
      }
    | null
  >(null);
  const [patientActivity, setPatientActivity] = useState<
    Array<{ id: string; date: string; title: string }>
  >([]);
  const [patientFiles, setPatientFiles] = useState<
    Array<{ id: string; name: string; size: string; date: string }>
  >([]);
  const lastSyncedLatestRef = useRef<Record<string, string>>({});

  const handleSelectConversation = useCallback(
    (id: string) => {
      setUnreadByConversation((prev) => ({ ...prev, [id]: 0 }));
      const params = new URLSearchParams(searchParams.toString());
      params.set("conversationId", id);
      params.delete("appointmentId");
      params.delete("id");
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  const loadConversations = useCallback(async () => {
    try {
      setError(null);
      const data = await doctorChatService.listConversations();
      setConversations(data);
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
    } catch (err) {
      console.error("Failed to load conversations", err);
      setError(locale === "ar" ? "فشل تحميل المحادثات. يرجى المحاولة مرة أخرى." : "Failed to load conversations. Please try again.");
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  }, [locale, selectedConversationId, user?.id]);

  const handleFavorite = useCallback((id: string) => {
    setConvMeta(prev => ({
      ...prev,
      [id]: { ...prev[id], isFavorite: !prev[id]?.isFavorite }
    }));
  }, []);

  const handleArchive = useCallback((id: string) => {
    setConvMeta(prev => ({
      ...prev,
      [id]: { ...prev[id], isArchived: true }
    }));
    
    if (id === selectedConversationId) {
      const remaining = conversations.filter(c => c.id !== id && !convMeta[c.id]?.isArchived);
      if (remaining.length > 0) {
        handleSelectConversation(remaining[0].id);
      } else {
        handleSelectConversation("");
      }
    }
  }, [selectedConversationId, conversations, convMeta, handleSelectConversation]);

  const handleMute = useCallback((id: string) => {
    setConvMeta(prev => ({
      ...prev,
      [id]: { ...prev[id], isMuted: !prev[id]?.isMuted }
    }));
  }, []);



  const selectedConversation = useMemo(() => 
    conversations.find(c => c.id === selectedConversationId),
    [conversations, selectedConversationId]
  );

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
    void loadConversations();
    const refreshInterval = setInterval(() => {
      void loadConversations();
    }, 10000);

    const onRefresh = () => {
      void loadConversations();
    };

    window.addEventListener("focus", onRefresh);
    document.addEventListener("visibilitychange", onRefresh);
    window.addEventListener("appointment-booked", onRefresh);

    return () => {
      clearInterval(refreshInterval);
      window.removeEventListener("focus", onRefresh);
      document.removeEventListener("visibilitychange", onRefresh);
      window.removeEventListener("appointment-booked", onRefresh);
    };
  }, [loadConversations]);

  useEffect(() => {
    if (!legacyConversationIdParam || conversationIdParam) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("conversationId", legacyConversationIdParam);
    params.delete("id");
    router.replace(`${pathname}?${params.toString()}`);
  }, [conversationIdParam, legacyConversationIdParam, pathname, router, searchParams]);

  useEffect(() => {
    if (!appointmentIdParam || selectedConversationId) return;

    const syncFromAppointment = async () => {
      try {
        const conversation = await doctorChatService.getOrCreateConversation(appointmentIdParam);
        setConversations((prev) =>
          prev.some((entry) => entry.id === conversation.id)
            ? prev
            : [conversation, ...prev]
        );
        handleSelectConversation(conversation.id);
      } catch {
        setError(locale === "ar" ? "تعذر فتح محادثة الموعد" : "Unable to open appointment chat");
      }
    };

    void syncFromAppointment();
  }, [appointmentIdParam, handleSelectConversation, locale, selectedConversationId]);

  useEffect(() => {
    if (!selectedConversationId || accessToken || !user) return;
    void refreshAccessToken().catch(() => {
      setError(locale === "ar" ? "انتهت الجلسة" : "Session expired");
    });
  }, [selectedConversationId, accessToken, user, refreshAccessToken, locale]);

  useEffect(() => {
    if (selectedConversationId || conversations.length === 0) return;
    handleSelectConversation(conversations[0].id);
  }, [selectedConversationId, conversations, handleSelectConversation]);

  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const fetchMessages = async () => {
      setIsLoading(true);
      try {
        setError(null);
        const history = await doctorChatService.getMessages(selectedConversationId);
        if (cancelled) return;
        setMessages(history);
        const result = await doctorChatService.markConversationSeen(selectedConversationId);
        if (cancelled) return;
        setUnreadByConversation((prev) => ({
          ...prev,
          [selectedConversationId]: 0,
        }));
        setMessages((prev) =>
          applyStatusToMessages(prev, result.messageIds, "seen", result.seenAt)
        );
      } catch (err) {
        console.error("Failed to fetch messages", err);
        if (!cancelled) {
          setError(locale === "ar" ? "تعذر تحميل الرسائل" : "Failed to load messages");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void fetchMessages();
    return () => {
      cancelled = true;
    };
  }, [selectedConversationId, locale]);

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
          // non-blocking
        });
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedConversationId]);

  useEffect(() => {
    if (!selectedConversationId) return;
    void markSeen();
  }, [selectedConversationId, markSeen]);

  useEffect(() => {
    const onFocus = () => {
      void markSeen();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [markSeen]);

  // Load patient sidebar details with lightweight lookup first.
  useEffect(() => {
    if (!selectedConversation) {
      setPatientDetails(null);
      setPatientActivity(prev => prev.length === 0 ? prev : []);
      setPatientFiles(prev => prev.length === 0 ? prev : []);
      return;
    }

    const roleLabel =
      selectedConversation.otherParticipantRole === "PATIENT"
        ? t("patient")
        : selectedConversation.otherParticipantRole === "DOCTOR"
        ? t("doctor")
        : t("user");

    setPatientDetails(prev => {
      const next = {
        id: selectedConversation.otherParticipantId || "",
        name: selectedConversation.otherParticipantName || "Chat User",
        role: roleLabel,
      };
      if (JSON.stringify(prev) === JSON.stringify(next) && prev?.role === roleLabel) return prev;
      return next;
    });
    setPatientActivity(prev => prev.length === 0 ? prev : []);
    setPatientFiles(prev => prev.length === 0 ? prev : []);

    const shouldHydratePatientDetails =
      selectedConversation.otherParticipantRole === "PATIENT" &&
      Boolean(selectedConversation.otherParticipantId);

    if (!shouldHydratePatientDetails) {
      return;
    }

    let cancelled = false;

    const hydratePatientDetails = async () => {
      try {
        const patients = await patientService.getAll({
          search: selectedConversation.otherParticipantName ?? undefined,
          take: 50,
        });

        if (cancelled) return;

        const patient = patients.find(
          (entry) =>
            entry.user?.id === selectedConversation.otherParticipantId ||
            entry.id === selectedConversation.otherParticipantId
        );

        if (!patient) {
          return;
        }

        setPatientDetails({
          id: patient.id,
          name: patient.fullName,
          email: patient.email,
          phone: patient.phone,
          role: t("patient"),
          age: patient.dateOfBirth
            ? new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()
            : undefined,
          bloodType: patient.bloodType,
        });

        const [appointments, docs] = await Promise.all([
          bookingService.getAll({ patientId: patient.id }),
          patientDocumentService.getAll(patient.id),
        ]);

        if (cancelled) return;

        setPatientActivity(
          appointments.slice(0, 5).map((appointment) => ({
            id: appointment.id,
            date: new Date(appointment.date).toLocaleDateString(),
            title: `${appointment.type.replace("_", " ")} - ${appointment.status}`,
          }))
        );

        setPatientFiles(
          docs.map((document) => ({
            id: document.id,
            name: document.name,
            size: "2.4 MB",
            date: new Date(document.createdAt).toLocaleDateString(),
          }))
        );
      } catch (err) {
        console.error("Failed to fetch patient details", err);
      }
    };

    void hydratePatientDetails();

    return () => {
      cancelled = true;
    };
  }, [selectedConversation, t]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || !selectedConversationId || !user || isSending) return;

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

    setMessages((prev) => [...prev, optimistic]);

    try {
      const saved = await doctorChatService.sendMessage(selectedConversationId, text);
      lastSyncedLatestRef.current[selectedConversationId] = saved.createdAt;
      setMessages((prev) =>
        prev.map((message) => (message.id === optimisticId ? saved : message))
      );
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === selectedConversationId
            ? { ...conversation, latestMessage: saved }
            : conversation
        )
      );
    } catch (err) {
      console.error("Failed to send message", err);
      setMessages((prev) => prev.filter((message) => message.id !== optimisticId));
    } finally {
      setIsSending(false);
    }
  }, [input, isSending, selectedConversationId, user]);

  const sidebarConversations = useMemo(() => {
    return conversations
      .filter(c => !convMeta[c.id]?.isArchived)
      .map((conversation) => ({
        id: conversation.id,
        name: conversation.otherParticipantName || "User",
        lastMessage: conversation.latestMessage?.text || "No messages yet",
        time: conversation.latestMessage
          ? new Date(conversation.latestMessage.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "",
        unreadCount: unreadByConversation[conversation.id],
        status: "online" as const, // For now
        role: conversation.otherParticipantRole || "PATIENT",
        isFavorite: convMeta[conversation.id]?.isFavorite,
        isMuted: convMeta[conversation.id]?.isMuted,
      }));
  }, [conversations, unreadByConversation, convMeta]);

  const chatMessages = useMemo(() => {
    return messages.map((message) => ({
      id: message.id,
      senderId: message.senderId,
      senderName: message.senderName || "Unknown",
      text: message.text,
      time: formatTime(message.createdAt),
      status: message.status,
      isMine: message.senderId === user?.id,
    }));
  }, [messages, user?.id]);

  if (isLoading && !conversations.length) {
    return (
      <div className="h-screen flex items-center justify-center bg-white flex-col gap-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-slate-500 font-medium">
          {locale === "ar" ? "جارٍ تحميل المحادثات..." : "Loading conversations..."}
        </p>
      </div>
    );
  }

  if (error && !conversations.length) {
    return (
      <div className="h-screen flex items-center justify-center bg-white flex-col gap-6 p-8 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500">
           <AlertCircle size={40} />
        </div>
        <div className="max-w-md">
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            {locale === "ar" ? "خطأ في الاتصال" : "Connection Error"}
          </h2>
          <p className="text-slate-500 mb-6">{error}</p>
          <button 
            onClick={() => void loadConversations()}
            className="px-6 py-3 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
          >
            {locale === "ar" ? "إعادة المحاولة" : "Retry Now"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-130px)] md:h-[calc(100vh-140px)] overflow-hidden bg-white dark:bg-slate-950 -m-4 md:-m-6">
      <DoctorChatSidebar 
        conversations={sidebarConversations}
        selectedId={selectedConversationId}
        onSelect={handleSelectConversation}
        onFilterChange={() => {}} // TODO: Role filtering
        onFavorite={handleFavorite}
        onArchive={handleArchive}
        onMute={handleMute}
      />
      
      <DoctorChatMain 
        recipient={selectedConversation ? {
          id: selectedConversation.otherParticipantId || "",
          name: selectedConversation.otherParticipantName || "User",
          status: "online",
          role:
            selectedConversation.otherParticipantRole === "PATIENT"
              ? t("patient")
              : selectedConversation.otherParticipantRole === "DOCTOR"
              ? t("doctor")
              : t("user" as TranslationKey),
          isFavorite: convMeta[selectedConversation.id]?.isFavorite,
          isMuted: convMeta[selectedConversation.id]?.isMuted,
        } : null}
        messages={chatMessages}
        inputValue={input}
        onInputChange={setInput}
        onSend={handleSend}
        isTyping={false}
        onFavorite={() => handleFavorite(selectedConversationId)}
        onArchive={() => handleArchive(selectedConversationId)}
        onMute={() => handleMute(selectedConversationId)}
        onToggleContactInfo={() => setShowContactInfo(!showContactInfo)}
        isContactInfoOpen={showContactInfo}
      />

      {showContactInfo && (
        <DoctorChatContactInfo 
          user={patientDetails}
          activity={patientActivity}
          files={patientFiles}
          onClose={() => setShowContactInfo(false)}
        />
      )}


    </div>
  );
}

