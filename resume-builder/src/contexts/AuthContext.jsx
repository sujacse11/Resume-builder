import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as apiLogin, register as apiRegister, getMe } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount — restore session
  useEffect(() => {
    let cancelled = false;
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        getMe()
          .then(({ data }) => { if (!cancelled) setUser(data); })
          .catch(() => {
            try {
              localStorage.removeItem('access_token');
              localStorage.removeItem('refresh_token');
            } catch {}
          })
          .finally(() => { if (!cancelled) setLoading(false); });
      } else {
        setLoading(false);
      }
    } catch {
      // localStorage not available (e.g. strict-mode browser / sandboxed iframe)
      setLoading(false);
    }
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (credentials) => {
    const { data } = await apiLogin(credentials);
    try {
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
    } catch {}
    setUser(data.user);
    return data;
  }, []);

  const register = useCallback(async (credentials) => {
    const { data } = await apiRegister(credentials);
    try {
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
    } catch {}
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    } catch {}
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
