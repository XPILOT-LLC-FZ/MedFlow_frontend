import { apiClient } from "@/lib/apiClient";

export interface ChatResponse {
  conversationId: string;
  message: string;
}

export const aiChatService = {
  async sendMessage(message: string, conversationId?: string, language?: string): Promise<ChatResponse> {
    const response = await apiClient.post<ChatResponse>('/ai/chat', { message, conversationId, language });
    return response;
  }
};
