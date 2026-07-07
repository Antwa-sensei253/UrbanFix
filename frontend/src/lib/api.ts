// ============================================================
// UrbanFix API client — matches the C# backend DTOs exactly.
// Base URL is configurable via VITE_API_URL.
// JWT is read from localStorage ("urbanfix_token") on every call.
// ============================================================

export const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, "") ||
  "http://localhost:5000";

const TOKEN_KEY = "urbanfix_token";
const USER_KEY = "urbanfix_user";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export interface StoredUser {
  user_id: number;
  full_name: string;
  role: BackendRole;
}

export function getStoredUser(): StoredUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

export function setStoredUser(user: StoredUser | null) {
  if (typeof window === "undefined") return;
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
}

// ============================================================
// Backend DTOs — kept 1:1 with the C# response shapes.
// ============================================================

export type BackendRole =
  | "Citizen"
  | "Technician"
  | "DistrictManager"
  | "Governor";

export type ReportStatus =
  | "Reported"
  | "Verified"
  | "Assigned"
  | "InProgress"
  | "Resolved"
  | "Rejected";

export type ReportUrgency = "Low" | "Medium" | "High" | "Critical";

export interface ReportResponse {
  id: number;
  citizen_id: number;
  citizen_name: string;
  category: string;
  urgency: ReportUrgency | string;
  latitude: number;
  longitude: number;
  address_description?: string;
  photo_url?: string;
  description: string;
  status: ReportStatus | string;
  technician_id?: number;
  technician_name?: string;
  rejection_reason?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  upvote_count: number;
  has_upvoted: boolean;
}

export interface CommunityReportResponse extends ReportResponse {}

export interface CategoryData {
  id: number;
  name: string;
  default_priority: string;
  sla_hours: number;
}

export interface DistrictData {
  id: number;
  name: string;
}

export interface UserManagementResponse {
  id: number;
  full_name: string;
  national_id: string;
  email?: string;
  role: BackendRole;
  district_id?: number;
  district_name?: string;
  created_at: string;
}

export interface TechnicianResponse {
  id: number;
  full_name: string;
  district_id?: number;
  district_name?: string;
  active_assignments: number;
}

export interface AnalyticsSummaryResponse {
  total_open: number;
  total_resolved: number;
  total_in_progress: number;
  total_critical: number;
  avg_resolution_hours: number;
  by_category: { category: string; count: number }[];
  by_status?: { status: string; count: number }[];
  volume_series?: { date: string; reported: number; resolved: number }[];
}

export interface LoginResponse {
  token: string;
  role: BackendRole;
  user_id: number;
  full_name: string;
}

export interface UpvoteResponse {
  upvote_count: number;
  has_upvoted: boolean;
}

// ============================================================
// Request shapes
// ============================================================

export interface RegisterRequest {
  full_name: string;
  national_id: string;
  password: string;
  email: string;
  role: BackendRole;
  district_id?: number | null;
}

export interface LoginRequest {
  national_id: string;
  password: string;
}

export interface CreateReportRequest {
  category: string;
  urgency: string;
  address_description?: string;
  latitude?: number;
  longitude?: number;
  photo_url?: string;
  photo_base64?: string;
  description: string;
}

export interface VerifyReportRequest {
  is_approved: boolean;
  rejection_reason?: string;
  category?: string;
  is_public?: boolean;
}

export interface AssignReportRequest {
  technician_id: number;
}

export interface UpdateStatusRequest {
  new_status: string;
  photo_url?: string;
}

export interface CreateCategoryRequest {
  name: string;
  default_priority: string;
  sla_hours: number;
}

export interface UpdateUserRoleRequest {
  role: BackendRole;
  district_id?: number | null;
}

// ============================================================
// Low-level fetch wrapper
// ============================================================

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message);
  }
}

type Method = "GET" | "POST" | "PATCH" | "DELETE" | "PUT";

async function request<T>(
  path: string,
  opts: {
    method?: Method;
    body?: unknown;
    auth?: boolean;
    raw?: boolean;
  } = {},
): Promise<T> {
  const { method = "GET", body, auth = true } = opts;
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (res.status === 204) return undefined as T;

  let data: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const msg =
      (data && typeof data === "object" && "message" in data
        ? String((data as { message?: unknown }).message)
        : null) ||
      (typeof data === "string" ? data : null) ||
      `Request failed (${res.status})`;
    throw new ApiError(res.status, msg, data);
  }
  return data as T;
}

// ============================================================
// Endpoints
// ============================================================

export const api = {
  auth: {
    register: (body: RegisterRequest) =>
      request<{ message?: string }>("/api/auth/register", {
        method: "POST",
        body,
        auth: false,
      }),
    verifyOtp: (body: { national_id: string; otp: string }) =>
      request<{ message?: string }>("/api/auth/verify-otp", {
        method: "POST",
        body,
        auth: false,
      }),
    login: (body: LoginRequest) =>
      request<LoginResponse>("/api/auth/login", {
        method: "POST",
        body,
        auth: false,
      }),
    districts: () =>
      request<DistrictData[]>("/api/auth/districts", { auth: false }),
  },
  reports: {
    create: (body: CreateReportRequest) =>
      request<ReportResponse>("/api/reports", { method: "POST", body }),
    all: () => request<ReportResponse[]>("/api/reports"),
    mine: () => request<ReportResponse[]>("/api/reports/mine"),
    community: () =>
      request<CommunityReportResponse[]>("/api/reports/community"),
    upvote: (id: number) =>
      request<UpvoteResponse>(`/api/reports/${id}/upvote`, { method: "POST" }),
    verify: (id: number, body: VerifyReportRequest) =>
      request<ReportResponse>(`/api/reports/${id}/verify`, {
        method: "PATCH",
        body,
      }),
    assign: (id: number, body: AssignReportRequest) =>
      request<ReportResponse>(`/api/reports/${id}/assign`, {
        method: "PATCH",
        body,
      }),
    updateStatus: (id: number, body: UpdateStatusRequest) =>
      request<ReportResponse>(`/api/reports/${id}/status`, {
        method: "PATCH",
        body,
      }),
  },
  analytics: {
    summary: () =>
      request<AnalyticsSummaryResponse>("/api/analytics/summary"),
  },
  categories: {
    all: () => request<CategoryData[]>("/api/categories"),
    create: (body: CreateCategoryRequest) =>
      request<CategoryData>("/api/categories", { method: "POST", body }),
    remove: (id: number) =>
      request<void>(`/api/categories/${id}`, { method: "DELETE" }),
  },
  admin: {
    users: () =>
      request<UserManagementResponse[]>("/api/admin/users"),
    updateUserRole: (id: number, body: UpdateUserRoleRequest) =>
      request<UserManagementResponse>(`/api/admin/users/${id}/role`, {
        method: "PATCH",
        body,
      }),
    createDistrict: (name: string) =>
      request<DistrictData>("/api/admin/districts", {
        method: "POST",
        body: name as unknown as object,
      }),
  },
  users: {
    technicians: () =>
      request<TechnicianResponse[]>("/api/users/technicians"),
  },
};

// ============================================================
// Helpers
// ============================================================

/** Map backend role -> route path. */
export function rolePath(role: BackendRole): string {
  switch (role) {
    case "Citizen":
      return "/reports";
    case "Technician":
      return "/technician";
    case "DistrictManager":
      return "/manager";
    case "Governor":
      return "/governor";
  }
}

export function roleLabel(role: BackendRole): string {
  switch (role) {
    case "DistrictManager":
      return "District Manager";
    default:
      return role;
  }
}
