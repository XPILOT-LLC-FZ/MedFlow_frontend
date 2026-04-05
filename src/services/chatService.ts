/**
 * Chat Service — wraps useChatStore.
 * Swap internals to WebSocket / fetch when backend is ready.
 */
import { useChatStore, type ChatMessage } from "@/stores/useChatStore";

export const chatService = {
  getMessages(patientId: string): ChatMessage[] {
    return useChatStore.getState().messages.filter((message: ChatMessage) => message.patientId === patientId);
  },

  send(patientId: string, text: string): void {
    useChatStore.getState().sendMessage(patientId, text);
  },

  getUnreadCount(patientId: string): number {
    return useChatStore.getState().messages.filter(
      (message: ChatMessage) => message.patientId === patientId && message.sender === "clinic"
    ).length;
  },
};
