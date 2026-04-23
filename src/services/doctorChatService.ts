import { apiClient } from "@/lib/apiClient";

export interface ChatConversation {
  id: string;
  patientUserId: string;
  doctorUserId: string;
  createdAt: string;
  latestMessage?: ChatMessage | null;
  otherParticipantId?: string;
  otherParticipantName?: string;
  otherParticipantRole?: "PATIENT" | "DOCTOR" | "STAFF" | "ADMIN";
  messages: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  appointmentId?: string;
  senderId: string;
  senderName: string | null;
  text: string;
  status: "sent" | "delivered" | "seen";
  seenAt: string | null;
  createdAt: string;
}

export const doctorChatService = {
  /**
   * GET /chat/appointment/:appointmentId
   * Returns existing conversation or creates one.
   */
  getOrCreateConversation(appointmentId: string): Promise<ChatConversation> {
    return apiClient.get<ChatConversation>(`/chat/appointment/${appointmentId}`);
  },

  getConversationByParticipants(
    patientUserId: string,
    doctorUserId: string
  ): Promise<ChatConversation> {
    return apiClient.get<ChatConversation>(
      `/chat/conversation?patientUserId=${encodeURIComponent(
        patientUserId
      )}&doctorUserId=${encodeURIComponent(
        doctorUserId
      )}`
    );
  },

  listConversations(): Promise<ChatConversation[]> {
    return apiClient.get<ChatConversation[]>("/chat/conversations");
  },

  /**
   * GET /chat/:conversationId/messages
   */
  getMessages(conversationId: string): Promise<ChatMessage[]> {
    return apiClient.get<ChatMessage[]>(`/chat/${conversationId}/messages`);
  },

  /**
   * POST /chat/message  (REST fallback)
   */
  sendMessage(conversationId: string, text: string): Promise<ChatMessage> {
    return apiClient.post<ChatMessage>("/chat/message", { conversationId, text });
  },

  markConversationSeen(
    conversationId: string
  ): Promise<{ messageIds: string[]; seenAt: string | null }> {
    return apiClient.patch<{ messageIds: string[]; seenAt: string | null }>(
      `/chat/messages/${conversationId}/seen`
    );
  },
  deleteConversation(conversationId: string): Promise<void> {
    return apiClient.delete(`/chat/conversations/${conversationId}`);
  },
};
