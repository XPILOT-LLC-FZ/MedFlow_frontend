import { apiClient } from "@/lib/apiClient";
import type { SendWhatsAppPayload, SendWhatsAppResponse } from "@/types";

export const whatsAppService = {
  async send(payload: SendWhatsAppPayload): Promise<SendWhatsAppResponse> {
    return apiClient.post("/whatsapp/send", payload);
  },
};
