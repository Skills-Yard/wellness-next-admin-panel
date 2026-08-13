'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Copy, Check, Edit3, PhoneCall, UserX, Smartphone } from 'lucide-react';
import { User } from '../../../types/user';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';

interface UserOverviewTabProps {
  user: User;
  onDeactivate?: () => void;
  onVerifyPhone?: () => void;
  onSelectTab?: (tab: string) => void;
}

export default function UserOverviewTab({
  user,
  onDeactivate,
  onVerifyPhone,
  onSelectTab,
}: UserOverviewTabProps) {
  const [copied, setCopied] = useState(false);

  const referralCode = user.referralCode || 'ANITAV124';
  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const accountId = user.accountCode || `USR-${user.id.substring(0, 6).toUpperCase()}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Contact & Identity (Col span 2) */}
      <Card className="lg:col-span-2 p-6 bg-white border-gray-100 shadow-xs space-y-6">
        <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
          Contact & Identity
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-8 text-xs">
          {/* Row 1 */}
          <div>
            <p className="text-gray-400 font-medium mb-1">Name</p>
            <p className="font-semibold text-gray-900 text-sm">{user.name || 'Anita Verma'}</p>
          </div>
          <div>
            <p className="text-gray-400 font-medium mb-1">Status</p>
            <p className="font-semibold text-emerald-600 text-sm">{user.isActive ? 'Active' : 'Inactive'}</p>
          </div>

          {/* Row 2 */}
          <div>
            <p className="text-gray-400 font-medium mb-1">Email</p>
            <p className="font-semibold text-gray-900">{user.email || '—'}</p>
          </div>
          <div>
            <p className="text-gray-400 font-medium mb-1">Profile Complete</p>
            <p className="font-semibold text-gray-900">{user.isProfileComplete ? 'Yes' : 'No'}</p>
          </div>

          {/* Row 3 */}
          <div>
            <p className="text-gray-400 font-medium mb-1">Phone</p>
            <p className="font-semibold text-gray-900">
              {user.phone ? `${user.countryCode || '+91'} ${user.phone}` : '—'}
            </p>
          </div>
          <div>
            <p className="text-gray-400 font-medium mb-1">Account ID</p>
            <p className="font-semibold text-gray-900">{accountId}</p>
          </div>

          {/* Row 4 */}
          <div>
            <p className="text-gray-400 font-medium mb-1">Phone (Secondary)</p>
            <p className="font-semibold text-gray-900">{user.secondaryPhone || '—'}</p>
          </div>
          <div>
            <p className="text-gray-400 font-medium mb-1">Users Referred</p>
            <p className="font-semibold text-gray-900">{user.userReferredCount ?? 0}</p>
          </div>

          {/* Row 5 */}
          <div>
            <p className="text-gray-400 font-medium mb-1">Date of Birth</p>
            <p className="font-semibold text-gray-900">
              {user.dateOfBirth
                ? new Date(user.dateOfBirth).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                : '08 Aug 1990'}
            </p>
          </div>
          <div>
            <p className="text-gray-400 font-medium mb-1">Referral code</p>
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900">{referralCode}</span>
              <button
                onClick={handleCopy}
                className="text-gray-400 hover:text-amber-600 transition-colors p-1 cursor-pointer"
                title="Copy referral code"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Right Column: Quick Actions & Activity Snapshot */}
      <div className="space-y-6">
        {/* Quick Actions Card */}
        <Card className="p-6 bg-white border-gray-100 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-gray-900">Quick Actions</h3>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" size="sm" className="text-xs gap-2 h-auto py-3" asChild>
              <Link href={`/users/${user.id}/edit`}>
                <Edit3 className="w-3.5 h-3.5 text-gray-500" />
                <span>Edit User</span>
              </Link>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-2 h-auto py-3"
              onClick={onVerifyPhone}
            >
              <PhoneCall className="w-3.5 h-3.5 text-gray-500" />
              <span>Verify Phone</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-2 h-auto py-3 text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700"
              onClick={onDeactivate}
            >
              <UserX className="w-3.5 h-3.5" />
              <span>Deactivate User</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-2 h-auto py-3"
              onClick={() => onSelectTab && onSelectTab('devices')}
            >
              <Smartphone className="w-3.5 h-3.5 text-gray-500" />
              <span>View Devices</span>
            </Button>
          </div>
        </Card>

        {/* Activity Snapshot Card */}
        <Card className="p-6 bg-white border-gray-100 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-gray-900">Activity Snapshot</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-bold text-gray-900">{user.totalBookings ?? 24}</p>
              <p className="text-[11px] font-semibold text-gray-500 mt-0.5">Total booking</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">{user.completedBookings ?? 20}</p>
              <p className="text-[11px] font-semibold text-gray-500 mt-0.5">Completed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">₹{(user.lifetimeSpend ?? 32450).toLocaleString()}</p>
              <p className="text-[11px] font-semibold text-gray-500 mt-0.5">Lifetime spend</p>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-2xl font-bold text-gray-900">{user.averageRating ?? 4.6}</span>
                <span className="text-amber-500 text-sm">★</span>
              </div>
              <p className="text-[11px] font-semibold text-gray-500 mt-0.5">Average rating</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
