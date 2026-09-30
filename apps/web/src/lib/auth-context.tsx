import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, AUTH_EXPIRED_EVENT } from './api-client.js';
import { tokenStorage } from './token-storage.js';
import type { CurrentUser, LoginResponse } from '../types/api.js';

interface AuthContextValue {
  user: CurrentUser | null;
  status: 'loading' | 'authenticated' | 'anonymous';
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'anonymous'>('loading');

  const loadCurrentUser = useCallback(async () => {
    if (!tokenStorage.getAccessToken()) {
      setStatus('anonymous');
      return;
    }
    try {
      const me = await api.get<CurrentUser>('/users/me');
      setUser(me);
      setStatus('authenticated');
    } catch {
      tokenStorage.clear();
      setUser(null);
      setStatus('anonymous');
    }
  }, []);

  useEffect(() => {
    void loadCurrentUser();

    const onExpired = () => {
      setUser(null);
      setStatus('anonymous');
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, [loadCurrentUser]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.post<LoginResponse>('/auth/login', { email, password }, { skipAuth: true });
    tokenStorage.setTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
    setStatus('authenticated');
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = tokenStorage.getRefreshToken();
    tokenStorage.clear();
    setUser(null);
    setStatus('anonymous');
    if (refreshToken) {
      // Best-effort — the user is logged out locally regardless of whether
      // this call succeeds.
      await api.post('/auth/logout', { refreshToken }, { skipAuth: true }).catch(() => undefined);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, status, login, logout, refreshUser: loadCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
