'use client';

import React from 'react';
import { Calendar, Clock, Sparkles, TrendingUp } from 'lucide-react';
import { Card } from '../../ui/card';

interface BookingListMetricsProps {
  activeBookings: number;
  ongoingServices: number;
  todaysServices: number;
  totalActiveRevenue: number;
}

export default function BookingListMetrics({
  activeBookings,
  ongoingServices,
  todaysServices,
  totalActiveRevenue,
}: BookingListMetricsProps) {
  const metrics = [
    { label: 'Active Bookings', val: activeBookings.toLocaleString(), icon: Calendar, bg: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    { label: 'Ongoing Services', val: ongoingServices.toLocaleString(), icon: Clock, bg: 'bg-amber-50 text-amber-700 border-amber-100' },
    { label: 'Total Services', val: todaysServices.toLocaleString(), icon: Sparkles, bg: 'bg-orange-50 text-orange-600 border-orange-100' },
    { label: 'Total Revenue', val: `₹${totalActiveRevenue.toLocaleString()}`, icon: TrendingUp, bg: 'bg-blue-50 text-blue-600 border-blue-100' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((m, i) => {
        const Icon = m.icon;
        return (
          <Card key={i} className="p-5 flex items-center justify-between border border-gray-100 shadow-2xs hover:shadow-md transition-all duration-200 bg-white rounded-2xl">
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{m.label}</p>
              <p className="text-2xl font-black text-gray-900 tracking-tight">{m.val}</p>
            </div>
            <div className={`w-12 h-12 rounded-2xl ${m.bg} border flex items-center justify-center shadow-xs shrink-0`}>
              <Icon className="w-6 h-6" />
            </div>
          </Card>
        );
      })}
    </div>
  );
}
