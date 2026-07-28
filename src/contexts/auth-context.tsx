'use client';

import React, { createContext, useContext, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import {
  useAuthStore,
  type User,
  type AuthProvider as AuthProviderType,
  type AuthResult,
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
  idToken: string | null;

  // Auth methods
  loginWithEmailPassword: (email: string, password: string) => Promise<AuthResult>;
  loginWithGoogle: () => Promise<AuthResult>;
  loginAnonymously: () => Promise<AuthResult>;
  loginWithPhone: (phoneNumber: string, recaptchaContainerId: string) => Promise<{ verificationId: string } | null>;
  verifyPhoneCode: ( verificationId: string, verificationCode: string) => Promise<AuthResult>;
  loginWithToken: (idToken: string) => Promise<AuthResult>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<AuthResult>;
  logout: () => void;
  setUser: (user: User) => void;
  updateAvatar: (avatar: string) => void;
  setIdToken: (token: string) => void;

  // Backward compatibility
  login: (email: string, password: string) => Promise<boolean>;
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

  // ── Listen for Firebase Auth state changes ──
  // This ensures the store stays in sync with Firebase Auth sessions.
  // When a user returns to the app, Firebase Auth restores the session,
  // and we update the store accordingly.
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    async function setupAuthListener() {
      try {
        const { auth, onAuthStateChanged, isFirebaseConfigured } = await import('@/lib/firebase-client');

        if (!isFirebaseConfigured()) return;

        unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser && !store.isAuthenticated) {
            // User is signed in with Firebase but store doesn't know about it
            // This happens when the user returns after closing the browser
            try {
              const idToken = await firebaseUser.getIdToken();
              const { buildApiUrl } = await import('@/lib/api-base');

              const res = await fetch(buildApiUrl('/api/auth/login'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken }),
              });

              const data = await res.json();

              if (data.user) {
                const userRole = data.user.role || 'user';
                const user: User = {
                  id: data.user.id || firebaseUser.uid,
                  name: data.user.name || firebaseUser.displayName || 'Utilizador',
                  email: data.user.email || firebaseUser.email,
                  role: userRole,
                  avatar: data.user.avatar || firebaseUser.photoURL || null,
                  phone: data.user.phone || firebaseUser.phoneNumber || null,
                  authProvider: (firebaseUser.providerData[0]?.providerId as AuthProviderType) || 'unknown',
                  isAnonymous: firebaseUser.isAnonymous,
                  emailVerified: firebaseUser.emailVerified,
                };
                store.setUser(user);
                store.setIdToken(idToken);
              }
            } catch (err) {
              console.warn('[Auth] Failed to restore session from server:', err);
            }
          } else if (!firebaseUser && store.isAuthenticated) {
            // User signed out in Firebase but store still thinks they're logged in
            store.logout();
          }
        });
      } catch (err) {
        // Firebase Auth not available (SSR, static export)
        console.warn('[Auth] Firebase Auth listener not available:', err);
      }
    }

    setupAuthListener();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // ── Backward-compatible login method ──
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    const result = await store.loginWithEmailPassword(email, password);
    return result.success;
  }, [store]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: store.user,
      isAuthenticated: store.isAuthenticated,
      isAdmin: store.isAdmin,
      isPartner: store.isPartner,
      isUser: store.isUser,
      isSuperAdmin: store.isSuperAdmin,
      isLoading: store.isLoading,
      idToken: store.idToken,

      // Auth methods
      loginWithEmailPassword: store.loginWithEmailPassword,
      loginWithGoogle: store.loginWithGoogle,
      loginAnonymously: store.loginAnonymously,
      loginWithPhone: store.loginWithPhone,
      verifyPhoneCode: store.verifyPhoneCode,
      loginWithToken: store.loginWithToken,
      register: store.register,
      logout: store.logout,
      setUser: store.setUser,
      updateAvatar: store.updateAvatar,
      setIdToken: store.setIdToken,

      // Backward compatibility
      login,
    }),
    [store, login]
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
