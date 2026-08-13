'use client';

import React from 'react';
import { Users, CheckCircle2, Hourglass, PauseCircle } from 'lucide-react';
import { Card } from '../../ui/card';
import { User } from '../../../types/user';

interface UserListMetricsProps {
  users: User[];
}

export default function UserListMetrics({ users }: UserListMetricsProps) {
  const totalCount = users.length;
  const activeCount = users.filter((u) => u.isActive && u.isPhoneVerified).length;
  const unverifiedCount = users.filter((u) => !u.isPhoneVerified).length;
  const deactivatedCount = users.filter((u) => !u.isActive || u.status === 'DEACTIVATED').length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Users */}
      <Card className="p-4 sm:p-5 flex items-center gap-4 bg-white border-gray-100 shadow-xs hover:shadow-sm transition-shadow">
        <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0">
          <Users className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500">Total Users</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{totalCount.toLocaleString()}</h3>
        </div>
      </Card>

      {/* Active Users */}
      <Card className="p-4 sm:p-5 flex items-center gap-4 bg-white border-gray-100 shadow-xs hover:shadow-sm transition-shadow">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500">Active Users</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{activeCount.toLocaleString()}</h3>
        </div>
      </Card>

      {/* Unverified Users */}
      <Card className="p-4 sm:p-5 flex items-center gap-4 bg-white border-gray-100 shadow-xs hover:shadow-sm transition-shadow">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
          <Hourglass className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500">Unverified Users</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{unverifiedCount.toLocaleString()}</h3>
        </div>
      </Card>

      {/* Deactivated Users */}
      <Card className="p-4 sm:p-5 flex items-center gap-4 bg-white border-gray-100 shadow-xs hover:shadow-sm transition-shadow">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
          <PauseCircle className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500">Deactivated Users</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{deactivatedCount.toLocaleString()}</h3>
        </div>
      </Card>
    </div>
  );
}
