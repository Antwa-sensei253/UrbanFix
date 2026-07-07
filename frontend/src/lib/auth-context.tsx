import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  api,
  getStoredUser,
  getToken,
  setStoredUser,
  setToken,
  type BackendRole,
  type LoginRequest,
  type StoredUser,
} from "./api";

interface AuthState {
  user: StoredUser | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (body: LoginRequest) => Promise<StoredUser>;
  logout: () => void;
  hasRole: (role: BackendRole | BackendRole[]) => boolean;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getStoredUser());
    setTokenState(getToken());
    setLoading(false);
  }, []);

  const login = useCallback(async (body: LoginRequest) => {
    const res = await api.auth.login(body);
    const u: StoredUser = {
      user_id: res.user_id,
      full_name: res.full_name,
      role: res.role,
    };
    setToken(res.token);
    setStoredUser(u);
    setTokenState(res.token);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setStoredUser(null);
    setTokenState(null);
    setUser(null);
  }, []);

  const hasRole = useCallback(
    (role: BackendRole | BackendRole[]) => {
      if (!user) return false;
      return Array.isArray(role) ? role.includes(user.role) : user.role === role;
    },
    [user],
  );

  const value = useMemo<AuthState>(
    () => ({
      user,
      token,
      isAuthenticated: !!token && !!user,
      loading,
      login,
      logout,
      hasRole,
    }),
    [user, token, loading, login, logout, hasRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
