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
  loginWithGithub: () => Promise<AuthResult>;
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

  // ── Handle getRedirectResult after redirect-based sign-in ──
  // When using signInWithRedirect (Google/GitHub), the page redirects away
  // and then returns. On return, we must call getRedirectResult() to get
  // the credential and complete the authentication.
  useEffect(() => {
    let cancelled = false;

    async function handleRedirectResult() {
      try {
        const { auth, getRedirectResult, isFirebaseConfigured } = await import('@/lib/firebase-client');

        if (!isFirebaseConfigured()) return;

        const result = await getRedirectResult(auth);

        if (cancelled || !result) return;

        // User returned from a redirect-based sign-in (Google/GitHub)
        const idToken = await result.user.getIdToken();
        const { buildApiUrl } = await import('@/lib/api-base');

        try {
          const res = await fetch(buildApiUrl('/api/auth/social'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
          });

          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const data = await res.json();

            if (data.user) {
              const userRole = data.user.role || 'user';
              const user: User = {
                id: data.user.id || result.user.uid,
                name: data.user.name || result.user.displayName || 'Utilizador',
                email: data.user.email || result.user.email,
                role: userRole,
                avatar: data.user.avatar || result.user.photoURL || null,
                phone: data.user.phone || result.user.phoneNumber || null,
                authProvider: (result.user.providerData[0]?.providerId as AuthProviderType) || 'unknown',
                isAnonymous: result.user.isAnonymous,
                emailVerified: result.user.emailVerified,
              };
              store.setUser(user);
              store.setIdToken(idToken);
              return;
            }
          }
        } catch (err) {
          console.warn('[Auth] Server API unavailable for redirect result, falling back to client-side Firestore:', err);
        }

        // Fallback: Use client-side Firestore to create/retrieve profile
        try {
          const { firestoreClient } = await import('@/lib/firebase-client');
          if (firestoreClient) {
            const { doc, getDoc, setDoc, getDocs, collection, query, where } = await import('firebase/firestore');
            const uid = result.user.uid;
            const userRef = doc(firestoreClient, 'users', uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
              const profile = userSnap.data();
              const user: User = {
                id: uid,
                name: profile.name || result.user.displayName || 'Utilizador',
                email: profile.email || result.user.email,
                role: profile.roleId ? 'user' : 'user',
                avatar: profile.avatar || result.user.photoURL || null,
                phone: profile.phone || result.user.phoneNumber || null,
                authProvider: (result.user.providerData[0]?.providerId as AuthProviderType) || 'unknown',
                isAnonymous: result.user.isAnonymous,
                emailVerified: result.user.emailVerified,
              };
              store.setUser(user);
              store.setIdToken(idToken);
            } else {
              // Create new profile
              let roleId: string | null = null;
              try {
                const rolesRef = collection(firestoreClient, 'roles');
                const q = query(rolesRef, where('name', '==', 'user'));
                const roleSnap = await getDocs(q);
                if (!roleSnap.empty) roleId = roleSnap.docs[0].id;
              } catch {}

              const providerId = result.user.providerData[0]?.providerId || 'unknown';
              await setDoc(userRef, {
                name: result.user.displayName || 'Utilizador',
                email: result.user.email || null,
                phone: result.user.phoneNumber || null,
                avatar: result.user.photoURL || null,
                company: null, bio: null, address: null,
                roleId, isActive: true,
                emailVerified: result.user.emailVerified,
                authProvider: providerId,
                createdAt: new Date(), updatedAt: new Date(),
              });

              const user: User = {
                id: uid,
                name: result.user.displayName || 'Utilizador',
                email: result.user.email,
                role: 'user',
                avatar: result.user.photoURL || null,
                phone: result.user.phoneNumber || null,
                authProvider: (result.user.providerData[0]?.providerId as AuthProviderType) || 'unknown',
                isAnonymous: result.user.isAnonymous,
                emailVerified: result.user.emailVerified,
              };
              store.setUser(user);
              store.setIdToken(idToken);
            }
          }
        } catch (fsErr) {
          console.warn('[Auth] Client-side Firestore fallback failed for redirect result:', fsErr);
          // Last resort: set user from Firebase Auth data
          const user: User = {
            id: result.user.uid,
            name: result.user.displayName || 'Utilizador',
            email: result.user.email,
            role: 'user',
            avatar: result.user.photoURL || null,
            phone: result.user.phoneNumber || null,
            authProvider: (result.user.providerData[0]?.providerId as AuthProviderType) || 'unknown',
            isAnonymous: result.user.isAnonymous,
            emailVerified: result.user.emailVerified,
          };
          store.setUser(user);
          store.setIdToken(idToken);
        }
      } catch (err) {
        console.warn('[Auth] Redirect result handling error:', err);
      }
    }

    handleRedirectResult();

    return () => { cancelled = true; };
  }, []);

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

              let profileRestored = false;

              // Try server API first
              try {
                const res = await fetch(buildApiUrl('/api/auth/login'), {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ idToken }),
                });

                const contentType = res.headers.get('content-type') || '';
                if (contentType.includes('application/json')) {
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
                    profileRestored = true;
                  }
                }
              } catch (err) {
                console.warn('[Auth] Server API unavailable for session restore, falling back to client-side Firestore:', err);
              }

              // Fallback: Use client-side Firestore
              if (!profileRestored) {
                try {
                  const { firestoreClient } = await import('@/lib/firebase-client');
                  if (firestoreClient) {
                    const { doc, getDoc, setDoc, getDocs, collection, query, where } = await import('firebase/firestore');
                    const uid = firebaseUser.uid;
                    const userRef = doc(firestoreClient, 'users', uid);
                    const userSnap = await getDoc(userRef);

                    if (userSnap.exists()) {
                      const profile = userSnap.data();
                      const user: User = {
                        id: uid,
                        name: profile.name || firebaseUser.displayName || 'Utilizador',
                        email: profile.email || firebaseUser.email,
                        role: 'user',
                        avatar: profile.avatar || firebaseUser.photoURL || null,
                        phone: profile.phone || firebaseUser.phoneNumber || null,
                        authProvider: (firebaseUser.providerData[0]?.providerId as AuthProviderType) || 'unknown',
                        isAnonymous: firebaseUser.isAnonymous,
                        emailVerified: firebaseUser.emailVerified,
                      };
                      store.setUser(user);
                      store.setIdToken(idToken);
                    } else {
                      // Create new profile
                      let roleId: string | null = null;
                      try {
                        const rolesRef = collection(firestoreClient, 'roles');
                        const q = query(rolesRef, where('name', '==', 'user'));
                        const roleSnap = await getDocs(q);
                        if (!roleSnap.empty) roleId = roleSnap.docs[0].id;
                      } catch {}

                      await setDoc(userRef, {
                        name: firebaseUser.displayName || 'Utilizador',
                        email: firebaseUser.email || null,
                        phone: firebaseUser.phoneNumber || null,
                        avatar: firebaseUser.photoURL || null,
                        company: null, bio: null, address: null,
                        roleId, isActive: true,
                        emailVerified: firebaseUser.emailVerified,
                        authProvider: (firebaseUser.providerData[0]?.providerId as AuthProviderType) || 'unknown',
                        createdAt: new Date(), updatedAt: new Date(),
                      });

                      const user: User = {
                        id: uid,
                        name: firebaseUser.displayName || 'Utilizador',
                        email: firebaseUser.email,
                        role: 'user',
                        avatar: firebaseUser.photoURL || null,
                        phone: firebaseUser.phoneNumber || null,
                        authProvider: (firebaseUser.providerData[0]?.providerId as AuthProviderType) || 'unknown',
                        isAnonymous: firebaseUser.isAnonymous,
                        emailVerified: firebaseUser.emailVerified,
                      };
                      store.setUser(user);
                      store.setIdToken(idToken);
                    }
                  }
                } catch (fsErr) {
                  console.warn('[Auth] Client-side Firestore fallback failed:', fsErr);
                  // Last resort: set user from Firebase Auth data
                  const user: User = {
                    id: firebaseUser.uid,
                    name: firebaseUser.displayName || 'Utilizador',
                    email: firebaseUser.email,
                    role: 'user',
                    avatar: firebaseUser.photoURL || null,
                    phone: firebaseUser.phoneNumber || null,
                    authProvider: (firebaseUser.providerData[0]?.providerId as AuthProviderType) || 'unknown',
                    isAnonymous: firebaseUser.isAnonymous,
                    emailVerified: firebaseUser.emailVerified,
                  };
                  store.setUser(user);
                  store.setIdToken(idToken);
                }
              }
            } catch (err) {
              console.warn('[Auth] Failed to restore session:', err);
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
      loginWithGithub: store.loginWithGithub,
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
