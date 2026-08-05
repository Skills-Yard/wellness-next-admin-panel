'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Grid, 
  FolderKanban, 
  Calendar, 
  Users, 
  UserCheck, 
  Settings, 
  LogOut,
  Sparkles,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar } from '../ui/avatar';

interface SidebarProps {
  onCloseMobile?: () => void;
}

const menuItems = [
  { label: 'Dashboard', icon: Grid, href: '/' },
  { label: 'Catalogue', icon: FolderKanban, href: '/catalogue' },
  { label: 'Bookings', icon: Calendar, href: '/bookings' },
  { label: 'Partners', icon: UserCheck, href: '/partners' },
  { label: 'Customers', icon: Users, href: '/customers' },
  { label: 'Settings', icon: Settings, href: '/settings' },
];

export default function Sidebar({ onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const displayName = user?.name || (user?.email ? user.email.split('@')[0] : 'Admin');
  const userRole = user?.role || 'Administrator';
  const fallbackInitials = displayName.substring(0, 2).toUpperCase();

  return (
    <aside className="w-64 bg-[#1C1512] text-[#E5D5C5] h-full flex flex-col justify-between p-4 flex-shrink-0 transition-all duration-300 overflow-y-auto select-none">
      <div>
        {/* Logo / Header */}
        <div className="flex items-center justify-between px-4 py-5 mb-6 border-b border-[#2D231E]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#D4A373] to-[#F4E3D3] flex items-center justify-center text-[#1C1512] shadow-md">
              <Sparkles className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-white tracking-wide">Vellora Admin</h1>
              <p className="text-xs text-[#A8988A]">Wellness Management</p>
            </div>
          </div>

          {/* Close button for mobile drawer */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden text-[#A8988A] hover:text-white p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-[#2D221C] text-[#D4A373] shadow-sm border border-[#3D3028]'
                    : 'text-[#A8988A] hover:bg-[#251D19] hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#D4A373]' : 'text-[#A8988A]'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom User Avatar Profile Card & Logout */}
      <div className="border-t border-[#2D231E] pt-4 px-1 mt-6 space-y-3">
        
        {/* User Avatar & Info */}
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-[#251D19]/60 border border-[#3D3028]/50">
          <Avatar
            fallback={fallbackInitials}
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
            alt={displayName}
            className="w-9 h-9 border-[#D4A373]/40"
          />
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-semibold text-white truncate capitalize">
              {displayName}
            </span>
            <span className="text-[11px] text-[#A8988A] truncate capitalize">
              {userRole}
            </span>
          </div>
        </div>

        {/* Logout Button */}
        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#A8988A] hover:bg-[#251D19] hover:text-red-400 transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-red-400/80" />
          <span className="font-medium">Logout</span>
        </button>
      </div>

    </aside>
  );
}
