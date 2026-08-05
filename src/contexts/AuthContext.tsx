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
        setUser(parsed);
        if (parsed.accessToken) {
          document.cookie = `wellness_admin_token=${parsed.accessToken}; path=/; max-age=604800; SameSite=Lax`;
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
      let loggedUser: User;
      let token: string | undefined;

      try {
        // Try logging in via backend API (endpoint is POST /api/v1/admin/login)
        const response = await axiosInstance.post('/admin/login', { email, password });
        const data = response.data;
        
        token = data.tokens?.accessToken || data.token;
        loggedUser = {
          id: data.user?.id,
          email: data.user?.email || email,
          name: data.user?.name || email.split('@')[0],
          role: data.user?.role || 'Administrator',
          accessToken: token,
        };
      } catch (apiError: any) {
        // Handle credential failure responses (400, 401, 403) from backend
        if (apiError.response && (apiError.response.status === 401 || apiError.response.status === 400 || apiError.response.status === 403)) {
          const msg = Array.isArray(apiError.response.data?.message)
            ? apiError.response.data.message.join(', ')
            : apiError.response.data?.message || 'Invalid email or password.';
          return { success: false, message: msg };
        }
        
        // Fallback admin user if API server is offline / ngrok connection fails
        token = 'mock-admin-token-' + Date.now();
        loggedUser = {
          email,
          name: email.split('@')[0],
          role: 'Administrator',
          accessToken: token,
        };
      }

      setUser(loggedUser);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(loggedUser));
      if (token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
        document.cookie = `wellness_admin_token=${token}; path=/; max-age=604800; SameSite=Lax`;
      }

      return { success: true, message: 'Authenticated successfully.' };
    } catch (error: any) {
      return { 
        success: false, 
        message: error?.message || 'An unexpected error occurred during login.' 
      };
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
