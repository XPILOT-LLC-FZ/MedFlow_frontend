import { apiClient } from "@/lib/apiClient";
import type {
  CreateDiagnosticReportPayload,
  SendDiagnosticReportResponse,
} from "@/types";

export const patientReportService = {
  async generateAndSendDiagnosticReport(
    patientId: string,
    payload: CreateDiagnosticReportPayload,
  ): Promise<SendDiagnosticReportResponse> {
    return apiClient.post(
      `/patients/${patientId}/reports/diagnostic/send-whatsapp`,
      payload,
    );
  },
};
