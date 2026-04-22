import { apiClient } from "@/lib/apiClient";
import type { InAppNotification, ApiNotificationTemplate, ClinicSettings } from "@/types";

export type { InAppNotification };

export type ReceptionInboxMessage = {
  id: string;
  patientId: string | null;
  phoneNumber: string;
  messageText: string;
  status: "NEW" | "ASSIGNED" | "RESOLVED";
  assignedDoctorUserId: string | null;
  receivedAt: string;
};

class NotificationsService {
  async getInAppNotifications(params?: {
    unreadOnly?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<InAppNotification[]> {
    return apiClient.get<InAppNotification[]>("/notifications/in-app", { params });
  }

  async markInAppRead(id: string): Promise<void> {
    await apiClient.patch(`/notifications/in-app/${id}/read`);
  }

  async getReceptionInbox(params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<ReceptionInboxMessage[]> {
    return apiClient.get<ReceptionInboxMessage[]>("/notifications/reception-inbox", { params });
  }

  async assignReceptionInbox(id: string, assignedDoctorUserId: string): Promise<void> {
    await apiClient.patch(`/notifications/reception-inbox/${id}/assign`, { assignedDoctorUserId });
  }

  async resolveReceptionInbox(id: string): Promise<void> {
    await apiClient.patch(`/notifications/reception-inbox/${id}/resolve`);
  }

  async replyToReceptionInbox(id: string, message: string): Promise<void> {
    await apiClient.post(`/notifications/reception-inbox/${id}/reply`, { message });
  }

  async getTemplates(): Promise<ApiNotificationTemplate[]> {
    return apiClient.get<ApiNotificationTemplate[]>("/notifications/templates");
  }

  async upsertTemplate(data: Partial<ApiNotificationTemplate>): Promise<void> {
    await apiClient.post("/notifications/templates", data);
  }

  async updateSettings(data: ClinicSettings): Promise<void> {
    await apiClient.patch("/notifications/settings", data);
  }
}

export const notificationsService = new NotificationsService();
