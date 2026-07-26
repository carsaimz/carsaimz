'use client';

import React, { createContext, useContext, useCallback, useMemo, type ReactNode } from 'react';
import {
  useAuthStore,
  type User,
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
  isSuperAdmin: boolean;
  isLoading: boolean;
  login: (login: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (name: string, email: string, password: string, phone?: string) => Promise<boolean>;
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

  const value = useMemo<AuthContextValue>(
    () => ({
      user: store.user,
      isAuthenticated: store.isAuthenticated,
      isAdmin: store.isAdmin,
      isPartner: store.isPartner,
      isUser: store.isUser,
      isSuperAdmin: store.isSuperAdmin,
      isLoading: store.isLoading,
      login: store.login,
      logout: store.logout,
      register: store.register,
      updateAvatar: store.updateAvatar,
    }),
    [store]
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
