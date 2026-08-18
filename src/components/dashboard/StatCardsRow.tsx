'use client';

import React from 'react';
import { Users, CalendarCheck, Wallet, Receipt, HeartHandshake, MapPinned, ArrowUp, ArrowDown } from 'lucide-react';
import { Card } from '../ui/card';
import { DashboardStats, Trend } from '../../lib/dashboard/computeDashboardStats';

function formatNumber(n: number): string {
  return Math.round(n).toLocaleString('en-IN');
}

function formatCurrency(n: number): string {
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

function TrendBadge({ trend }: { trend: Trend }) {
  if (trend.kind === 'none') return <span className="text-xs text-gray-400">No change yet</span>;
  if (trend.kind === 'new') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#2E7D32]">
        <ArrowUp className="w-3 h-3" /> New this month
      </span>
    );
  }
  const up = trend.percent >= 0;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${up ? 'text-[#2E7D32]' : 'text-red-500'}`}>
      {up ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
      {Math.abs(trend.percent).toFixed(1)}% <span className="text-gray-400 font-medium">vs last month</span>
    </span>
  );
}

export default function StatCardsRow({ stats }: { stats: DashboardStats }) {
  const cards = [
    {
      label: 'Total Customers',
      value: formatNumber(stats.totalCustomers.value),
      icon: Users,
      trend: <TrendBadge trend={stats.totalCustomers.trend} />,
    },
    {
      label: 'Total Bookings',
      value: formatNumber(stats.totalBookings.value),
      icon: CalendarCheck,
      trend: <TrendBadge trend={stats.totalBookings.trend} />,
    },
    {
      label: 'Total Earnings',
      value: formatCurrency(stats.totalEarnings.value),
      icon: Wallet,
      trend: <TrendBadge trend={stats.totalEarnings.trend} />,
    },
    {
      label: 'Average Order Value',
      value: formatCurrency(stats.avgOrderValue.value),
      icon: Receipt,
      trend: <TrendBadge trend={stats.avgOrderValue.trend} />,
    },
    {
      label: 'Active Partners',
      value: formatNumber(stats.activePartners.value),
      icon: HeartHandshake,
      trend: <TrendBadge trend={stats.activePartners.trend} />,
    },
    {
      label: 'Operational Zones',
      value: formatNumber(stats.operationalZones.value),
      icon: MapPinned,
      trend:
        stats.operationalZones.newThisMonth > 0 ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#2E7D32]">
            <ArrowUp className="w-3 h-3" /> {stats.operationalZones.newThisMonth} new this month
          </span>
        ) : (
          <span className="text-xs text-gray-400">No new zones this month</span>
        ),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((c) => (
        <Card key={c.label} className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500">{c.label}</span>
            <div className="w-8 h-8 rounded-xl bg-[#FAF5F0] flex items-center justify-center text-[#C68A4C] flex-shrink-0">
              <c.icon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 tracking-tight truncate">{c.value}</div>
          <div className="mt-1.5">{c.trend}</div>
        </Card>
      ))}
    </div>
  );
}
