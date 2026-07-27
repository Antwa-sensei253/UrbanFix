// ============================================================
// UrbanFix API client — completely mocked for zero-cost static deployment.
// ============================================================

import { db, delay } from "./mock-data";

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

export type BackendRole = "Citizen" | "Technician" | "DistrictManager" | "Governor";
export type ReportStatus = "Reported" | "Verified" | "Assigned" | "InProgress" | "Resolved" | "Rejected";
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
  latitude?: number;
  longitude?: number;
  radius_km?: number;
  boundaries_description?: string;
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

export class ApiError extends Error {
  constructor(public status: number, message: string, public body?: unknown) {
    super(message);
  }
}

// ============================================================
// Mock Endpoints
// ============================================================

function enrichReport(r: ReportResponse): ReportResponse {
  const user = getStoredUser();
  const upvotes = db.get("upvotes") || {};
  const reportUpvotes = upvotes[r.id] || [];
  return {
    ...r,
    has_upvoted: user ? reportUpvotes.includes(user.user_id) : r.has_upvoted,
  };
}

export const api = {
  auth: {
    register: async (body: RegisterRequest) => {
      await delay(600);
      const users = db.get("users");
      if (users.find((u) => u.national_id === body.national_id)) {
        throw new ApiError(400, "National ID already exists");
      }
      const newUser: UserManagementResponse = {
        id: Date.now(),
        full_name: body.full_name,
        national_id: body.national_id,
        email: body.email,
        role: body.role,
        district_id: body.district_id || undefined,
        district_name: body.district_id ? db.get("districts").find(d => d.id === body.district_id)?.name : undefined,
        created_at: new Date().toISOString(),
      };
      db.set("users", [...users, newUser]);
      return { message: "Created successfully" };
    },
    verifyOtp: async () => {
      await delay(400);
      return { message: "Verified" };
    },
    login: async (body: LoginRequest): Promise<LoginResponse> => {
      await delay(500);
      if (body.password !== "Pass123") {
        throw new ApiError(401, "Invalid password. Use 'Pass123' for the demo.");
      }
      const user = db.get("users").find((u) => u.national_id === body.national_id);
      if (!user) {
        throw new ApiError(404, "User not found");
      }
      return {
        token: `mock_token_${user.id}`,
        role: user.role,
        user_id: user.id,
        full_name: user.full_name,
      };
    },
    districts: async () => {
      await delay(200);
      return db.get("districts");
    },
  },
  reports: {
    create: async (body: CreateReportRequest): Promise<ReportResponse> => {
      await delay(800);
      const currentUser = getStoredUser();
      if (!currentUser) throw new ApiError(401, "Unauthorized");

      const newReport: ReportResponse = {
        id: Date.now(),
        citizen_id: currentUser.user_id,
        citizen_name: currentUser.full_name,
        category: body.category,
        urgency: body.urgency,
        latitude: body.latitude || 30.0444,
        longitude: body.longitude || 31.2357,
        address_description: body.address_description,
        photo_url: body.photo_url || body.photo_base64,
        description: body.description,
        status: "Reported",
        is_public: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        upvote_count: 0,
        has_upvoted: false,
      };
      db.set("reports", [newReport, ...db.get("reports")]);
      return newReport;
    },
    all: async (): Promise<ReportResponse[]> => {
      await delay(300);
      return db.get("reports").map(enrichReport);
    },
    mine: async (): Promise<ReportResponse[]> => {
      await delay(300);
      const currentUser = getStoredUser();
      if (!currentUser) return [];
      return db.get("reports")
        .filter((r) => r.citizen_id === currentUser.user_id)
        .map(enrichReport);
    },
    community: async (): Promise<CommunityReportResponse[]> => {
      await delay(300);
      return db.get("reports")
        .filter((r) => r.is_public)
        .map(enrichReport);
    },
    liked: async (): Promise<ReportResponse[]> => {
      await delay(300);
      const currentUser = getStoredUser();
      if (!currentUser) return [];
      const upvotes = db.get("upvotes") || {};
      return db.get("reports")
        .filter((r) => (upvotes[r.id] || []).includes(currentUser.user_id))
        .map(enrichReport);
    },
    upvote: async (id: number): Promise<UpvoteResponse> => {
      await delay(50);
      const user = getStoredUser();
      if (!user) throw new ApiError(401, "Unauthorized");
      
      const upvotes: Record<number, number[]> = db.get("upvotes") || {};
      const reportUpvotes = upvotes[id] || [];
      const hasUpvoted = reportUpvotes.includes(user.user_id);
      
      let newCount = 0;
      let newHasUpvoted = !hasUpvoted;

      if (newHasUpvoted) {
        upvotes[id] = [...reportUpvotes, user.user_id];
      } else {
        upvotes[id] = reportUpvotes.filter((uid) => uid !== user.user_id);
      }
      db.set("upvotes", upvotes);

      db.updateReport(id, (r) => {
        newCount = Math.max(0, r.upvote_count + (newHasUpvoted ? 1 : -1));
        return {
          upvote_count: newCount,
          has_upvoted: newHasUpvoted,
        };
      });

      return { upvote_count: newCount, has_upvoted: newHasUpvoted };
    },
    verify: async (id: number, body: VerifyReportRequest): Promise<ReportResponse> => {
      await delay(400);
      return db.updateReport(id, () => ({
        status: body.is_approved ? "Verified" : "Rejected",
        rejection_reason: body.rejection_reason,
        category: body.category,
        is_public: body.is_public,
      }));
    },
    assign: async (id: number, body: AssignReportRequest): Promise<ReportResponse> => {
      await delay(400);
      const tech = db.get("users").find((u) => u.id === body.technician_id);
      return db.updateReport(id, () => ({
        status: "Assigned",
        technician_id: body.technician_id,
        technician_name: tech?.full_name,
      }));
    },
    updateStatus: async (id: number, body: UpdateStatusRequest): Promise<ReportResponse> => {
      await delay(400);
      return db.updateReport(id, () => ({
        status: body.new_status,
        photo_url: body.photo_url,
      }));
    },
  },
  analytics: {
    summary: async (): Promise<AnalyticsSummaryResponse> => {
      await delay(500);
      const reports = db.get("reports");
      return {
        total_open: reports.filter((r) => r.status !== "Resolved" && r.status !== "Rejected").length,
        total_resolved: reports.filter((r) => r.status === "Resolved").length,
        total_in_progress: reports.filter((r) => r.status === "InProgress").length,
        total_critical: reports.filter((r) => r.urgency === "Critical" || r.urgency === "critical").length,
        avg_resolution_hours: 12.5,
        by_category: [
          { category: "Pothole", count: reports.filter((r) => r.category === "Pothole").length },
          { category: "Streetlight", count: reports.filter((r) => r.category === "Streetlight").length },
          { category: "Water leak", count: reports.filter((r) => r.category === "Water leak").length },
        ],
      };
    },
  },
  categories: {
    all: async (): Promise<CategoryData[]> => {
      await delay(200);
      return db.get("categories");
    },
    create: async (body: CreateCategoryRequest): Promise<CategoryData> => {
      await delay(400);
      const newCat: CategoryData = { id: Date.now(), ...body };
      db.set("categories", [...db.get("categories"), newCat]);
      return newCat;
    },
    remove: async (id: number): Promise<void> => {
      await delay(400);
      db.set("categories", db.get("categories").filter((c) => c.id !== id));
    },
  },
  admin: {
    users: async (): Promise<UserManagementResponse[]> => {
      await delay(300);
      return db.get("users");
    },
    updateUserRole: async (id: number, body: UpdateUserRoleRequest): Promise<UserManagementResponse> => {
      await delay(400);
      const users = db.get("users");
      const idx = users.findIndex((u) => u.id === id);
      if (idx === -1) throw new ApiError(404, "User not found");
      users[idx] = {
        ...users[idx],
        role: body.role,
        district_id: body.district_id || undefined,
        district_name: body.district_id ? db.get("districts").find((d) => d.id === body.district_id)?.name : undefined,
      };
      db.set("users", users);
      return users[idx];
    },
    createDistrict: async (
      name: string,
      latitude?: number,
      longitude?: number,
      radius_km?: number,
      boundaries_description?: string,
    ): Promise<DistrictData> => {
      await delay(300);
      const dist: DistrictData = {
        id: Date.now(),
        name,
        latitude: latitude ?? 30.0444,
        longitude: longitude ?? 31.2357,
        radius_km: radius_km ?? 5.0,
        boundaries_description:
          boundaries_description ?? "Standard municipal sector boundary.",
      };
      db.set("districts", [...db.get("districts"), dist]);
      return dist;
    },
    updateDistrict: async (
      id: number,
      data: Partial<DistrictData>,
    ): Promise<DistrictData> => {
      await delay(300);
      const dists = db.get("districts");
      const idx = dists.findIndex((d) => d.id === id);
      if (idx === -1) throw new ApiError(404, "District not found");
      dists[idx] = { ...dists[idx], ...data };
      db.set("districts", dists);
      return dists[idx];
    },
  },
  users: {
    technicians: async (): Promise<TechnicianResponse[]> => {
      await delay(200);
      return db.get("users")
        .filter((u) => u.role === "Technician")
        .map((t) => ({
          id: t.id,
          full_name: t.full_name,
          district_id: t.district_id,
          district_name: t.district_name,
          active_assignments: db.get("reports").filter((r) => r.technician_id === t.id && r.status !== "Resolved").length,
        }));
    },
  },
};

export function rolePath(role: BackendRole): string {
  switch (role) {
    case "Citizen": return "/reports";
    case "Technician": return "/technician";
    case "DistrictManager": return "/manager";
    case "Governor": return "/governor";
  }
}

export function roleLabel(role: BackendRole): string {
  switch (role) {
    case "DistrictManager": return "District Manager";
    default: return role;
  }
}
