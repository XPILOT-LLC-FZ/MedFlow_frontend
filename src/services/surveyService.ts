import { apiClient } from "@/lib/apiClient";
import type {
  ApiSurvey,
  RequestSurveyPayload,
  RequestSurveyResponse,
  SubmitSurveyPayload,
} from "@/types";

export const surveyService = {
  async requestFeedback(payload: RequestSurveyPayload): Promise<RequestSurveyResponse> {
    return apiClient.post("/surveys/request", payload);
  },

  async getMySurveys(): Promise<ApiSurvey[]> {
    return apiClient.get("/surveys/my");
  },

  async submitSurvey(
    surveyId: string,
    payload: SubmitSurveyPayload,
  ): Promise<ApiSurvey> {
    return apiClient.patch(`/surveys/${surveyId}/submit`, payload);
  },
};
