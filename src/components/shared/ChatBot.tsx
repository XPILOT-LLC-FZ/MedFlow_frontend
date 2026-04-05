"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Calendar, Loader2, Send, Sparkles, Stethoscope, UserRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/useAuthStore";
import { useBookingStore } from "@/stores/useBookingStore";
import { useChatStore, type ChatMessage } from "@/stores/useChatStore";
import { useStaffStore } from "@/stores/useStaffStore";
import { useToastStore } from "@/stores/useToastStore";
import type { Locale } from "@/types";

type ChatLocale = Locale | null;
type QuickReplyType = "specialties" | "doctors" | "slots" | "specialty" | "doctor" | "slot";

interface QuickReply {
  id: string;
  label: string;
  type: QuickReplyType;
  value?: string;
}

interface ChatBotProps {
  open: boolean;
  onClose: () => void;
  chatLocale: ChatLocale;
  onSelectLanguage: (locale: Locale) => void;
}

interface ChatCopy {
  title: string;
  subtitle: string;
  chooseLanguage: string;
  helper: string;
  loading: string;
  inputPlaceholder: string;
  greeting: string;
  greetingFollowup: string;
  authRequired: string;
  authHelper: string;
  login: string;
  register: string;
  specialties: string;
  doctors: string;
  timeSlots: string;
  suggestionsTitle: string;
  noDoctors: string;
  noSlots: string;
  specialtyPrompt: string;
  doctorPrompt: string;
  slotPrompt: string;
  unclear: string;
  bookingDone: string;
  bookingToast: string;
  specialtyBooked: string;
}

const COPY: Record<Locale, ChatCopy> = {
  en: {
    title: "MedFlow Assistant",
    subtitle: "Smart booking support",
    chooseLanguage: "اختر اللغة / Choose your language",
    helper: "Pick a language first to start the conversation.",
    loading: "Thinking...",
    inputPlaceholder: "Ask about specialties, doctors, or time slots...",
    greeting: "Hi! I can help you book an appointment.",
    greetingFollowup: "Choose a shortcut below or type what you need.",
    authRequired: "You need to login first to continue booking",
    authHelper: "Once you sign in, I can help you choose a specialty, doctor, and time slot.",
    login: "Login",
    register: "Register",
    specialties: "Specialties",
    doctors: "Doctors",
    timeSlots: "Time Slots",
    suggestionsTitle: "Here are a few helpful options:",
    noDoctors: "I couldn't find doctors for that specialty yet.",
    noSlots: "I couldn't find available time slots right now. Try another doctor.",
    specialtyPrompt: "Here are the available specialties:",
    doctorPrompt: "These doctors match your request:",
    slotPrompt: "Here are the next available time slots:",
    unclear: "I didn't quite catch that. Try one of these suggestions.",
    bookingDone: "Your appointment has been booked successfully.",
    bookingToast: "Appointment booked successfully",
    specialtyBooked: "Booked with",
  },
  ar: {
    title: "مساعد MedFlow",
    subtitle: "مساعد ذكي للحجز",
    chooseLanguage: "اختر اللغة / Choose your language",
    helper: "اختَر اللغة أولاً قبل بدء المحادثة.",
    loading: "جارٍ التفكير...",
    inputPlaceholder: "اسأل عن التخصصات أو الأطباء أو المواعيد...",
    greeting: "مرحبًا! أقدر أساعدك في حجز موعد.",
    greetingFollowup: "اختر من الاختصارات بالأسفل أو اكتب طلبك.",
    authRequired: "لازم تسجل دخول الأول عشان أقدر أساعدك في الحجز",
    authHelper: "بعد تسجيل الدخول أقدر أساعدك تختار التخصص والطبيب والوقت المناسب.",
    login: "تسجيل الدخول",
    register: "إنشاء حساب",
    specialties: "التخصصات",
    doctors: "الأطباء",
    timeSlots: "المواعيد",
    suggestionsTitle: "ممكن تبدأ من أحد الخيارات دي:",
    noDoctors: "لسه مفيش أطباء متاحين في التخصص ده.",
    noSlots: "ملقتش مواعيد متاحة دلوقتي. جرّب طبيب تاني.",
    specialtyPrompt: "دي التخصصات المتاحة:",
    doctorPrompt: "دول الأطباء المناسبين لطلبك:",
    slotPrompt: "دي أقرب المواعيد المتاحة:",
    unclear: "الطلب مش واضح بالكامل. جرّب واحدة من الاقتراحات دي.",
    bookingDone: "تم حجز موعدك بنجاح.",
    bookingToast: "تم حجز الموعد بنجاح",
    specialtyBooked: "تم الحجز مع",
  },
};

function TypingIndicator({ label }: { label: string }) {
  return (
    <div className="flex justify-start">
      <div className="rounded-2xl rounded-bl-md bg-muted px-4 py-3 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>{label}</span>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message, locale }: { message: ChatMessage; locale: Locale }) {
  const isPatient = message.sender === "patient";
  const time = new Date(message.timestamp).toLocaleTimeString(locale === "ar" ? "ar-EG" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isPatient ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
          isPatient
            ? "rounded-br-md bg-primary text-primary-foreground"
            : "rounded-bl-md border border-border/60 bg-muted/70 text-foreground"
        }`}
      >
        <p className="whitespace-pre-wrap leading-6">{message.text}</p>
        <p className={`mt-1 text-[10px] ${isPatient ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
          {time}
        </p>
      </div>
    </motion.div>
  );
}

function buildSpecialtyReplies(
  locale: Locale,
  specialties: { specialty: string; specialtyAr: string }[]
): QuickReply[] {
  return specialties.map((item) => ({
    id: `specialty-${item.specialty}`,
    label: locale === "ar" ? item.specialtyAr : item.specialty,
    type: "specialty",
    value: item.specialty,
  }));
}

export function ChatBot({
  open,
  onClose,
  chatLocale,
  onSelectLanguage,
}: ChatBotProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { addAppointment } = useBookingStore();
  const { addMessage, messages } = useChatStore();
  const { staff } = useStaffStore();
  const toast = useToastStore();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const conversationLocale = chatLocale ?? "en";
  const copy = COPY[conversationLocale];
  const participantId = user?.id ?? "guest";

  const doctorDirectory = useMemo(
    () =>
      staff
        .filter((member) => member.role === "DOCTOR")
        .map((member) => ({
          id: member.id,
          name: member.name,
          nameAr: member.nameAr,
          specialty: member.specialty ?? "",
          specialtyAr: member.specialtyAr ?? "",
          available: member.status === "active",
        })),
    [staff]
  );

  const specialties = useMemo(
    () =>
      Array.from(
        new Map(
          doctorDirectory
            .filter((doctor) => doctor.available && doctor.specialty)
            .map((doctor) => [
              doctor.specialty,
              { specialty: doctor.specialty, specialtyAr: doctor.specialtyAr },
            ])
        ).values()
      ),
    [doctorDirectory]
  );

  const doctorMap = useMemo(
    () => new Map(doctorDirectory.map((doctor) => [doctor.id, doctor])),
    [doctorDirectory]
  );

  const participantMessages = useMemo(
    () => messages.filter((message: ChatMessage) => message.patientId === participantId),
    [messages, participantId]
  );

  const baseQuickReplies = useMemo<QuickReply[]>(
    () => [
      { id: "base-specialties", label: copy.specialties, type: "specialties" },
      { id: "base-doctors", label: copy.doctors, type: "doctors" },
      { id: "base-slots", label: copy.timeSlots, type: "slots" },
    ],
    [copy.doctors, copy.specialties, copy.timeSlots]
  );

  useEffect(() => {
    if (!open) return;

    const frame = window.requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [open, participantMessages.length, isLoading, quickReplies.length]);

  useEffect(() => {
    if (!open || !chatLocale) return;

    if (!isAuthenticated) {
      if (participantMessages.length === 0) {
        addMessage({
          patientId: participantId,
          sender: "clinic",
          text: `${copy.authRequired}\n${copy.authHelper}`,
        });
      }
      return;
    }

    if (participantMessages.length === 0) {
      addMessage({
        patientId: participantId,
        sender: "clinic",
        text: `${copy.greeting}\n${copy.greetingFollowup}`,
      });
    }
  }, [
    addMessage,
    baseQuickReplies,
    chatLocale,
    copy.authHelper,
    copy.authRequired,
    copy.greeting,
    copy.greetingFollowup,
    isAuthenticated,
    open,
    participantId,
    participantMessages.length,
  ]);

  const getDoctorLabel = (doctorId: string) => {
    const doctor = doctorMap.get(doctorId);
    if (!doctor) return "";
    return conversationLocale === "ar" ? doctor.nameAr : doctor.name;
  };

  const getSpecialtyLabel = (specialty: string) => {
    const match = specialties.find((item) => item.specialty === specialty);
    return conversationLocale === "ar" ? match?.specialtyAr ?? specialty : match?.specialty ?? specialty;
  };

  const getAvailableDoctors = (specialty?: string | null) =>
    doctorDirectory.filter(
      (doctor) =>
        doctor.available &&
        (!specialty || doctor.specialty.toLowerCase() === specialty.toLowerCase())
    );

  const getDoctorSlots = (doctorId?: string | null) => {
    const seededSlots = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30"];
    if (!doctorId) {
      return seededSlots.slice(0, 4);
    }

    const shift = Number.parseInt(doctorId.replace(/\D/g, "").slice(-1) || "0", 10) % 3;
    return seededSlots.slice(shift, shift + 4);
  };

  const displayedQuickReplies = chatLocale && isAuthenticated
    ? (quickReplies.length > 0 ? quickReplies : baseQuickReplies)
    : [];

  const pushBotReply = (text: string, replies: QuickReply[] = []) => {
    setIsLoading(true);
    window.setTimeout(() => {
      addMessage({
        patientId: participantId,
        sender: "clinic",
        text,
      });
      setQuickReplies(replies);
      setIsLoading(false);
    }, 450);
  };

  const showSpecialties = () => {
    setSelectedSpecialty(null);
    setSelectedDoctorId(null);
    const replies = buildSpecialtyReplies(conversationLocale, specialties);
    pushBotReply(`${copy.specialtyPrompt}\n${copy.suggestionsTitle}`, replies);
  };

  const showDoctors = (specialty?: string | null) => {
    const doctors = getAvailableDoctors(specialty);
    if (doctors.length === 0) {
      pushBotReply(copy.noDoctors, baseQuickReplies);
      return;
    }

    const replies = doctors.map((doctor) => ({
      id: `doctor-${doctor.id}`,
      label: conversationLocale === "ar" ? doctor.nameAr : doctor.name,
      type: "doctor" as const,
      value: doctor.id,
    }));

    const heading = specialty
      ? `${copy.doctorPrompt}\n${getSpecialtyLabel(specialty)}`
      : `${copy.doctorPrompt}\n${copy.suggestionsTitle}`;

    pushBotReply(heading, replies);
  };

  const showSlots = (doctorId?: string | null) => {
    const slots = getDoctorSlots(doctorId);
    if (slots.length === 0) {
      pushBotReply(copy.noSlots, baseQuickReplies);
      return;
    }

    const replies = slots.map((slot) => ({
      id: `slot-${doctorId ?? "general"}-${slot}`,
      label: slot,
      type: "slot" as const,
      value: slot,
    }));

    const heading = doctorId
      ? `${copy.slotPrompt}\n${getDoctorLabel(doctorId)}`
      : `${copy.slotPrompt}\n${copy.suggestionsTitle}`;

    pushBotReply(heading, replies);
  };

  const completeBooking = (slot: string) => {
    const fallbackDoctor = getAvailableDoctors(selectedSpecialty)[0] ?? getAvailableDoctors()[0];
    const doctor = selectedDoctorId ? doctorMap.get(selectedDoctorId) : fallbackDoctor;

    if (!doctor) {
      pushBotReply(copy.noDoctors, baseQuickReplies);
      return;
    }

    const appointmentDate = new Date();
    appointmentDate.setDate(appointmentDate.getDate() + 1);

    addAppointment({
      patientId: participantId,
      patientName: user?.name ?? "Guest Patient",
      doctorId: doctor.id,
      doctorName: doctor.name,
      specialty: doctor.specialty,
      date: appointmentDate.toISOString().split("T")[0],
      time: slot,
      status: "scheduled",
      type: "Consultation",
    });

    toast.success(copy.bookingToast);
    setSelectedDoctorId(doctor.id);
    setSelectedSpecialty(doctor.specialty);

    const doctorName = conversationLocale === "ar" ? doctor.nameAr : doctor.name;
    const specialtyName = conversationLocale === "ar" ? doctor.specialtyAr : doctor.specialty;

    pushBotReply(
      `${copy.bookingDone}\n${copy.specialtyBooked} ${doctorName} (${specialtyName}) - ${slot}`,
      baseQuickReplies
    );
  };

  const handleQuickReply = (reply: QuickReply) => {
    addMessage({
      patientId: participantId,
      sender: "patient",
      text: reply.label,
    });

    if (reply.type === "specialties") return showSpecialties();
    if (reply.type === "doctors") return showDoctors(selectedSpecialty);
    if (reply.type === "slots") return showSlots(selectedDoctorId);

    if (reply.type === "specialty" && reply.value) {
      setSelectedSpecialty(reply.value);
      setSelectedDoctorId(null);
      return showDoctors(reply.value);
    }

    if (reply.type === "doctor" && reply.value) {
      setSelectedDoctorId(reply.value);
      return showSlots(reply.value);
    }

    if (reply.type === "slot" && reply.value) {
      completeBooking(reply.value);
    }
  };

  const handleUserInput = (text: string) => {
    const value = text.trim();
    if (!value) return;

    addMessage({
      patientId: participantId,
      sender: "patient",
      text: value,
    });
    setInput("");

    if (!chatLocale) return;

    if (!isAuthenticated) {
      pushBotReply(`${copy.authRequired}\n${copy.authHelper}`);
      return;
    }

    const normalized = value.toLowerCase();

    if (normalized.includes("special") || normalized.includes("تخصص")) return showSpecialties();
    if (normalized.includes("doctor") || normalized.includes("طبيب")) return showDoctors(selectedSpecialty);
    if (normalized.includes("time") || normalized.includes("slot") || normalized.includes("موعد") || normalized.includes("وقت")) {
      return showSlots(selectedDoctorId);
    }

    const matchedSpecialty = specialties.find(
      (item) =>
        normalized.includes(item.specialty.toLowerCase()) ||
        normalized.includes(item.specialtyAr.toLowerCase())
    );
    if (matchedSpecialty) {
      setSelectedSpecialty(matchedSpecialty.specialty);
      return showDoctors(matchedSpecialty.specialty);
    }

    const matchedDoctor = doctorDirectory.find(
      (doctor) =>
        normalized.includes(doctor.name.toLowerCase()) ||
        normalized.includes(doctor.nameAr.toLowerCase())
    );
    if (matchedDoctor) {
      setSelectedDoctorId(matchedDoctor.id);
      setSelectedSpecialty(matchedDoctor.specialty);
      return showSlots(matchedDoctor.id);
    }

    const matchedSlot = getDoctorSlots(selectedDoctorId).find((slot) => normalized.includes(slot.toLowerCase()));
    if (matchedSlot) {
      return completeBooking(matchedSlot);
    }

    pushBotReply(`${copy.unclear}\n${copy.suggestionsTitle}`, baseQuickReplies);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.98 }}
          className="fixed right-6 bottom-6 z-50 flex h-[min(78vh,640px)] w-[min(calc(100vw-1.5rem),390px)] flex-col overflow-hidden rounded-[28px] border border-border/60 bg-background shadow-[0_30px_90px_-35px_rgba(15,23,42,0.55)] rtl:right-auto rtl:left-6"
        >
          <div className="relative overflow-hidden border-b bg-gradient-to-br from-primary via-primary to-primary/85 px-5 py-4 text-primary-foreground">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_35%)]" />
            <div className="relative flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-white/12 p-2.5">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{copy.title}</p>
                  <p className="mt-1 text-xs text-primary-foreground/80">
                    {isLoading ? copy.loading : copy.subtitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-2 text-primary-foreground/90 transition-colors hover:bg-white/10"
                aria-label="Close chatbot"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-muted/20 px-4 py-4">
            {!chatLocale && (
              <div className="rounded-3xl border border-dashed border-border bg-background p-5 text-center shadow-sm">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold">{copy.chooseLanguage}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{copy.helper}</p>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <Button onClick={() => onSelectLanguage("ar")} className="h-11 rounded-2xl">
                    Arabic 🇪🇬
                  </Button>
                  <Button onClick={() => onSelectLanguage("en")} variant="outline" className="h-11 rounded-2xl">
                    English 🇺🇸
                  </Button>
                </div>
              </div>
            )}

            {chatLocale &&
              participantMessages.map((message) => (
                <MessageBubble key={message.id} message={message} locale={conversationLocale} />
              ))}

            {isLoading && <TypingIndicator label={copy.loading} />}
          </div>

          {chatLocale && !isAuthenticated && (
            <div className="border-t bg-background px-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  className="rounded-2xl"
                  onClick={() => {
                    onClose();
                    router.push("/login");
                  }}
                >
                  {copy.login}
                </Button>
                <Button
                  variant="outline"
                  className="rounded-2xl"
                  onClick={() => {
                    onClose();
                    router.push("/signup");
                  }}
                >
                  {copy.register}
                </Button>
              </div>
            </div>
          )}

          {chatLocale && isAuthenticated && (
            <div className="border-t bg-background px-4 py-4">
              {displayedQuickReplies.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {displayedQuickReplies.map((reply) => {
                    const icon =
                      reply.type === "specialties" || reply.type === "specialty" ? (
                        <Stethoscope className="h-3.5 w-3.5" />
                      ) : reply.type === "doctors" || reply.type === "doctor" ? (
                        <UserRound className="h-3.5 w-3.5" />
                      ) : (
                        <Calendar className="h-3.5 w-3.5" />
                      );

                    return (
                      <Button
                        key={reply.id}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-full"
                        onClick={() => handleQuickReply(reply)}
                      >
                        {icon}
                        {reply.label}
                      </Button>
                    );
                  })}
                </div>
              )}

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  handleUserInput(input);
                }}
                className="flex items-center gap-2"
              >
                <Input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder={copy.inputPlaceholder}
                  className="h-11 rounded-full border-border/70 bg-muted/30"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="h-11 w-11 rounded-full"
                  disabled={!input.trim() || isLoading}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
