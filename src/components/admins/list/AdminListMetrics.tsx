'use client';

import React from 'react';
import { ShieldCheck, CheckCircle2, ShieldAlert, PauseCircle } from 'lucide-react';
import { Card } from '../../ui/card';
import { Admin } from '../../../types/admin';

interface AdminListMetricsProps {
  admins: Admin[];
}

export default function AdminListMetrics({ admins }: AdminListMetricsProps) {
  const totalCount = admins.length;
  const activeCount = admins.filter((a) => a.isActive).length;
  const superAdminCount = admins.filter((a) => a.role === 'SUPER_ADMIN').length;
  const inactiveCount = admins.filter((a) => !a.isActive).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="p-4 sm:p-5 flex items-center gap-4 bg-white border-gray-100 shadow-xs hover:shadow-sm transition-shadow">
        <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500">Total Admins</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{totalCount.toLocaleString()}</h3>
        </div>
      </Card>

      <Card className="p-4 sm:p-5 flex items-center gap-4 bg-white border-gray-100 shadow-xs hover:shadow-sm transition-shadow">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500">Active Admins</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{activeCount.toLocaleString()}</h3>
        </div>
      </Card>

      <Card className="p-4 sm:p-5 flex items-center gap-4 bg-white border-gray-100 shadow-xs hover:shadow-sm transition-shadow">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500">Super Admins</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{superAdminCount.toLocaleString()}</h3>
        </div>
      </Card>

      <Card className="p-4 sm:p-5 flex items-center gap-4 bg-white border-gray-100 shadow-xs hover:shadow-sm transition-shadow">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
          <PauseCircle className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500">Inactive Admins</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{inactiveCount.toLocaleString()}</h3>
        </div>
      </Card>
    </div>
  );
}
