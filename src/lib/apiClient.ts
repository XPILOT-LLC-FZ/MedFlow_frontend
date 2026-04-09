/**
 * MedFlow API Client
 * A singleton fetch wrapper with automatic token injection and 401 auto-refresh.
 */

import { useAuthStore } from "@/stores/useAuthStore";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_BASE_URL) {
  console.warn("NEXT_PUBLIC_API_URL is not defined in environment variables.");
}

type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

interface RequestOptions extends RequestInit {
  data?: unknown;
}

class ApiClient {
  private static instance: ApiClient;
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];
  private lastKnownClinicId: string | null = null;

  private constructor() {}

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }
  
  /** 
   * Simple JWT decoder to extract claims without heavy dependencies.
   */
  private decodeToken(token: string): any {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload =
        typeof window === "undefined"
          ? Buffer.from(base64, "base64").toString()
          : decodeURIComponent(
              atob(base64)
                .split("")
                .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                .join("")
            );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }

  private isAuthEndpoint(endpointOrUrl: string): boolean {
    return (
      endpointOrUrl.includes("/auth/login") ||
      endpointOrUrl.includes("/auth/register") ||
      endpointOrUrl.includes("/auth/oauth/google") ||
      endpointOrUrl.includes("/auth/refresh")
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async request<T = any>(endpoint: string, method: HttpMethod, options: RequestOptions = {}, attempt = 0): Promise<T> {
    const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;
    
    // Get access token from Zustand store
    const state = useAuthStore.getState();
    const token = state.accessToken;

    const headers = new Headers(options.headers);
    headers.set("Content-Type", "application/json");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    // Inject clinic context if available
    let clinicId = state.user?.clinicId || this.lastKnownClinicId;
    
    // Fallback: Try to extract from JWT if state.user is not yet hydrated or missing the ID
    if (!clinicId && token) {
      const decoded = this.decodeToken(token);
      clinicId = decoded?.clinicId || decoded?.clinic_id || decoded?.tenantId || decoded?.cid;
    }

    // Demo/Development Fallback: If still missing, we might use a default if it's a known non-super-admin request
    // This unblocks patients in a demo environment where they aren't yet assigned to a clinic.
    if (!clinicId && state.isAuthenticated && state.user?.role !== "SUPER_ADMIN") {
      // For demo, we might want to default to a known clinic if available
      // clinicId = "default-clinic-id"; 
    }

    if (clinicId) {
      headers.set("x-clinic-id", clinicId);
      if (!this.lastKnownClinicId) this.lastKnownClinicId = clinicId;
    }

    const config: RequestInit = {
      ...options,
      method,
      headers,
      credentials: "include",
    };

    if (options.data) {
      config.body = JSON.stringify(options.data);
    }

    try {
      const response = await fetch(url, config);

      if (response.status === 401 && !this.isAuthEndpoint(endpoint)) {
        // Handle 401 Unauthorized - attempt to refresh token
        return this.handleUnauthorized(url, method, options);
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const code = typeof errorData?.code === "string" ? errorData.code : "";
        const message = errorData.message || `Request failed with status ${response.status}`;

        if (
          typeof window !== "undefined" &&
          response.status === 403 &&
          (code === "ONBOARDING_REQUIRED" ||
            (typeof message === "string" && message.toLowerCase().includes("onboarding")))
        ) {
          const path = window.location.pathname;
          const isAuthPage = path.startsWith("/login") || path.startsWith("/signup");
          if (!isAuthPage && !path.startsWith("/onboarding")) {
            window.location.href = "/onboarding";
          }
          throw new Error("Onboarding required");
        }

        // Recovery path: if clinic context is missing, try to hydrate clinicId from /auth/me once.
        if (
          attempt === 0 &&
          typeof message === "string" &&
          message.toLowerCase().includes("clinic context missing") &&
          endpoint !== "/auth/me"
        ) {
          const recovered = await this.hydrateClinicContext(token);
          if (recovered) {
            return this.request<T>(endpoint, method, options, attempt + 1);
          }
        }

        throw new Error(message);
      }

      // Handle 204 No Content
      if (response.status === 204) return null as T;

      const rawJson = await response.json();
      
      // Sniff for clinic context in the response to unblock future requests
      if (!this.lastKnownClinicId) {
        const sniffedId = this.findClinicId(rawJson);
        if (sniffedId) {
          this.lastKnownClinicId = sniffedId;
        }
      }

      // Unwrap global response format if present
      if (rawJson && typeof rawJson === "object" && "success" in rawJson && "data" in rawJson) {
        if (!rawJson.success) {
          throw new Error(rawJson.message || "API request failed");
        }
        return rawJson.data as T;
      }
      
      return rawJson as T;
    } catch (error) {
      const isClinicContextError =
        error instanceof Error &&
        typeof error.message === "string" &&
        error.message.toLowerCase().includes("clinic context missing");

      const isMissingPatientProfile =
        error instanceof Error &&
        typeof error.message === "string" &&
        error.message.toLowerCase().includes("patient profile not found");

      if (endpoint === "/auth/refresh" || endpoint === "/auth/me") {
        // Silently log boot session failures to reduce console noise
        console.warn(`Session check skipped [${method} ${url}]`);
      } else if (isClinicContextError) {
        // This can happen transiently before clinic assignment/onboarding is complete.
        console.warn(`Clinic context not ready [${method} ${url}]`);
      } else if (isMissingPatientProfile && endpoint === "/patients/me") {
        // Normal for first-time patient accounts before patient profile materialization.
        console.warn(`Patient profile not initialized yet [${method} ${url}]`);
      } else {
        console.error(`API Request Error [${method} ${url}]:`, error);
      }
      throw error;
    }
  }

  private async handleUnauthorized(url: string, method: HttpMethod, options: RequestOptions) {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      
      try {
        const state = useAuthStore.getState();
        const currentRefreshToken = state.refreshToken;

        if (!currentRefreshToken) throw new Error("No refresh token available");

        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ refreshToken: currentRefreshToken }),
        });

        if (refreshResponse.ok) {
          const rawData = await refreshResponse.json();
          const data = (rawData && typeof rawData === "object" && "success" in rawData && "data" in rawData) ? rawData.data : rawData;
          
          const token = data.access_token || data.accessToken;
          const newRefreshToken = data.refresh_token || data.refreshToken;
          
          if (!token) throw new Error("No token in refresh response");

          // Update the Zustand store
          useAuthStore.setState({
            accessToken: token,
            refreshToken: newRefreshToken ?? currentRefreshToken,
            isAuthenticated: true,
          });

          // Sync cookie for middleware
          if (typeof document !== "undefined") {
            document.cookie = `clinic-os-auth=${token}; path=/; max-age=604800; SameSite=Lax`;
          }

          this.isRefreshing = false;
          this.onTokenRefreshed(token);
          
          // Retry the original request
          return this.request(url, method, options);
        } else {
          throw new Error("Session expired");
        }
      } catch (refreshError) {
        this.isRefreshing = false;
        // Clear auth state and redirect to login
        if (typeof document !== "undefined") {
          document.cookie = "clinic-os-auth=; path=/; max-age=0;";
        }
        useAuthStore.setState({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
        if (typeof window !== "undefined") {
          const path = window.location.pathname;
          const isAuthPage = path.startsWith("/login") || path.startsWith("/signup");
          if (!isAuthPage) {
            window.location.href = "/login";
          }
        }
        throw refreshError;
      }
    }

    // If already refreshing, wait for the token and retry
    return new Promise((resolve, reject) => {
      this.subscribeTokenRefresh(() => {
        this.request(url, method, options).then(resolve).catch(reject);
      });
    });
  }

  private async hydrateClinicContext(token: string | null): Promise<boolean> {
    if (!token) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (!response.ok) return false;

      const rawJson = await response.json().catch(() => null);
      if (!rawJson) return false;

      const data =
        rawJson && typeof rawJson === "object" && "success" in rawJson && "data" in rawJson
          ? rawJson.data
          : rawJson;

      const clinicId = this.findClinicId(data);
      if (!clinicId) return false;

      this.lastKnownClinicId = clinicId;

      const state = useAuthStore.getState();
      if (state.user && state.user.clinicId !== clinicId) {
        useAuthStore.setState({
          user: {
            ...state.user,
            clinicId,
          },
        });
      }

      return true;
    } catch {
      return false;
    }
  }

  private subscribeTokenRefresh(cb: (token: string) => void) {
    this.refreshSubscribers.push(cb);
  }

  private onTokenRefreshed(token: string) {
    this.refreshSubscribers.forEach((cb) => cb(token));
    this.refreshSubscribers = [];
  }

  private findClinicId(obj: any): string | null {
    if (!obj || typeof obj !== "object") return null;
    
    // Check common fields
    const id = obj.clinicId || obj.clinic_id || obj.tenantId || obj.tenant_id || obj.cid;
    if (id && typeof id === "string") return id;

    // Check nested objects (limit depth)
    if (obj.clinic && obj.clinic.id) return obj.clinic.id;

    // If array, check first item
    if (Array.isArray(obj) && obj.length > 0) {
      return this.findClinicId(obj[0]);
    }
    
    // Check data property for wrapped responses
    if (obj.data) return this.findClinicId(obj.data);

    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public get<T = any>(endpoint: string, options?: Omit<RequestOptions, "data">): Promise<T> {
    return this.request<T>(endpoint, "GET", options);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public post<T = any>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, "POST", { ...options, data });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public patch<T = any>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, "PATCH", { ...options, data });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public put<T = any>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, "PUT", { ...options, data });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public delete<T = any>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, "DELETE", options);
  }
}

export const apiClient = ApiClient.getInstance();
