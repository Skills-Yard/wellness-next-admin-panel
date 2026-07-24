'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Bell, ChevronDown, Menu } from 'lucide-react';
import { useCatalogue } from '../../contexts/CatalogueContext';

interface HeaderProps {
  onOpenMobileMenu?: () => void;
}

export default function Header({ onOpenMobileMenu }: HeaderProps) {
  const { activeView, setActiveView, selectedSubCategory } = useCatalogue();
  const pathname = usePathname();

  const getBreadcrumb = () => {
    if (pathname === '/') {
      return <span className="text-[#C68A4C] font-semibold">Dashboard</span>;
    }
    if (pathname.startsWith('/catalogue')) {
      return (
        <>
          <Link href="/catalogue" onClick={() => setActiveView('categories')} className="text-gray-500 hover:text-gray-800 transition-colors truncate">
            Catalogue
          </Link>
          <span className="text-gray-300 font-light">&gt;</span>
          {activeView === 'categories' ? (
            <span className="text-[#C68A4C] font-semibold truncate">Categories</span>
          ) : (
            <>
              <button
                onClick={() => setActiveView('categories')}
                className="text-gray-500 hover:text-gray-800 transition-colors truncate"
              >
                Categories
              </button>
              <span className="text-gray-300 font-light">&gt;</span>
              <span className="text-[#C68A4C] font-semibold truncate max-w-[120px] sm:max-w-none">
                {selectedSubCategory?.name || 'Service Detail'}
              </span>
            </>
          )}
        </>
      );
    }
    // Fallback: capitalize pathname
    const page = pathname.replace('/', '');
    return <span className="text-[#C68A4C] font-semibold capitalize">{page}</span>;
  };

  return (
    <header className="w-full bg-white border-b border-gray-100 px-4 md:px-8 py-3.5 flex items-center justify-between shadow-xs sticky top-0 z-30 flex-shrink-0">
      
      {/* Left side: Hamburger button + Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger Button for mobile/tablet screens */}
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 active:scale-95 transition-transform"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm font-medium truncate">
          {getBreadcrumb()}
        </nav>
      </div>

      {/* Right Tools: Search, Notification, Profile */}
      <div className="flex items-center gap-3 sm:gap-6">
        {/* Search Bar */}
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search anything..."
            className="pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-xl w-44 lg:w-56 focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C] transition-all bg-gray-50/50"
          />
        </div>

        {/* Bell Notification */}
        <div className="relative cursor-pointer p-1.5 rounded-full hover:bg-gray-100 transition-colors">
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
            12
          </span>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-2 sm:gap-3 pl-2 border-l border-gray-200">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-cover bg-center border border-gray-200 overflow-hidden shadow-xs">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
              alt="Anshika Dhawan"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-xs font-semibold text-gray-800 leading-tight">Anshika Dhawan</span>
            <div className="flex items-center gap-1 text-[11px] text-gray-400">
              <span>Admin</span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
