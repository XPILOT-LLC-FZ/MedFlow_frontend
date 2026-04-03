"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ChatMessage {
  id: string;
  sender: "patient" | "clinic";
  text: string;
  timestamp: string;
  patientId: string;
}

const clinicReplies = [
  "Thank you for your message. A team member will assist you shortly.",
  "Your appointment has been noted. We'll send a confirmation via WhatsApp.",
  "Our reception desk is available from 8 AM to 6 PM. How can we help?",
  "We've received your inquiry. A doctor will review and respond soon.",
  "Thank you! Is there anything else we can help you with?",
];

interface ChatState {
  messages: ChatMessage[];
  sendMessage: (patientId: string, text: string) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],

      sendMessage: (patientId, text) => {
        const patientMsg: ChatMessage = {
          id: `msg-${Date.now()}`,
          sender: "patient",
          text,
          timestamp: new Date().toISOString(),
          patientId,
        };

        set((s) => ({ messages: [...s.messages, patientMsg] }));

        // Auto-reply after a short delay
        setTimeout(() => {
          const reply: ChatMessage = {
            id: `msg-${Date.now()}-reply`,
            sender: "clinic",
            text: clinicReplies[Math.floor(Math.random() * clinicReplies.length)],
            timestamp: new Date().toISOString(),
            patientId,
          };
          set((s) => ({ messages: [...s.messages, reply] }));
        }, 1200);
      },
    }),
    { name: "clinic-os-chat" }
  )
);
