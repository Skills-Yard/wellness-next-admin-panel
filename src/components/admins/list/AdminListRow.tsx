'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';
import { Admin } from '../../../types/admin';
import { Avatar } from '../../ui/avatar';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';

interface AdminListRowProps {
  admin: Admin;
  // The row for the currently signed-in admin — delete is disabled on it rather than hidden, so
  // it's still obvious it's you, not just missing from the list.
  isSelf: boolean;
  deleting: boolean;
  onDelete: (admin: Admin) => void;
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

const roleLabel = (role: string) => role.replace(/_/g, ' ').toLowerCase();

export default function AdminListRow({ admin, isSelf, deleting, onDelete }: AdminListRowProps) {
  const joinedDate = admin.createdAt
    ? new Date(admin.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';
  const lastLoginDate = admin.lastLoginAt
    ? new Date(admin.lastLoginAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors text-xs text-gray-700">
      <td className="py-3.5 px-4 font-medium text-gray-900">
        <div className="flex items-center gap-3">
          <Avatar fallback={admin.name.substring(0, 2).toUpperCase()} className="w-10 h-10 border border-gray-200" />
          <div>
            <p className="font-semibold text-gray-900 flex items-center gap-1.5">
              {admin.name}
              {isSelf && <span className="text-[10px] font-medium text-gray-400">(You)</span>}
            </p>
            <p className="text-[11px] text-gray-400 font-normal">{admin.email}</p>
          </div>
        </div>
      </td>

      <td className="py-3.5 px-4">
        <Badge variant={admin.role === 'SUPER_ADMIN' ? 'destructive' : 'secondary'} className="capitalize">
          {roleLabel(admin.role)}
        </Badge>
      </td>

      <td className="py-3.5 px-4">
        {admin.isActive ? (
          <Badge variant="active" className="text-[11px] rounded-full">Active</Badge>
        ) : (
          <Badge variant="inactive" className="text-[11px] rounded-full">Inactive</Badge>
        )}
      </td>

      <td className="py-3.5 px-4">
        <p className="font-medium text-gray-900">{lastLoginDate}</p>
        <p className="text-[11px] text-gray-400">{timeAgo(admin.lastLoginAt)}</p>
      </td>

      <td className="py-3.5 px-4">
        <p className="font-medium text-gray-900">{joinedDate}</p>
        <p className="text-[11px] text-gray-400">{timeAgo(admin.createdAt)}</p>
      </td>

      <td className="py-3.5 px-4 text-right">
        <Button
          variant="destructive"
          size="icon"
          disabled={isSelf || deleting}
          onClick={() => onDelete(admin)}
          className="bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 border-none disabled:opacity-40"
          title={isSelf ? "You can't delete your own account here" : 'Delete Admin'}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </td>
    </tr>
  );
}
