'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import { createUserProfile, getUserProfile, touchLastLogin, type UserProfile } from '@/lib/userProfile';
import type { Role } from '@/lib/auth/permissions';

export interface AuthUser {
  uid: string;
  email: string;
  name: string;
  role: Role;
}

export interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
}

interface AuthState {
  user: AuthUser | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  /** Re-sync profile + server session (kept for existing callers). */
  refresh: () => Promise<AuthUser | null>;
}

const AuthContext = createContext<AuthState | null>(null);

/** POST the current Firebase ID token to mint the server session cookie. */
async function syncServerSession(fbUser: FirebaseUser): Promise<void> {
  try {
    const idToken = await fbUser.getIdToken();
    await fetch('/api/auth/firebase-session', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
  } catch {
    /* non-blocking — client guards still work */
  }
}
async function clearServerSession(): Promise<void> {
  try {
    await fetch('/api/auth/firebase-session', { method: 'DELETE' });
  } catch {
    /* ignore */
  }
}

/** Fallback: read the server session cookie (JWT bridge / backward compat). */
async function fetchServerSession(): Promise<AuthUser | null> {
  try {
    const res = await fetch('/api/auth/session', { cache: 'no-store' });
    const data = (await res.json()) as { user: { email: string; name: string; role: Role } | null };
    return data.user ? { uid: '', email: data.user.email, name: data.user.name, role: data.user.role } : null;
  } catch {
    return null;
  }
}

/**
 * Firebase Authentication provider (primary auth). Restores session on refresh
 * via onAuthStateChanged (works across tabs), keeps a server session cookie in
 * sync for middleware/guards, and loads the Firestore profile (role/status).
 */
export function AuthProvider({ initialUser = null, children }: { initialUser?: AuthUser | null; children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(initialUser);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const persistenceSet = useRef(false);
  /**
   * Auth transitions race in three ways, and all three are guarded here:
   *  - `authOp` — bumped by every transition. A hydrate that loses the race
   *    (typically to a logout) must not publish its stale user.
   *  - `signingOut` — true from the start of logout() until the cookie is
   *    actually gone, so the listener below doesn't restore the session from a
   *    cookie that is milliseconds from being cleared.
   *  - `pendingSync` — the in-flight cookie mint, so logout can let it settle
   *    before clearing rather than racing it.
   */
  const authOp = useRef(0);
  const signingOut = useRef(false);
  const pendingSync = useRef<Promise<void> | null>(null);

  const hydrate = useCallback(async (fbUser: FirebaseUser) => {
    const op = ++authOp.current;
    const prof = await getUserProfile(fbUser.uid).catch(() => null);
    const role: Role = prof?.role ?? 'user';

    // Mint the server cookie BEFORE publishing signed-in state. That cookie is
    // what middleware enforces, so setting `user` first opened a window where
    // the header said "logged in" while every guarded route still saw a guest —
    // registering and going straight to /profile bounced you back to /login.
    const sync = syncServerSession(fbUser);
    pendingSync.current = sync;
    await sync;

    // A newer transition (usually logout) started while we were minting; that
    // one owns the state now, so publishing here would resurrect a dead session.
    if (op !== authOp.current) return;

    setProfile(prof);
    setUser({
      uid: fbUser.uid,
      email: fbUser.email ?? prof?.email ?? '',
      name: fbUser.displayName ?? prof?.fullName ?? (fbUser.email ?? '').split('@')[0],
      role,
    });
  }, []);

  useEffect(() => {
    let active = true;

    // Offline / no-Firebase mode: rely on the file-backed session cookie
    // (the /api/auth/* routes) instead of the Firebase auth listener.
    if (!isFirebaseConfigured) {
      (async () => {
        const server = await fetchServerSession();
        if (!active) return;
        setUser(server);
        setProfile(null);
        setLoading(false);
      })();
      return () => {
        active = false;
      };
    }

    (async () => {
      if (!persistenceSet.current) {
        await setPersistence(auth, browserLocalPersistence).catch(() => undefined);
        persistenceSet.current = true;
      }
    })();
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!active) return;
      if (fbUser) {
        await hydrate(fbUser);
      } else if (signingOut.current) {
        // Mid-logout: signOut() fires this listener before the cookie is
        // cleared, so consulting the bridge here would read the session we are
        // in the middle of ending and immediately restore it.
        setUser(null);
        setProfile(null);
      } else {
        // No Firebase user — fall back to the server session cookie (bridge),
        // which is how the legacy file-backed login stays signed in.
        const server = await fetchServerSession();
        if (server) {
          setUser(server);
          setProfile(null);
        } else {
          setUser(null);
          setProfile(null);
        }
      }
      setLoading(false);
    });
    return () => {
      active = false;
      unsub();
    };
  }, [hydrate]);

  const login = useCallback(async (email: string, password: string) => {
    // Offline fallback: file-backed auth route sets the session cookie.
    if (!isFirebaseConfigured) {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(d.error ?? 'Incorrect email or password.');
      }
      setUser(await fetchServerSession());
      setProfile(null);
      return;
    }
    await setPersistence(auth, browserLocalPersistence).catch(() => undefined);
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    await touchLastLogin(cred.user.uid).catch(() => undefined);
    await hydrate(cred.user);
  }, [hydrate]);

  const register = useCallback(async (input: RegisterInput) => {
    if (!isFirebaseConfigured) {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: input.fullName, email: input.email.trim(), password: input.password }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(d.error ?? 'Could not create account.');
      }
      setUser(await fetchServerSession());
      setProfile(null);
      return;
    }
    const cred = await createUserWithEmailAndPassword(auth, input.email.trim(), input.password);
    await updateProfile(cred.user, { displayName: input.fullName }).catch(() => undefined);
    await createUserProfile({ uid: cred.user.uid, fullName: input.fullName, email: input.email, phone: input.phone });
    await hydrate(cred.user);
  }, [hydrate]);

  const logout = useCallback(async () => {
    authOp.current++; // any hydrate still in flight is now stale
    signingOut.current = true;
    setUser(null);
    setProfile(null);
    try {
      await signOut(auth).catch(() => undefined);
      // Let a cookie mint that was already in flight finish first — otherwise it
      // lands *after* the clear below and silently signs the user back in on the
      // next page load.
      await pendingSync.current?.catch(() => undefined);
      await clearServerSession();
    } finally {
      signingOut.current = false;
    }
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  }, []);

  const refresh = useCallback(async () => {
    const fbUser = auth.currentUser;
    if (fbUser) {
      await hydrate(fbUser);
      return {
        uid: fbUser.uid,
        email: fbUser.email ?? '',
        name: fbUser.displayName ?? '',
        role: (await getUserProfile(fbUser.uid).catch(() => null))?.role ?? 'user',
      } as AuthUser;
    }
    const server = await fetchServerSession();
    setUser(server);
    return server;
  }, [hydrate]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAuthenticated: !!user, login, register, logout, forgotPassword, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
