import React, { createContext, useContext, useEffect, useState } from "react";
import { login as loginApi, register as registerApi, me as meApi } from "../api/auth";
import api from "../api";

type User = { id: string; email: string; name?: string } | null;
type AuthCtx = {
  user: User;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx | undefined>(undefined);
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem("ll_token");
      if (!token) {
        setLoading(false);
        return;
      }
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      try {
        const res = await meApi();
        setUser(res.data.user);
      } catch (err) {
        localStorage.removeItem("ll_token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await loginApi({ email, password });
    const token = res.data.token;
    if (token) {
      localStorage.setItem("ll_token", token);
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
    setUser(res.data.user);
  };

  const register = async (email: string, password: string, name?: string) => {
    await registerApi({ email, password, name });
    await login(email, password);
  };

  const logout = () => {
    localStorage.removeItem("ll_token");
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
  };

  const refreshUser = async () => {
    setLoading(true);
    try {
      const res = await meApi();
      setUser(res.data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};