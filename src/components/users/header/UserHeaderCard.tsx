'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { User } from '../../../types/user';
import UserHeaderProfile from './UserHeaderProfile';
import { Card } from '../../ui/card';

function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 30) return `${Math.floor(days / 30)} month(s) ago`;
  if (days > 0) return `${days} day(s) ago`;
  if (hours > 0) return `${hours} hour(s) ago`;
  if (mins > 0) return `${mins} min(s) ago`;
  return 'Just now';
}

interface UserHeaderCardProps {
  user: User;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'addresses', label: 'Addresses' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'devices', label: 'Devices' },
  { id: 'activity', label: 'Activity Summary' },
];

export default function UserHeaderCard({
  user,
  activeTab,
  onTabChange,
}: UserHeaderCardProps) {
  const joinedFormatted = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';
  const lastActiveFormatted = user.lastLoginAt
    ? new Date(user.lastLoginAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';
  const joinedAgo = timeAgo(user.createdAt);
  const lastActiveAgo = timeAgo(user.lastLoginAt);

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
        <Link href="/users" className="hover:text-gray-900 transition-colors">
          User
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-amber-600 font-semibold">Profile Detail</span>
      </div>

      {/* Main Profile Header */}
      <UserHeaderProfile user={user} onSelectTab={onTabChange} />

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Joined */}
        <Card className="p-4 bg-white border-gray-100 shadow-xs space-y-1">
          <p className="text-[11px] font-semibold text-gray-500">Joined</p>
          <p className="text-base font-bold text-gray-900">{joinedFormatted}</p>
          {joinedAgo && <p className="text-[11px] text-gray-400">{joinedAgo}</p>}
        </Card>

        {/* Last Active */}
        <Card className="p-4 bg-white border-gray-100 shadow-xs space-y-1">
          <p className="text-[11px] font-semibold text-gray-500">Last Active</p>
          <p className="text-base font-bold text-gray-900">{lastActiveFormatted}</p>
          {lastActiveAgo && <p className="text-[11px] text-gray-400">{lastActiveAgo}</p>}
        </Card>

        {/* Phone Verified */}
        <Card className="p-4 bg-white border-gray-100 shadow-xs space-y-1">
          <p className="text-[11px] font-semibold text-gray-500">Phone Verified</p>
          <p className="text-base font-bold text-gray-900">
            {user.isPhoneVerified !== false ? 'Verified' : 'Unverified'}
          </p>
        </Card>

        {/* Total Bookings */}
        <Card className="p-4 bg-white border-gray-100 shadow-xs space-y-1">
          <p className="text-[11px] font-semibold text-gray-500">Total Bookings</p>
          <p className="text-base font-bold text-gray-900">{user.totalBookings ?? 28}</p>
        </Card>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="bg-white rounded-xl border border-gray-100 p-1 overflow-x-auto shadow-xs">
        <nav className="flex items-center justify-between min-w-max">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex-1 min-w-[120px] py-3 text-xs font-semibold text-center border-b-2 transition-all cursor-pointer ${
                  isActive
                    ? 'border-amber-600 text-amber-600 bg-amber-50/20 rounded-lg'
                    : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50/60 rounded-lg'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
