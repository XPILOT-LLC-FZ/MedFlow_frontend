/**
 * Users Service — Super Admin management of all system users.
 */
import { apiClient } from "@/lib/apiClient";
import type { ApiUser } from "@/types";

export const usersService = {
  async getAll(): Promise<ApiUser[]> {
    return apiClient.get("/users");
  },

  async getById(id: string): Promise<ApiUser> {
    return apiClient.get(`/users/${id}`);
  },

  async update(id: string, data: Partial<ApiUser>): Promise<ApiUser> {
    return apiClient.patch(`/users/${id}`, data);
  },

  async create(data: Partial<ApiUser>): Promise<ApiUser> {
    return apiClient.post("/users", data);
  },

  async remove(id: string): Promise<void> {
    return apiClient.delete(`/users/${id}`);
  },
};
