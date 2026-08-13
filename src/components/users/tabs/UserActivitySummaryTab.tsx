'use client';

import React from 'react';
import { CheckCircle2, XCircle, Wallet, Star, Ticket, Calendar, ShoppingCart } from 'lucide-react';
import { User } from '../../../types/user';
import { Card } from '../../ui/card';

interface UserActivitySummaryTabProps {
  user: User;
}

export default function UserActivitySummaryTab({ user }: UserActivitySummaryTabProps) {
  const completeBookings = user.completedBookings ?? 24;
  const canceledBookings = user.canceledBookings ?? 4;
  const lifetimeSpend = user.lifetimeSpend ?? 32400;
  const averageRating = user.averageRating ?? 4.6;

  // Trend data points for svg chart
  const points = [
    { label: 'Jan', value: 10, x: 50, y: 120 },
    { label: 'Feb', value: 14, x: 150, y: 90 },
    { label: 'Mar', value: 14, x: 250, y: 90 },
    { label: 'Apr', value: 20, x: 350, y: 40 },
    { label: 'May', value: 15, x: 450, y: 80 },
  ];

  return (
    <div className="space-y-6">
      {/* 7 Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Complete Bookings */}
        <Card className="p-4 flex items-center gap-4 bg-white border-gray-100 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-500">Complete Bookings</p>
            <h3 className="text-xl font-bold text-gray-900 mt-0.5">{completeBookings}</h3>
          </div>
        </Card>

        {/* Canceled Booking */}
        <Card className="p-4 flex items-center gap-4 bg-white border-gray-100 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center flex-shrink-0">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-500">Canceled Booking</p>
            <h3 className="text-xl font-bold text-gray-900 mt-0.5">{canceledBookings}</h3>
          </div>
        </Card>

        {/* Lifetime Spend */}
        <Card className="p-4 flex items-center gap-4 bg-white border-gray-100 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-500">Lifetime Spend</p>
            <h3 className="text-xl font-bold text-gray-900 mt-0.5">₹{lifetimeSpend.toLocaleString()}</h3>
          </div>
        </Card>

        {/* Average Rating */}
        <Card className="p-4 flex items-center gap-4 bg-white border-gray-100 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center flex-shrink-0">
            <Star className="w-6 h-6 fill-amber-400" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-500">Average Rating</p>
            <h3 className="text-xl font-bold text-gray-900 mt-0.5">{averageRating}</h3>
            <p className="text-[10px] text-gray-400">Based on 21 reviews</p>
          </div>
        </Card>

        {/* Coupons Redeemed */}
        <Card className="p-4 flex items-center gap-4 bg-white border-gray-100 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center flex-shrink-0">
            <Ticket className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-500">Coupons Redeemed</p>
            <h3 className="text-xl font-bold text-gray-900 mt-0.5">7</h3>
          </div>
        </Card>

        {/* Active Plans */}
        <Card className="p-4 flex items-center gap-4 bg-white border-gray-100 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-500">Active Plans</p>
            <h3 className="text-xl font-bold text-gray-900 mt-0.5">1</h3>
          </div>
        </Card>

        {/* Cart Status */}
        <Card className="p-4 flex items-center gap-4 bg-white border-gray-100 shadow-xs sm:col-span-2 lg:col-span-2">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-500">Cart Status</p>
            <h3 className="text-lg font-bold text-gray-900 mt-0.5">No Active Cart</h3>
          </div>
        </Card>
      </div>

      {/* Booking Trend Line Chart */}
      <Card className="p-6 bg-white border-gray-100 shadow-xs space-y-6">
        <h3 className="text-sm font-bold text-gray-900">Booking Trend</h3>

        <div className="relative w-full h-64 pt-4">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 500 160">
            {/* Horizontal Grid lines */}
            <line x1="0" y1="40" x2="500" y2="40" stroke="#F3F4F6" strokeDasharray="4 4" />
            <line x1="0" y1="80" x2="500" y2="80" stroke="#F3F4F6" strokeDasharray="4 4" />
            <line x1="0" y1="120" x2="500" y2="120" stroke="#F3F4F6" strokeDasharray="4 4" />

            {/* Y axis labels */}
            <text x="5" y="44" fill="#9CA3AF" fontSize="10" fontWeight="600">20</text>
            <text x="5" y="84" fill="#9CA3AF" fontSize="10" fontWeight="600">15</text>
            <text x="5" y="124" fill="#9CA3AF" fontSize="10" fontWeight="600">10</text>

            {/* Trend line */}
            <path
              d="M 50 120 L 150 90 L 250 90 L 350 40 L 450 80"
              fill="none"
              stroke="#F59E0B"
              strokeWidth="2"
              strokeDasharray="4 4"
            />

            {/* Data points */}
            {points.map((pt, idx) => (
              <g key={idx}>
                <circle cx={pt.x} cy={pt.y} r="5" fill="#D97706" stroke="#FFFFFF" strokeWidth="2" />
                <text x={pt.x} y="155" textAnchor="middle" fill="#6B7280" fontSize="10" fontWeight="500">
                  {pt.label}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </Card>
    </div>
  );
}
