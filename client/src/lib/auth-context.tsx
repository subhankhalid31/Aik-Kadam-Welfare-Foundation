import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "./api";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "donor" | "volunteer" | "admin";
  isVerified: boolean;
  avatarUrl: string | null;
  volunteerStatus: "none" | "pending" | "approved" | "rejected";
  volunteerRejectionReason: string | null;
  volunteerServedUntil: string | null;
  volunteerCategory: string | null;
  pendingNameChange: string | null;
  badgeId: string | null;
  city: string | null;
  totalHoursContributed: number;
  totalCasesCompleted: number;
};

type AuthState = {
  user: SessionUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const data = await api.get<{ user: SessionUser | null }>("/api/auth/me");
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await api.post("/api/auth/logout");
    setUser(null);
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
