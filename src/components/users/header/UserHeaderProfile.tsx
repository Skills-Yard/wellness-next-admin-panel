'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, Phone, Mail, ChevronDown, Edit3, Eye, Smartphone, Activity } from 'lucide-react';
import { User } from '../../../types/user';
import { Avatar } from '../../ui/avatar';
import { formatPhone } from '../../../lib/utils';

interface UserHeaderProfileProps {
  user: User;
  onSelectTab?: (tab: string) => void;
}

export default function UserHeaderProfile({ user, onSelectTab }: UserHeaderProfileProps) {
  const [showMoreActions, setShowMoreActions] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowMoreActions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const userName = user.name || 'Unknown User';
  const userIdFormatted = user.accountCode || `USR-${user.id.substring(0, 6).toUpperCase()}`;
  const userPhone = user.phone ? formatPhone(user.phone, user.countryCode) : null;
  const userEmail = user.email || null;
  const userLocation =
    user.locationCity
      ? `${user.locationCity}${user.locationState ? ', ' + user.locationState : ''}`
      : null;
  const isActive = user.isActive;

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 sm:p-6 bg-white rounded-2xl border border-gray-100 shadow-xs">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <Avatar
          src={user.avatarUrl || user.profilePhotoKey || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
          alt={userName}
          fallback={userName.substring(0, 2).toUpperCase()}
          className="w-16 h-16 rounded-2xl border border-gray-200 shadow-xs"
        />

        <div className="space-y-1.5">
          {/* Name + ID + Active Badge */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-lg font-bold text-gray-900">{userName}</h2>
            <span className="text-xs font-medium text-gray-400">ID {userIdFormatted}</span>
            {isActive ? (
              <span className="px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 rounded-full border border-emerald-200/50">
                Active
              </span>
            ) : (
              <span className="px-2.5 py-0.5 text-[11px] font-semibold text-rose-700 bg-rose-100/70 rounded-full border border-rose-200/50">
                Inactive
              </span>
            )}
          </div>

          {/* Contact Details Row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 font-medium">
            {userLocation && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                <span>{userLocation}</span>
              </div>
            )}
            {userPhone && (
              <div className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-gray-400" />
                <span>{userPhone}</span>
              </div>
            )}
            {userEmail && (
              <div className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-gray-400" />
                <span>{userEmail}</span>
              </div>
            )}
            {!userLocation && !userPhone && !userEmail && (
              <span className="text-gray-300 italic">No contact info available</span>
            )}
          </div>
        </div>
      </div>

      {/* Right Controls: Online Status & Action Buttons */}
      <div className="flex flex-col sm:flex-row md:flex-col items-end gap-3 w-full md:w-auto">
        {/* Last Seen Online pill */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>Last seen: Today, 10:30 AM</span>
          <span className="px-2 py-0.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 rounded-full border border-emerald-200">
            Online
          </span>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2.5">
          {/* More Actions Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowMoreActions(!showMoreActions)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <span>More Actions</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
            </button>

            {showMoreActions && (
              <div className="absolute right-0 mt-1.5 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-40 space-y-1 animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={() => {
                    setShowMoreActions(false);
                    if (onSelectTab) onSelectTab('overview');
                  }}
                  className="w-full flex items-start gap-3 px-4 py-2 text-left hover:bg-gray-50 transition-colors"
                >
                  <Eye className="w-4 h-4 text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-gray-900">View Profile</p>
                    <p className="text-[11px] text-gray-400">View full general details</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowMoreActions(false);
                    if (onSelectTab) onSelectTab('devices');
                  }}
                  className="w-full flex items-start gap-3 px-4 py-2 text-left hover:bg-gray-50 transition-colors"
                >
                  <Smartphone className="w-4 h-4 text-purple-600 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-gray-900">View Devices</p>
                    <p className="text-[11px] text-gray-400">View user signed in devices</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowMoreActions(false);
                    if (onSelectTab) onSelectTab('activity');
                  }}
                  className="w-full flex items-start gap-3 px-4 py-2 text-left hover:bg-gray-50 transition-colors"
                >
                  <Activity className="w-4 h-4 text-emerald-600 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-gray-900">Activity Summary</p>
                    <p className="text-[11px] text-gray-400">View user activity summary</p>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Edit User Button */}
          <Link
            href={`/users/${user.id}/edit`}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-gray-800 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-gray-600" />
            <span>Edit User</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
