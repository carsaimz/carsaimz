'use client';

import React, { createContext, useContext, useCallback, useMemo, type ReactNode } from 'react';
import {
  useAuthStore,
  type User,
  type UserRole,
  DEMO_USERS,
} from '@/lib/store';

// ──────────────────────────────────────────────
// Context Interface
// ──────────────────────────────────────────────

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isPartner: boolean;
  isUser: boolean;
  login: (email: string, password: string) => boolean;
  loginAsDemo: (role: UserRole) => void;
  logout: () => void;
  register: (name: string, email: string, password: string) => boolean;
  updateAvatar: (avatar: string) => void;
}

// ──────────────────────────────────────────────
// Context
// ──────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ──────────────────────────────────────────────
// Provider
// ──────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const store = useAuthStore();

  const register = useCallback(
    (name: string, email: string, password: string): boolean => {
      // Simulated registration — creates a new user with the 'user' role
      // In production this would call an API
      if (!name || !email || !password) return false;

      // Check if email already matches a demo user
      const existingDemo = Object.values(DEMO_USERS).find(
        (u) => u.email === email
      );
      if (existingDemo) {
        // Already exists — just log them in
        store.loginAsDemo(existingDemo.role);
        return true;
      }

      // Create a brand-new user with 'user' role
      const newUser: User = {
        id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name,
        email,
        role: 'user',
        avatar: null,
      };
      store.setUser(newUser);
      return true;
    },
    [store]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user: store.user,
      isAuthenticated: store.isAuthenticated,
      isAdmin: store.isAdmin,
      isPartner: store.isPartner,
      isUser: store.isUser,
      login: store.login,
      loginAsDemo: store.loginAsDemo,
      logout: store.logout,
      register,
      updateAvatar: store.updateAvatar,
    }),
    [store, register]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

// ──────────────────────────────────────────────
// Hook
// ──────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
