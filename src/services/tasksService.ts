import { apiClient } from "@/lib/apiClient";
import {
  ApiQuickTask,
  CreateQuickTaskPayload,
  UpdateQuickTaskPayload,
  QuickTaskListFilters,
} from "@/types";

const toQueryString = (filters?: QuickTaskListFilters) => {
  if (!filters) return "";
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
};

export const tasksService = {
  async getAll(filters?: QuickTaskListFilters): Promise<ApiQuickTask[]> {
    return apiClient.get(`/tasks${toQueryString(filters)}`);
  },

  async getById(id: string): Promise<ApiQuickTask> {
    return apiClient.get(`/tasks/${id}`);
  },

  async create(data: CreateQuickTaskPayload): Promise<ApiQuickTask> {
    return apiClient.post("/tasks", data);
  },

  async update(id: string, data: UpdateQuickTaskPayload): Promise<ApiQuickTask> {
    return apiClient.patch(`/tasks/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/tasks/${id}`);
  },
};
