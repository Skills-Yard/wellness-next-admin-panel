'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axiosInstance from '../lib/axios';
import { isTokenExpired, getTokenSubject } from '../lib/token';
import { getMyAdminServerAction } from '../lib/server-actions/admin';

export interface User {
  id?: string;
  email: string;
  name?: string;
  role?: string;
  // R2 bucket key for the admin's profile photo (Admin.profilePhotoKey on the
  // backend). Render via cdnUrl() from ../lib/cdn — it's a key, not a URL.
  profilePhotoKey?: string;
  // Hydrated from GET /admin/me (the login response carries neither). `lastLoginAt`
  // is the timestamp of the *current* login — the backend stamps it on every
  // successful /admin/login (see auth.service.ts).
  lastLoginAt?: string | null;
  isActive?: boolean;
  accessToken?: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  // Merges a partial User (e.g. the response from PATCH /admin/{id}) into the current session and
  // re-persists it — so a profile edit shows up immediately in Header/Sidebar without requiring
  // a re-login. Never touches accessToken; that only ever changes via login/logout.
  updateUser: (partial: Partial<Omit<User, 'accessToken'>>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'wellness_admin_user';
const TOKEN_STORAGE_KEY = 'wellness_admin_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Best-effort hydrate of the session from GET /admin/me — the login response
  // is tokens-only, so id / role / profilePhotoKey / lastLoginAt / isActive only
  // become known here. Called once on startup and right after login. A dead
  // token surfaces as a 401 which the axios interceptor already turns into a
  // redirect to /login, so failures here are swallowed.
  const refreshMe = useCallback(async () => {
    try {
      const res = await getMyAdminServerAction();
      if (!res.ok || !res.data) return;
      const d = res.data;
      setUser((prev) => {
        if (!prev) return prev;
        const next: User = {
          ...prev,
          id: d.id ?? prev.id,
          name: d.name ?? prev.name,
          email: d.email ?? prev.email,
          role: d.role ?? prev.role,
          profilePhotoKey: d.profilePhotoKey ?? undefined,
          lastLoginAt: d.lastLoginAt ?? null,
          isActive: d.isActive,
        };
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    } catch {
      /* swallowed — see comment above */
    }
  }, []);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        // A stored session without an access token can't authenticate against the admin API —
        // every request would 401 and the panel would silently render empty lists. Same story
        // for a token that has already expired: rather than wait for the first API call to
        // fail, check its `exp` claim right away so an expired session is treated as logged out
        // from the very first render and sent back to a clean login instead.
        if (parsed?.accessToken && !isTokenExpired(parsed.accessToken)) {
          // Older sessions were persisted before the id was captured (admin
          // login returns only tokens); backfill it from the token's `sub`
          // claim so PATCH /admin/:id and the profile page have it.
          if (!parsed.id) {
            const subject = getTokenSubject(parsed.accessToken);
            if (subject) parsed.id = subject;
          }
          setUser(parsed);
          document.cookie = `wellness_admin_token=${parsed.accessToken}; path=/; max-age=604800; SameSite=Lax`;
          // Refresh the rest of the profile (lastLoginAt / isActive / photo) from the API.
          void refreshMe();
        } else {
          localStorage.removeItem(AUTH_STORAGE_KEY);
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          document.cookie = 'wellness_admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        }
      }
    } catch (err) {
      console.error('Failed to parse stored auth user:', err);
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, [refreshMe]);

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      // POST /api/v1/admin/login returns { message, tokens: { accessToken, refreshToken } },
      // wrapped by the backend's global response interceptor as { success, data, meta }.
      // The refresh token is stripped into an httpOnly cookie server-side; the access token
      // comes back in the body and is what every admin endpoint expects as a Bearer token.
      const response = await axiosInstance.post('/admin/login', { email, password });
      const body = response.data?.data ?? response.data;

      const token: string | undefined =
        body?.tokens?.accessToken ?? body?.accessToken ?? body?.token;

      if (!token) {
        console.error('[login] No access token in response:', response.data);
        return {
          success: false,
          message: 'Login succeeded but no access token was returned. Please contact support.',
        };
      }

      const loggedUser: User = {
        // The admin login response carries only tokens — no admin object — so
        // fall back to the access token's `sub` claim for the id.
        id: body?.admin?.id ?? body?.user?.id ?? getTokenSubject(token) ?? undefined,
        email: body?.admin?.email ?? body?.user?.email ?? email,
        name: body?.admin?.name ?? body?.user?.name ?? email.split('@')[0],
        role: body?.admin?.role ?? body?.user?.role ?? 'Administrator',
        profilePhotoKey: body?.admin?.profilePhotoKey ?? body?.user?.profilePhotoKey,
        accessToken: token,
      };

      setUser(loggedUser);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(loggedUser));
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      document.cookie = `wellness_admin_token=${token}; path=/; max-age=604800; SameSite=Lax`;

      // Fill in id / role / lastLoginAt / isActive / photo from the API — the
      // login body has none of it. Fire-and-forget so sign-in isn't blocked.
      void refreshMe();

      return { success: true, message: 'Authenticated successfully.' };
    } catch (error: any) {
      const status = error?.response?.status;
      const data = error?.response?.data;
      const message =
        data?.error?.message ||
        (Array.isArray(data?.message) ? data.message.join(', ') : data?.message) ||
        (status
          ? 'Invalid email or password.'
          : 'Could not reach the API server. Check that the backend is running and NEXT_PUBLIC_API_URL is correct.');

      console.error('[login]', status, data || error?.message);
      return { success: false, message };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    document.cookie = 'wellness_admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  };

  const updateUser = (partial: Partial<Omit<User, 'accessToken'>>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...partial };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
