'use client';

import React from 'react';
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
import { useCatalogue } from '../../contexts/CatalogueContext';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export default function Sidebar({ onCloseMobile }: SidebarProps) {
  const { setActiveView } = useCatalogue();

  const menuItems = [
    { label: 'Dashboard', icon: Grid, active: false },
    { 
      label: 'Catalogue', 
      icon: FolderKanban, 
      active: true, 
      action: () => { 
        setActiveView('categories'); 
        if (onCloseMobile) onCloseMobile();
      } 
    },
    { label: 'Bookings', icon: Calendar, active: false },
    { label: 'Partners', icon: UserCheck, active: false },
    { label: 'Customers', icon: Users, active: false },
    { label: 'Settings', icon: Settings, active: false },
  ];

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
              className="lg:hidden text-[#A8988A] hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1.5">
          {menuItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                onClick={item.action}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  item.active
                    ? 'bg-[#2D221C] text-[#D4A373] shadow-sm border border-[#3D3028]'
                    : 'text-[#A8988A] hover:bg-[#251D19] hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${item.active ? 'text-[#D4A373]' : 'text-[#A8988A]'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom User / Footer info */}
      <div className="border-t border-[#2D231E] pt-4 px-2 mt-6">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#A8988A] hover:bg-[#251D19] hover:text-red-400 transition-all">
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
