"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState, Suspense } from "react";
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
import { usersService } from "@/services/usersService";
import type { ApiUser } from "@/types";

import { ReceptionChatSidebar } from "./components/ReceptionChatSidebar";
import { ReceptionChatMain } from "./components/ReceptionChatMain";
import { ReceptionChatContactInfo } from "./components/ReceptionChatContactInfo";
import { Loader2, AlertCircle, Search, X, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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

function ReceptionChatPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const appointmentIdParam = searchParams.get("appointmentId");
  const conversationIdParam = searchParams.get("conversationId");
  const legacyConversationIdParam = searchParams.get("id");
  const selectedConversationId = conversationIdParam ?? legacyConversationIdParam ?? "";

  const { user, accessToken, refreshAccessToken } = useAuthStore();
  const { t, isRTL, locale } = useTranslation();

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [unreadByConversation, setUnreadByConversation] = useState<Record<string, number>>({});
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New Chat Modal state
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<ApiUser[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);

  // Conversation metadata (favorites, archived, muted)
  const [convMeta, setConvMeta] = useState<Record<string, { isFavorite?: boolean; isArchived?: boolean; isMuted?: boolean }>>({});

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("reception_chat_meta");
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
      localStorage.setItem("reception_chat_meta", JSON.stringify(convMeta));
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
      if (!id) {
        router.push(pathname);
        setTimeout(() => router.refresh(), 10);
        return;
      }
      const params = new URLSearchParams(searchParams.toString());
      params.set("conversationId", id);
      params.delete("id");
      params.delete("appointmentId");
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  const handleBack = useCallback(() => {
    handleSelectConversation("");
  }, [handleSelectConversation]);

  useEffect(() => {
    if (!isNewChatModalOpen) return;
    const timer = setTimeout(async () => {
      if (!userSearchQuery.trim()) {
        setUserSearchResults([]);
        return;
      }
      setIsSearchingUsers(true);
      try {
        const results = await usersService.getAll({ search: userSearchQuery, take: 20 });
        setUserSearchResults(results);
      } catch (err) {
        console.error("User search failed", err);
      } finally {
        setIsSearchingUsers(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [userSearchQuery, isNewChatModalOpen]);

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
      setError(isRTL ? "فشل تحميل المحادثات. يرجى المحاولة مرة أخرى." : "Failed to load conversations. Please try again.");
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  }, [isRTL, selectedConversationId, user?.id]);

  const handleStartNewChat = useCallback(async (targetUser: ApiUser) => {
    if (!user) return;
    try {
      const conversation = await doctorChatService.createDirectConversation(targetUser.id);
      setIsNewChatModalOpen(false);
      setUserSearchQuery("");
      setConversations((prev) => {
        if (prev.some((c) => c.id === conversation.id)) return prev;
        return [conversation, ...prev];
      });
      handleSelectConversation(conversation.id);
      void loadConversations();
    } catch (err) {
      console.error("Failed to create chat", err);
      alert(isRTL ? "تعذر إنشاء المحادثة." : "Could not create chat.");
    }
  }, [user, handleSelectConversation, isRTL, loadConversations]);

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
        setError(isRTL ? "تعذر فتح محادثة الموعد" : "Unable to open appointment chat");
      }
    };

    void syncFromAppointment();
  }, [appointmentIdParam, handleSelectConversation, isRTL, selectedConversationId]);

  useEffect(() => {
    if (!selectedConversationId || accessToken || !user) return;
    void refreshAccessToken().catch(() => {
      setError(isRTL ? "انتهت الجلسة" : "Session expired");
    });
  }, [selectedConversationId, accessToken, user, refreshAccessToken, isRTL]);

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
          const errorStatus = (err as any)?.status;
          if (errorStatus === 403) {
            setError(isRTL ? "ليس لديك صلاحية للوصول لهذه المحادثة" : "You are not authorized to view this chat");
            setTimeout(() => {
              if (!cancelled && conversations.length > 0) {
                handleSelectConversation(conversations[0].id);
              }
            }, 2000);
          } else {
            setError(isRTL ? "تعذر تحميل الرسائل" : "Failed to load messages");
          }
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void fetchMessages();
    return () => {
      cancelled = true;
    };
  }, [selectedConversationId, isRTL, conversations, handleSelectConversation]);

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

  // Load patient sidebar details
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
        lastMessage: conversation.latestMessage?.text || (isRTL ? "لا توجد رسائل بعد" : "No messages yet"),
        time: conversation.latestMessage
          ? new Date(conversation.latestMessage.createdAt).toLocaleTimeString(isRTL ? "ar-EG" : "en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })
          : "",
        unreadCount: unreadByConversation[conversation.id],
        status: "online" as const, 
        role: conversation.otherParticipantRole || "PATIENT",
        isFavorite: convMeta[conversation.id]?.isFavorite,
        isMuted: convMeta[conversation.id]?.isMuted,
      }));
  }, [conversations, convMeta, unreadByConversation, isRTL]);

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
          {isRTL ? "جارٍ تحميل المحادثات..." : "Loading conversations..."}
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
            {isRTL ? "خطأ في الاتصال" : "Connection Error"}
          </h2>
          <p className="text-slate-500 mb-6">{error}</p>
          <button
            onClick={() => void loadConversations()}
            className="px-6 py-3 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
          >
            {isRTL ? "إعادة المحاولة" : "Retry Now"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className={cn("flex h-[calc(100vh-110px)] md:h-[calc(100vh-140px)] overflow-hidden bg-white dark:bg-slate-950 -m-4 md:-m-6 relative", isRTL ? "flex-row" : "flex-row")}>
      <ReceptionChatSidebar
        conversations={sidebarConversations}
        selectedId={selectedConversationId}
        onSelect={handleSelectConversation}
        onFilterChange={() => { }} 
        onFavorite={handleFavorite}
        onArchive={handleArchive}
        onMute={handleMute}
        onNewChat={() => setIsNewChatModalOpen(true)}
      />

      <ReceptionChatMain
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
        onBack={handleBack}
        isContactInfoOpen={showContactInfo}
      />

      {showContactInfo && (
        <ReceptionChatContactInfo
          user={patientDetails}
          activity={patientActivity}
          files={patientFiles}
          onClose={() => setShowContactInfo(false)}
        />
      )}

      {/* New Chat Modal */}
      {isNewChatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div dir={isRTL ? "rtl" : "ltr"} className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className={cn("p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between", isRTL ? "flex-row-reverse" : "flex-row")}>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {isRTL ? "محادثة جديدة" : "New Chat"}
              </h2>
              <button
                onClick={() => setIsNewChatModalOpen(false)}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-5 border-b border-slate-100 dark:border-slate-800">
              <div className="relative group">
                <Search className={cn("absolute top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors", isRTL ? "right-4" : "left-4")} size={18} />
                <input
                  type="text"
                  placeholder={isRTL ? "ابحث عن اسم المستخدم أو البريد..." : "Search user by name or email..."}
                  className={cn("w-full h-12 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl text-[14px] font-medium text-slate-900 dark:text-slate-100 outline-none placeholder:text-slate-400 focus:bg-slate-100 dark:focus:bg-slate-800 transition-all", isRTL ? "pr-12 pl-4 text-right" : "pl-12 pr-4 text-left")}
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1 thin-scrollbar">
              {isSearchingUsers ? (
                <div className="py-8 flex justify-center text-blue-500">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : userSearchResults.length > 0 ? (
                userSearchResults.map((usr) => (
                  <button
                    key={usr.id}
                    onClick={() => handleStartNewChat(usr)}
                    className={cn("w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors", isRTL ? "flex-row-reverse text-right" : "flex-row text-left")}
                  >
                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center shrink-0 overflow-hidden">
                      {usr.avatar ? (
                         <img src={usr.avatar} alt={usr.name} className="w-full h-full object-cover" />
                      ) : (
                         <UserIcon size={18} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[14px] text-slate-900 dark:text-slate-100 truncate">{usr.name}</p>
                      <p className="text-[12px] text-slate-500 truncate">{usr.email || usr.phone}</p>
                    </div>
                    <div className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-widest shrink-0">
                      {usr.role}
                    </div>
                  </button>
                ))
              ) : userSearchQuery.trim().length > 0 ? (
                <div className="py-8 text-center text-slate-500">
                  <p className="font-medium text-[14px]">{isRTL ? "لم يتم العثور على مستخدمين" : "No users found"}</p>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400">
                  <p className="font-medium text-[13px]">{isRTL ? "اكتب للبحث عن مستخدم..." : "Type to search for a user..."}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function ReceptionChatPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    }>
      <ReceptionChatPageContent />
    </Suspense>
  );
}
