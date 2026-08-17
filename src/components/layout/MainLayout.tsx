'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2, Sparkles } from 'lucide-react';

const SIDEBAR_COLLAPSED_STORAGE_KEY = 'eezit-admin-sidebar-collapsed';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Desktop-only "minimize" state for the sidebar — mobile always uses the full-width drawer
  // (see the Sidebar instance below), so this never applies there. Persisted so the admin's
  // choice survives a reload/new tab instead of resetting to expanded every time.
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  const isLoginPage = pathname === '/login';

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated && !isLoginPage) {
        router.replace('/login');
      }
    }
  }, [isLoading, isAuthenticated, isLoginPage, router]);

  useEffect(() => {
    setSidebarCollapsed(localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === 'true');
  }, []);

  const toggleSidebarCollapsed = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(next));
      return next;
    });
  };

  // If viewing the login page, render child component directly
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Show a smooth loading screen while validating auth state
  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#1C1512] text-white">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#D4A373] to-[#F4E3D3] flex items-center justify-center text-[#1C1512] shadow-xl mb-4 animate-bounce">
          <Sparkles className="w-6 h-6 fill-current" />
        </div>
        <div className="flex items-center gap-2 text-sm text-[#A8988A] font-medium">
          <Loader2 className="w-4 h-4 animate-spin text-[#D4A373]" />
          <span>Verifying credentials...</span>
        </div>
      </div>
    );
  }

  // If not authenticated and not loading, don't render layout content (redirecting to /login)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen w-screen max-w-full bg-[#FAF9F6] text-gray-800 font-sans antialiased overflow-hidden">
      
      {/* Desktop Fixed Sidebar - Fixed 100% Height, Never Scrolls with Content */}
      <div className={`hidden lg:block h-screen flex-shrink-0 border-r border-[#2D231E] transition-all duration-300 ${sidebarCollapsed ? 'w-20' : 'w-64'}`}>
        <Sidebar collapsed={sidebarCollapsed} onToggleCollapse={toggleSidebarCollapsed} />
      </div>

      {/* Mobile Drawer Overlay (< 1024px) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 w-64 max-w-xs bg-[#1C1512] shadow-2xl flex flex-col h-full animate-in slide-in-from-left duration-200">
            <Sidebar onCloseMobile={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Right Side Main Viewport Container - ONLY THIS SECTION SCROLLS */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
        <Header onOpenMobileMenu={() => setMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 md:p-8 w-full max-w-full">
          {children}
        </main>
      </div>

    </div>
  );
}
