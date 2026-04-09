/**
 * Onboarding Service — handles multi-step onboarding questions and answers.
 */
import { apiClient } from "@/lib/apiClient";
import type { Role } from "@/types";

export interface OnboardingQuestion {
  id: string;
  text: string;
  type: "TEXT" | "SELECT" | "MULTI_SELECT" | "BOOLEAN" | "DATE" | "PHONE" | "TEXTAREA";
  options?: string[];
  required: boolean;
  order: number;
  fieldKey: string;
}

function normalizeQuestion(question: Record<string, unknown>): OnboardingQuestion {
  const rawType = String(question.fieldType ?? question.type ?? "text").toLowerCase();
  const mappedType: OnboardingQuestion["type"] =
    rawType === "date"
      ? "DATE"
      : rawType === "phone"
        ? "PHONE"
        : rawType === "textarea" || rawType === "multi-text"
          ? "TEXTAREA"
          : rawType === "multi-select"
            ? "MULTI_SELECT"
            : rawType === "boolean"
              ? "BOOLEAN"
              : rawType === "select"
                ? "SELECT"
                : "TEXT";

  return {
    id: String(question.id ?? question.fieldKey ?? question.questionId ?? crypto.randomUUID()),
    fieldKey: String(question.fieldKey ?? question.id ?? question.questionId ?? ""),
    text: String(question.question ?? question.text ?? ""),
    type: mappedType,
    options: Array.isArray(question.options) ? question.options.map((option) => String(option)) : undefined,
    required: Boolean(question.isRequired ?? question.required ?? false),
    order: Number(question.sortOrder ?? question.order ?? 0),
  };
}

export const onboardingService = {
  async getQuestions(role: Role): Promise<OnboardingQuestion[]> {
    const params = new URLSearchParams({ role });
    const response = await apiClient.get(`/onboarding/questions?${params.toString()}`);
    const questions = Array.isArray(response) ? response : response?.questions;
    return (Array.isArray(questions) ? questions : []).map((question) =>
      normalizeQuestion(question as Record<string, unknown>)
    );
  },

  async submitAnswers(role: Role, answersMap: Record<string, unknown>): Promise<void> {
    const answers = Object.entries(answersMap).map(([questionId, answer]) => ({
      questionId,
      answer: String(answer), // The backend expects a string, primitive types are cast or stringified if needed
    }));
    return apiClient.post("/onboarding/answers", { role, answers });
  },
};
