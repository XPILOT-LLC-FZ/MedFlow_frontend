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

interface ChatState {
  messages: ChatMessage[];
  addMessage: (message: Omit<ChatMessage, "id" | "timestamp">) => ChatMessage;
  sendMessage: (patientId: string, text: string) => ChatMessage;
  clearMessages: (patientId: string) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: [],

      addMessage: (message) => {
        const nextMessage: ChatMessage = {
          ...message,
          id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: new Date().toISOString(),
        };

        set((state) => ({ messages: [...state.messages, nextMessage] }));
        return nextMessage;
      },

      sendMessage: (patientId, text) =>
        useChatStore.getState().addMessage({
          patientId,
          sender: "patient",
          text,
        }),

      clearMessages: (patientId) => {
        set((state) => ({
          messages: state.messages.filter((message) => message.patientId !== patientId),
        }));
      },
    }),
    { name: "clinic-os-chat" }
  )
);
