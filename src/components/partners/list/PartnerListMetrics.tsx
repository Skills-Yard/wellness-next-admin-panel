'use client';

import React from 'react';
import { Users, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card } from '../../ui/card';

interface PartnerListMetricsProps {
  totalPartners: number;
  pendingApprovalCount: number;
  activePartnersCount: number;
  suspendedCount: number;
}

export default function PartnerListMetrics({
  totalPartners,
  pendingApprovalCount,
  activePartnersCount,
  suspendedCount,
}: PartnerListMetricsProps) {
  const metrics = [
    { label: 'Total Partners', val: totalPartners, icon: Users, bg: 'bg-orange-50', text: 'text-orange-600' },
    { label: 'Pending Approval', val: pendingApprovalCount, icon: Clock, bg: 'bg-amber-50', text: 'text-amber-600' },
    { label: 'Active Partners', val: activePartnersCount, icon: CheckCircle2, bg: 'bg-emerald-50', text: 'text-emerald-600' },
    { label: 'Suspended', val: suspendedCount, icon: AlertCircle, bg: 'bg-rose-50', text: 'text-rose-600' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((m, i) => {
        const Icon = m.icon;
        return (
          <Card key={i} className="p-5 flex items-center justify-between border-gray-100 shadow-xs">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{m.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{m.val}</p>
            </div>
            <div className={`w-12 h-12 rounded-2xl ${m.bg} flex items-center justify-center ${m.text}`}>
              <Icon className="w-6 h-6" />
            </div>
          </Card>
        );
      })}
    </div>
  );
}
