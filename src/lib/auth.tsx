"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { User } from "./types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (name: string, code: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthState>({
  user: null,
  isAuthenticated: false,
  login: () => false,
  logout: () => {},
});

// Simple team auth — matches invite codes from DB seed
const TEAM: User[] = [
  { id: "1", name: "Ivan", role: "dispositions", email: "ivan@d4d.com", invite_code: "ivan2024", is_active: true, created_at: "" },
  { id: "2", name: "Bryce", role: "acquisitions", email: "bryce@d4d.com", invite_code: "bryce2024", is_active: true, created_at: "" },
  { id: "3", name: "Jack", role: "owner", email: "jack@d4d.com", invite_code: "jack2024", is_active: true, created_at: "" },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("d4d_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("d4d_user");
      }
    }
  }, []);

  const login = (name: string, code: string): boolean => {
    // Check shared password
    const sharedPass = process.env.NEXT_PUBLIC_APP_PASSWORD || "d4d2024";
    const member = TEAM.find(
      (t) => t.name.toLowerCase() === name.toLowerCase()
    );

    if (member && (code === member.invite_code || code === sharedPass)) {
      setUser(member);
      localStorage.setItem("d4d_user", JSON.stringify(member));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("d4d_user");
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
