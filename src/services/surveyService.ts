import { apiClient } from "@/lib/apiClient";
import type {
  ApiSurvey,
  RequestSurveyPayload,
  RequestSurveyResponse,
  SubmitSurveyPayload,
  DoctorSurveyStats,
  DoctorReviewsResponse,
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

  async getDoctorStats(): Promise<DoctorSurveyStats> {
    return apiClient.get("/surveys/doctor-stats");
  },

  async getPublicDoctorReviews(doctorId: string): Promise<DoctorReviewsResponse> {
    return apiClient.get(`/surveys/doctor/${doctorId}/reviews`);
  },
  
  async submitDirectReview(payload: { doctorId: string; rating: number; feedback?: string }): Promise<void> {
    return apiClient.post("/surveys/direct", payload);
  },
};
