'use client';

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen max-w-full bg-[#FAF9F6] text-gray-800 font-sans antialiased overflow-hidden">
      
      {/* Desktop Fixed Sidebar - Fixed 100% Height, Never Scrolls with Content */}
      <div className="hidden lg:block h-screen flex-shrink-0 w-64 border-r border-[#2D231E]">
        <Sidebar />
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
