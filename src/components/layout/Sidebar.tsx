"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Grid,
  FolderKanban,
  Calendar,
  Users,
  UserCheck,
  Settings,
  LogOut,
  Sparkles,
  Megaphone,
  MapPinned,
  GraduationCap,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { Avatar } from "../ui/avatar";

interface SidebarProps {
  onCloseMobile?: () => void;
  // Desktop "minimize" mode — icon rail only, labels/text hidden. Only ever passed by
  // MainLayout's desktop instance; the mobile drawer instance omits both this and
  // onToggleCollapse, so it always renders expanded regardless of the desktop preference.
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

// Either a direct link, or a group (rendered as an expandable parent with its own sub-links —
// see the "Partner" group below, which nests the existing Partner pages alongside the new
// Training section under one parent instead of two more flat top-level items).
type MenuItem =
  | { label: string; icon: typeof Grid; href: string }
  | { label: string; icon: typeof Grid; children: { label: string; icon: typeof Grid; href: string }[] };

const menuItems: MenuItem[] = [
  { label: "Dashboard", icon: Grid, href: "/" },
  { label: "Catalogue", icon: FolderKanban, href: "/catalogue" },
  { label: "Campaigns", icon: Megaphone, href: "/campaigns" },
  { label: "Zones", icon: MapPinned, href: "/zones" },
  { label: "Bookings", icon: Calendar, href: "/bookings" },
  {
    label: "Partner",
    icon: UserCheck,
    children: [
      { label: "Partner", icon: UserCheck, href: "/partners" },
      { label: "Training", icon: GraduationCap, href: "/training" },
    ],
  },
  { label: "Users", icon: Users, href: "/users" },
  { label: "Settings", icon: Settings, href: "/settings" },
];

export default function Sidebar({
  onCloseMobile,
  collapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // Which group (by label) the user has manually expanded/collapsed this session — null means
  // "no manual override yet", in which case a group whose own route is currently active falls
  // back to open (see isOpen below) instead of hiding the very link you're standing on.
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  const isChildActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const displayName =
    user?.name || (user?.email ? user.email.split("@")[0] : "Admin");
  const userRole = user?.role || "Administrator";
  const fallbackInitials = displayName.substring(0, 2).toUpperCase();

  return (
    <aside
      className={`relative w-full h-full bg-[#1C1512] text-[#E5D5C5] flex flex-col justify-between flex-shrink-0 transition-all duration-300 overflow-y-auto overflow-x-hidden no-scrollbar select-none ${collapsed ? "p-3" : "p-4"}`}
    >
      {/* Minimize/expand toggle — floats on the sidebar's edge so it stays reachable whether
          expanded or collapsed. Desktop-only (onToggleCollapse is never passed to the mobile
          drawer instance). */}
      {onToggleCollapse && (
        <button
          onClick={onToggleCollapse}
          title={collapsed ? "Expand sidebar" : "Minimize sidebar"}
          className={`hidden lg:flex z-50 fixed ${
            collapsed ? "left-[64px] top-[76px]" : "top-[87px] left-[240px]"
          } w-6 h-6 rounded-full bg-[#1C1512] border border-[#3D3028] items-center justify-center text-[#D4A373] hover:bg-[#2D221C] hover:text-white transition-[left] duration-300 cursor-pointer shadow-md`}
        >
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </button>
      )}

      <div>
        {/* Logo / Header */}
        <div
          className={`flex items-center mb-6 border-b border-[#2D231E] ${collapsed ? "justify-center px-1 py-5" : "justify-between px-4 py-5"}`}
        >
          <div className={`flex items-center ${collapsed ? "" : "gap-3"}`}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#D4A373] to-[#F4E3D3] flex items-center justify-center text-[#1C1512] shadow-md flex-shrink-0">
              <Sparkles className="w-5 h-5 fill-current" />
            </div>
            {!collapsed && (
              <div>
                <h1 className="font-bold text-lg text-white tracking-wide">
                  Eezit Admin
                </h1>
                <p className="text-xs text-[#A8988A]">Eezit Management</p>
              </div>
            )}
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

            if ("children" in item) {
              const isGroupActive = item.children.some((c) => isChildActive(c.href));
              const isOpen = openGroup === item.label || (openGroup === null && isGroupActive);

              // Collapsed rail has no room for a sub-list — the parent icon just goes straight
              // to its first child (Partner) instead of doubling as an inert expand toggle.
              if (collapsed) {
                return (
                  <Link
                    key={item.label}
                    href={item.children[0].href}
                    onClick={onCloseMobile}
                    title={item.label}
                    className={`w-full flex items-center justify-center px-0 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isGroupActive
                        ? "bg-[#2D221C] text-[#D4A373] shadow-sm border border-[#3D3028]"
                        : "text-[#A8988A] hover:bg-[#251D19] hover:text-white"
                    }`}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${isGroupActive ? "text-[#D4A373]" : "text-[#A8988A]"}`} />
                  </Link>
                );
              }

              return (
                <div key={item.label}>
                  <button
                    type="button"
                    onClick={() => setOpenGroup(isOpen ? "" : item.label)}
                    className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                      isGroupActive
                        ? "bg-[#2D221C] text-[#D4A373] shadow-sm border border-[#3D3028]"
                        : "text-[#A8988A] hover:bg-[#251D19] hover:text-white"
                    }`}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${isGroupActive ? "text-[#D4A373]" : "text-[#A8988A]"}`} />
                    <span className="flex-1 text-left">{item.label}</span>
                    <ChevronDown className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                  </button>

                  <div className={`grid transition-all duration-200 ${isOpen ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0"}`}>
                    <div className="overflow-hidden">
                      <div className="ml-5 pl-3.5 border-l border-[#2D231E] space-y-1">
                        {item.children.map((child) => {
                          const ChildIcon = child.icon;
                          const childActive = isChildActive(child.href);
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={onCloseMobile}
                              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                childActive
                                  ? "text-[#D4A373] bg-[#251D19]"
                                  : "text-[#A8988A] hover:text-white hover:bg-[#251D19]"
                              }`}
                            >
                              <ChildIcon className={`w-4 h-4 flex-shrink-0 ${childActive ? "text-[#D4A373]" : "text-[#A8988A]"}`} />
                              <span>{child.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center rounded-xl text-sm font-medium transition-all duration-200 ${collapsed ? "justify-center px-0 py-3" : "gap-3.5 px-4 py-3"} ${
                  isActive
                    ? "bg-[#2D221C] text-[#D4A373] shadow-sm border border-[#3D3028]"
                    : "text-[#A8988A] hover:bg-[#251D19] hover:text-white"
                }`}
              >
                <Icon
                  className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-[#D4A373]" : "text-[#A8988A]"}`}
                />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom User Avatar Profile Card & Logout */}
      <div
        className={`border-t border-[#2D231E] pt-4 mt-6 space-y-3 ${collapsed ? "" : "px-1"}`}
      >
        {/* User Avatar & Info */}
        <div
          title={collapsed ? `${displayName} · ${userRole}` : undefined}
          className={`flex items-center rounded-xl bg-[#251D19]/60 border border-[#3D3028]/50 ${collapsed ? "justify-center py-2" : "gap-3 px-3 py-2"}`}
        >
          <Avatar
            fallback={fallbackInitials}
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
            alt={displayName}
            className="w-9 h-9 border-[#D4A373]/40 flex-shrink-0"
          />
          {!collapsed && (
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-semibold text-white truncate capitalize">
                {displayName}
              </span>
              <span className="text-[11px] text-[#A8988A] truncate capitalize">
                {userRole}
              </span>
            </div>
          )}
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          title={collapsed ? "Logout" : undefined}
          className={`w-full flex items-center rounded-xl text-sm text-[#A8988A] hover:bg-[#251D19] hover:text-red-400 transition-all cursor-pointer ${collapsed ? "justify-center py-2.5" : "gap-3 px-3 py-2.5"}`}
        >
          <LogOut className="w-4 h-4 text-red-400/80 flex-shrink-0" />
          {!collapsed && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  );
}
