import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "../types/index.ts";
import { api } from "../services/api.ts";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<string>;
  register: (email: string, password: string, fullName: string) => Promise<string>;
  demoLogin: () => Promise<string>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("omni_token"));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function initAuth() {
      const savedToken = localStorage.getItem("omni_token");
      if (savedToken) {
        try {
          const res = await api.auth.getMe();
          setUser(res.user);
        } catch {
          // Token expired or invalid
          localStorage.removeItem("omni_token");
          setToken(null);
          setUser(null);
        }
      } else {
        // Auto-seed demo login for frictionless testing
        try {
          const res = await api.auth.login({
            email: "demo@omniresearch.ai",
            password: "password123",
          });
          localStorage.setItem("omni_token", res.token);
          setToken(res.token);
          setUser(res.user);
        } catch {
          // Ignore if demo account not seeded yet
        }
      }
      setLoading(false);
    }
    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<string> => {
    const res = await api.auth.login({ email, password });
    localStorage.setItem("omni_token", res.token);
    setToken(res.token);
    setUser(res.user);
    return res.defaultWorkspaceId;
  };

  const register = async (email: string, password: string, fullName: string): Promise<string> => {
    const res = await api.auth.register({ email, password, fullName });
    localStorage.setItem("omni_token", res.token);
    setToken(res.token);
    setUser(res.user);
    return res.defaultWorkspaceId;
  };

  const demoLogin = async (): Promise<string> => {
    return login("demo@omniresearch.ai", "password123");
  };

  const logout = () => {
    localStorage.removeItem("omni_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, demoLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
