/**
 * Users Service — Super Admin management of all system users.
 */
import { apiClient } from "@/lib/apiClient";
import type { ApiUser } from "@/types";

type UserListFilters = Record<string, string | number | boolean | null | undefined>;

type RawUserRecord = {
  id?: string;
  name?: string;
  fullName?: string;
  email?: string;
  role?: ApiUser["role"];
  clinicId?: string | null;
  isActive?: boolean;
  createdAt?: string;
  avatar?: string;
  avatarUrl?: string | null;
  phone?: string;
};

const toQueryString = (filters?: UserListFilters) => {
  if (!filters) return "";

  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.set(key, String(value));
  });

  const query = params.toString();
  return query ? `?${query}` : "";
};

const normalizeUser = (input: RawUserRecord): ApiUser => {
  const role = input.role ?? "PATIENT";

  return {
    id: input.id ?? "",
    name: input.name ?? input.fullName ?? "Unknown User",
    email: input.email ?? "",
    role,
    phone: input.phone,
    avatar:
      typeof input.avatar === "string"
        ? input.avatar
        : typeof input.avatarUrl === "string"
          ? input.avatarUrl
          : undefined,
    clinicId: input.clinicId ?? undefined,
    isActive: input.isActive !== false,
    createdAt: input.createdAt ?? new Date(0).toISOString(),
  };
};

const normalizeListResponse = (response: unknown): ApiUser[] => {
  if (Array.isArray(response)) {
    return response.map((row) => normalizeUser((row ?? {}) as RawUserRecord));
  }

  if (typeof response === "object" && response !== null) {
    const record = response as { data?: unknown };
    if (Array.isArray(record.data)) {
      return record.data.map((row) => normalizeUser((row ?? {}) as RawUserRecord));
    }
  }

  return [];
};

const mapUpdatePayload = (data: Partial<ApiUser>): Record<string, unknown> => {
  const payload: Record<string, unknown> = {};
  const raw = data as Record<string, unknown>;

  if (typeof raw["fullName"] === "string" && (raw["fullName"] as string).trim().length > 0) {
    payload.fullName = (raw["fullName"] as string).trim();
  } else if (typeof data.name === "string" && data.name.trim().length > 0) {
    payload.fullName = data.name.trim();
  }

  if (typeof data.role === "string") {
    payload.role = data.role;
  }

  if (typeof raw["isActive"] === "boolean") {
    payload.isActive = raw["isActive"] as boolean;
  }

  if (raw["clinicId"] === null || typeof raw["clinicId"] === "string") {
    payload.clinicId = raw["clinicId"] as string | null;
  }

  return payload;
};

const mapCreatePayload = (data: Record<string, unknown>): Record<string, unknown> => {
  const payload: Record<string, unknown> = {};

  if (typeof data["fullName"] === "string" && (data["fullName"] as string).trim().length > 0) {
    payload.fullName = (data["fullName"] as string).trim();
  } else if (typeof data["name"] === "string" && (data["name"] as string).trim().length > 0) {
    payload.fullName = (data["name"] as string).trim();
  }

  if (typeof data["email"] === "string" && (data["email"] as string).trim().length > 0) {
    payload.email = (data["email"] as string).trim();
  }

  if (typeof data["password"] === "string" && (data["password"] as string).length > 0) {
    payload.password = data["password"] as string;
  }

  if (typeof data["role"] === "string") {
    payload.role = data["role"] as string;
  }

  if (data["clinicId"] === null || typeof data["clinicId"] === "string") {
    payload.clinicId = data["clinicId"] as string | null;
  }

  return payload;
};

export const usersService = {
  async getAll(filters?: UserListFilters): Promise<ApiUser[]> {
    const response = await apiClient.get<unknown>(`/users${toQueryString(filters)}`);
    return normalizeListResponse(response);
  },

  async getById(id: string): Promise<ApiUser> {
    const response = await apiClient.get<RawUserRecord>(`/users/${id}`);
    return normalizeUser(response ?? {});
  },

  async update(id: string, data: Partial<ApiUser>): Promise<ApiUser> {
    const response = await apiClient.patch<RawUserRecord>(
      `/users/${id}`,
      mapUpdatePayload(data),
    );
    return normalizeUser(response ?? {});
  },

  async create(data: Record<string, unknown>): Promise<ApiUser> {
    const response = await apiClient.post<RawUserRecord>(
      "/users",
      mapCreatePayload(data),
    );
    return normalizeUser(response ?? {});
  },

  async remove(id: string): Promise<void> {
    return apiClient.delete(`/users/${id}`);
  },
};
