import { apiClient } from "@/lib/apiClient";

export interface ChatResponse {
  conversationId: string;
  message: string;
}

export interface AiMedicalSummaryResponse {
  appointmentId: string;
  summary: string;
  format: "brief" | "detailed" | "clinical";
  language: "en" | "ar";
  saved: boolean;
  sendToPatient: boolean;
}

export const aiChatService = {
  async sendMessage(message: string, conversationId?: string, language?: string): Promise<ChatResponse> {
    const response = await apiClient.post<ChatResponse>('/ai/chat', { message, conversationId, language });
    return response;
  },

  async generateMedicalSummary(payload: {
    appointmentId: string;
    consultationNotes?: string;
    format?: "brief" | "detailed" | "clinical";
    language?: "en" | "ar";
    sendToPatient?: boolean;
    saveSummary?: boolean;
  }): Promise<AiMedicalSummaryResponse> {
    return apiClient.post<AiMedicalSummaryResponse>("/ai/summary", payload);
  },
};
