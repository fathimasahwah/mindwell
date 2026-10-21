import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, hasToken, setToken } from '../api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(hasToken());

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    if (!hasToken()) return;
    api
      .get('/auth/me')
      .then((d) => setUser(d.user))
      .catch(() => logout())
      .finally(() => setLoading(false));
  }, [logout]);

  const authenticate = useCallback(async (path, body) => {
    const data = await api.post(path, body);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const login = useCallback((email, password) => authenticate('/auth/login', { email, password }), [authenticate]);
  const register = useCallback(
    (name, email, password) => authenticate('/auth/register', { name, email, password }),
    [authenticate]
  );
  const setPremium = useCallback((isPremium) => setUser((u) => (u ? { ...u, isPremium } : u)), []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, setPremium }),
    [user, loading, login, register, logout, setPremium]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
