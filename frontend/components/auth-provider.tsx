"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { AuthUser } from "@/lib/types";

const STORAGE_KEY = "boardwise.session";
type StoredSession = AuthUser & { token: string };
type AuthContextValue = { user: AuthUser | null; token: string | null; isReady: boolean; login: (email: string, password: string) => Promise<void>; register: (email: string, password: string) => Promise<void>; logout: () => void; };
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<StoredSession | null>(null);
  const [isReady, setIsReady] = useState(false);

  const saveSession = useCallback((nextSession: StoredSession | null) => {
    setSession(nextSession);
    if (nextSession) localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
    else localStorage.removeItem(STORAGE_KEY);
  }, []);

  useEffect(() => {
    const restore = async () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const candidate = JSON.parse(saved) as StoredSession;
          const user = await api.me(candidate.token);
          saveSession({ ...user, token: candidate.token });
        } catch { localStorage.removeItem(STORAGE_KEY); }
      }
      setIsReady(true);
    };
    void restore();
  }, [saveSession]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await api.login(email, password);
    const user = await api.me(result.access_token);
    saveSession({ ...user, token: result.access_token });
  }, [saveSession]);

  const register = useCallback(async (email: string, password: string) => {
    await api.register(email, password);
    await login(email, password);
  }, [login]);

  const value = useMemo(() => ({ user: session ? { email: session.email, role: session.role } : null, token: session?.token ?? null, isReady, login, register, logout: () => saveSession(null) }), [isReady, login, register, saveSession, session]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() { const context = useContext(AuthContext); if (!context) throw new Error("useAuth must be used inside AuthProvider."); return context; }
