'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '../lib/axios';

export interface User {
  id?: string;
  email: string;
  name?: string;
  role?: string;
  accessToken?: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'wellness_admin_user';
const TOKEN_STORAGE_KEY = 'wellness_admin_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        // A stored session without an access token can't authenticate against the admin API —
        // every request would 401 and the panel would silently render empty lists. Treat it as
        // logged out so the user is sent back to a clean login instead.
        if (parsed?.accessToken) {
          setUser(parsed);
          document.cookie = `wellness_admin_token=${parsed.accessToken}; path=/; max-age=604800; SameSite=Lax`;
        } else {
          localStorage.removeItem(AUTH_STORAGE_KEY);
          localStorage.removeItem(TOKEN_STORAGE_KEY);
        }
      }
    } catch (err) {
      console.error('Failed to parse stored auth user:', err);
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

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
        id: body?.admin?.id ?? body?.user?.id,
        email: body?.admin?.email ?? body?.user?.email ?? email,
        name: body?.admin?.name ?? body?.user?.name ?? email.split('@')[0],
        role: body?.admin?.role ?? body?.user?.role ?? 'Administrator',
        accessToken: token,
      };

      setUser(loggedUser);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(loggedUser));
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      document.cookie = `wellness_admin_token=${token}; path=/; max-age=604800; SameSite=Lax`;

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

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
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
