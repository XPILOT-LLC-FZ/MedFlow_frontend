/**
 * Onboarding Service — handles multi-step onboarding questions and answers.
 */
import { apiClient } from "@/lib/apiClient";
import type { Role } from "@/types";

export interface OnboardingQuestion {
  id: string;
  text: string;
  type: "TEXT" | "SELECT" | "MULTI_SELECT" | "BOOLEAN";
  options?: string[];
  required: boolean;
  order: number;
}

export const onboardingService = {
  async getQuestions(role: Role): Promise<OnboardingQuestion[]> {
    const params = new URLSearchParams({ role });
    return apiClient.get(`/onboarding/questions?${params.toString()}`);
  },

  async submitAnswers(answers: Record<string, unknown>): Promise<void> {
    return apiClient.post("/onboarding/answers", { answers });
  },
};
