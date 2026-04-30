import * as React from "react";

export type Role = "Citizen" | "DistrictManager" | "Technician" | "Governor";

export interface AuthUser {
  token: string;
  role: Role;
  user_id: number | string;
  full_name: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (u: AuthUser) => void;
  logout: () => void;
  hydrated: boolean;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "urbanfix_auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  const login = React.useCallback((u: AuthUser) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    setUser(u);
  }, []);

  const logout = React.useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, hydrated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export const API_BASE = "http://localhost:5000/api";

export function roleHome(role: Role): string {
  switch (role) {
    case "Citizen":
      return "/citizen";
    case "DistrictManager":
      return "/manager";
    case "Technician":
      return "/technician";
    case "Governor":
      return "/governor";
  }
}

async function handleUnauthorized() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  try {
    const { toast } = await import("sonner");
    toast.error("Session expired, please log in again.");
  } catch {
    // ignore
  }
  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

export async function apiFetch(path: string, token: string | undefined, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (res.status === 401) {
    await handleUnauthorized();
    throw new Error("Session expired");
  }
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      msg = data.message || data.error || msg;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }
  if (res.status === 204) return null;
  return res.json();
}
