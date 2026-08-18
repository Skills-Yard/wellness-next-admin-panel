'use client';

import React from 'react';
import { Card } from '../ui/card';
import { DashboardStats } from '../../lib/dashboard/computeDashboardStats';

export default function TopPerformingServices({ services }: { services: DashboardStats['topServices'] }) {
  return (
    <Card className="p-5 sm:p-6">
      <h3 className="text-sm font-bold text-gray-800 mb-4">Top Performing Services</h3>

      {services.length === 0 ? (
        <p className="text-xs text-gray-400 py-8 text-center">No service-level booking data yet.</p>
      ) : (
        <div className="space-y-1">
          {services.map((s, i) => (
            <div key={s.name} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
              <span className="w-6 h-6 rounded-lg bg-[#FAF5F0] text-[#C68A4C] text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-gray-800 truncate">{s.name}</div>
                <div className="text-[11px] text-gray-400 truncate">{s.category}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-xs font-bold text-gray-900">₹{s.revenue.toLocaleString('en-IN')}</div>
                <div className="text-[11px] text-gray-400">{s.bookings.toLocaleString('en-IN')} bookings</div>
              </div>
              {s.trend.kind === 'percent' && (
                <span className={`text-[11px] font-semibold w-14 text-right flex-shrink-0 ${s.trend.percent >= 0 ? 'text-[#2E7D32]' : 'text-red-500'}`}>
                  {s.trend.percent >= 0 ? '↑' : '↓'} {Math.abs(s.trend.percent).toFixed(1)}%
                </span>
              )}
              {s.trend.kind === 'new' && (
                <span className="text-[11px] font-semibold w-14 text-right flex-shrink-0 text-[#2E7D32]">New</span>
              )}
              {s.trend.kind === 'none' && <span className="w-14 flex-shrink-0" />}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
