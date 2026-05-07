import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, setAuthToken } from '../api/client';
import { clearStoredToken, readStoredToken, writeStoredToken } from './roleStore';
import { AuthContext, type AuthUser } from './roleContext';
import type { Permission } from './permissions';

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => readStoredToken());
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  const refresh = useCallback(async () => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const me = await api.me();
      setUser(me);
    } catch {
      clearStoredToken();
      setAuthToken(null);
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void Promise.resolve().then(refresh);
  }, [refresh]);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const result = await api.login(username, password);
      writeStoredToken(result.token);
      setAuthToken(result.token);
      setToken(result.token);
      setUser(result.user);
      return true;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // Local logout still clears the session when backend is unavailable.
    }
    clearStoredToken();
    setAuthToken(null);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      logout,
      refresh,
      hasPermission: (permission: Permission) => Boolean(user?.permissions.includes(permission)),
    }),
    [loading, login, logout, refresh, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
