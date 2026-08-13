'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, CheckCircle2, AlertCircle, Eye, Edit3, Smartphone, Activity, UserX } from 'lucide-react';
import { User } from '../../../types/user';
import { Avatar } from '../../ui/avatar';
import { Badge } from '../../ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '../../ui/dropdown-menu';

interface UserListRowProps {
  user: User;
  onDeactivate: (user: User) => void;
}

function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 30) return `${Math.floor(days / 30)}mo ago`;
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return 'Just now';
}

export default function UserListRow({ user, onDeactivate }: UserListRowProps) {
  const router = useRouter();

  const userIdFormatted = user.accountCode || `USR-${user.id.substring(0, 6).toUpperCase()}`;
  const userName = user.name || 'Unknown User';
  const userPhone = user.phone ? `${user.countryCode || '+91'}+${user.phone}` : '—';
  const userEmail = user.email || '—';
  const isVerified = user.isPhoneVerified ?? false;
  const isActive = user.isActive ?? false;
  // Backend uses createdAt as the account creation/joined date; lastLoginAt for last seen
  const joinedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';
  const lastSeenDate = user.lastLoginAt
    ? new Date(user.lastLoginAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';
  // Booking count: from _count.bookings (when backend supports it) or direct field
  const bookingCount = user._count?.bookings ?? user.totalBookings ?? 0;

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors text-xs text-gray-700">
      {/* User Avatar + Name + ID */}
      <td className="py-3.5 px-4 font-medium text-gray-900">
        <Link href={`/users/${user.id}`} className="flex items-center gap-3 group">
          <Avatar
            src={user.avatarUrl || user.profilePhotoKey || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'}
            alt={userName}
            fallback={userName.substring(0, 2).toUpperCase()}
            className="w-10 h-10 border border-gray-200"
          />
          <div>
            <p className="font-semibold text-gray-900 group-hover:text-amber-600 transition-colors">
              {userName}
            </p>
            <p className="text-[11px] text-gray-400 font-normal">{userIdFormatted}</p>
          </div>
        </Link>
      </td>

      {/* Contact */}
      <td className="py-3.5 px-4">
        <p className="font-medium text-gray-800">{userPhone}</p>
        <p className="text-[11px] text-gray-400">{userEmail}</p>
      </td>

      {/* Phone Verified Badge */}
      <td className="py-3.5 px-4">
        {isVerified ? (
          <Badge variant="active" className="gap-1 text-[11px] px-2 py-0.5 rounded-md">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Verified
          </Badge>
        ) : (
          <Badge variant="destructive" className="gap-1 text-[11px] px-2 py-0.5 rounded-md">
            <AlertCircle className="w-3.5 h-3.5" />
            Unverified
          </Badge>
        )}
      </td>

      {/* Joined */}
      <td className="py-3.5 px-4">
        <p className="font-medium text-gray-900">{joinedDate}</p>
        <p className="text-[11px] text-gray-400">{timeAgo(user.createdAt)}</p>
      </td>

      {/* Status */}
      <td className="py-3.5 px-4">
        {isActive ? (
          <Badge variant="active" className="text-[11px] rounded-full">Active</Badge>
        ) : (
          <Badge variant="inactive" className="text-[11px] rounded-full">Inactive</Badge>
        )}
      </td>

      {/* Last Seen */}
      <td className="py-3.5 px-4">
        <p className="font-medium text-gray-900">{lastSeenDate}</p>
        <p className="text-[11px] text-gray-400">{timeAgo(user.lastLoginAt)}</p>
      </td>

      {/* Booking Count */}
      <td className="py-3.5 px-4 font-semibold text-gray-900">
        {bookingCount}
      </td>

      {/* Actions — shadcn DropdownMenu */}
      <td className="py-3.5 px-4 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>User Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/users/${user.id}`} className="flex items-center gap-2 text-xs font-medium">
                <Eye className="w-3.5 h-3.5 text-amber-600" />
                View Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/users/${user.id}/edit`} className="flex items-center gap-2 text-xs font-medium">
                <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                Edit User
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/users/${user.id}?tab=devices`} className="flex items-center gap-2 text-xs font-medium">
                <Smartphone className="w-3.5 h-3.5 text-purple-600" />
                View Devices
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/users/${user.id}?tab=activity`} className="flex items-center gap-2 text-xs font-medium">
                <Activity className="w-3.5 h-3.5 text-emerald-600" />
                Activity Summary
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-xs font-medium text-rose-600 focus:text-rose-600 focus:bg-rose-50"
              onClick={() => onDeactivate(user)}
            >
              <UserX className="w-3.5 h-3.5 text-rose-600" />
              Deactivate User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}

