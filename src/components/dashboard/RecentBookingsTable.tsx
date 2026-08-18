'use client';

import React from 'react';
import { Card } from '../ui/card';
import { Booking } from '../../types/booking';
import { statusBucket } from '../../lib/dashboard/computeDashboardStats';
import { STATUS_COLORS } from './palette';

function initials(name?: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
}

function formatWhen(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  const time = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  if (sameDay) return `Today, ${time}`;
  if (isYesterday) return `Yesterday, ${time}`;
  return `${d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}, ${time}`;
}

export default function RecentBookingsTable({ bookings }: { bookings: Booking[] }) {
  return (
    <Card className="p-5 sm:p-6">
      <h3 className="text-sm font-bold text-gray-800 mb-4">Recent Bookings</h3>

      {bookings.length === 0 ? (
        <p className="text-xs text-gray-400 py-8 text-center">No bookings yet.</p>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => {
            const bucket = statusBucket(b.status);
            const color = STATUS_COLORS[bucket] || STATUS_COLORS['Refunded'];
            const service = b.items?.[0];
            return (
              <div key={b.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#FAF5F0] text-[#C68A4C] text-[11px] font-bold flex items-center justify-center flex-shrink-0 uppercase">
                  {initials(b.user?.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-gray-800 truncate">{b.user?.name || 'Guest'}</div>
                  <div className="text-[11px] text-gray-400 truncate">
                    {service?.serviceItemName || 'Service'}
                    {service?.durationMinutes ? ` · ${service.durationMinutes} mins` : ''}
                  </div>
                </div>
                <div className="text-right flex-shrink-0 hidden sm:block">
                  <div className="text-[11px] text-gray-400">{formatWhen(b.createdAt)}</div>
                  <span
                    className="inline-block mt-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ color, backgroundColor: `${color}1A` }}
                  >
                    {bucket}
                  </span>
                </div>
                <div className="text-xs font-bold text-gray-900 flex-shrink-0">₹{b.totalAmount.toLocaleString('en-IN')}</div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
