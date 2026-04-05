import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useMemo,
} from 'react';
import { apiClient } from '../api/client';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
  organization_id?: number;
}

interface AuthContextValue {
  user:          AuthUser | null;
  token:         string | null;
  isLoading:     boolean;
  login:         (email: string, password: string) => Promise<void>;
  logout:        () => Promise<void>;
  setToken:      (token: string) => void;
  permissions:   string[];
  hasPermission: (perm: string) => boolean;
}

// ─────────────────────────────────────────────────────────────
// Role → Permission mapping
// Mirrors the backend seed data. Frontend uses this to gate UI
// elements; authoritative enforcement happens on the server.
// ─────────────────────────────────────────────────────────────
const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin:   ['view_users', 'create_users', 'edit_users', 'delete_users', 'assign_roles', 'view_audit_logs', 'view_analytics'],
  manager: ['view_users', 'create_users', 'edit_users', 'view_audit_logs', 'view_analytics'],
  member:  ['view_users'],
  viewer:  [],
};

// ─────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem('authUser');
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,      setUser]    = useState<AuthUser | null>(readStoredUser);
  const [token,     setTokenState] = useState<string | null>(() => localStorage.getItem('accessToken'));
  const [isLoading, setIsLoading]  = useState(false);

  const permissions = useMemo(
    () => (user ? (ROLE_PERMISSIONS[user.role] ?? []) : []),
    [user]
  );

  const setToken = useCallback((t: string) => {
    localStorage.setItem('accessToken', t);
    setTokenState(t);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await apiClient.post<{
        data: { accessToken: string; user: AuthUser };
      }>('/auth/login', { email, password });

      const { accessToken, user: userData } = res.data.data;

      setToken(accessToken);
      setUser(userData);
      localStorage.setItem('authUser', JSON.stringify(userData));
    } finally {
      setIsLoading(false);
    }
  }, [setToken]);

  const logout = useCallback(async () => {
    try { await apiClient.post('/auth/logout'); } catch { /* ignore */ }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('authUser');
    setTokenState(null);
    setUser(null);
  }, []);

  const hasPermission = useCallback(
    (perm: string) => permissions.includes(perm),
    [permissions]
  );

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, isLoading, login, logout, setToken, permissions, hasPermission }),
    [user, token, isLoading, login, logout, setToken, permissions, hasPermission]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
