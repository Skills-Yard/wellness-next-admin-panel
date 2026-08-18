'use client';

import React from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, TooltipContentProps } from 'recharts';
import { Card } from '../ui/card';
import { CHART_INK } from './palette';

interface BookingsOverviewChartProps {
  data: { label: string; bookings: number; completed: number }[];
  totalBookings: number;
  changePercent: number | null;
}

function ChartTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-3 py-2 text-xs space-y-1">
      <div className="text-gray-400 mb-0.5">{label}</div>
      {payload.map((p) => (
        <div key={String(p.name ?? p.dataKey)} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-gray-600">{p.name}:</span>
          <span className="font-bold text-gray-900">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

// Bar (all bookings) and Line (completed bookings) share one axis — both are the same unit
// (booking count for that week) — never two y-scales for two different measures.
export default function BookingsOverviewChart({ data, totalBookings, changePercent }: BookingsOverviewChartProps) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-bold text-gray-800">Bookings Overview</h3>
        <span className="text-[11px] font-medium text-gray-400 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1">Last 6 weeks</span>
      </div>
      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-2xl font-bold text-gray-900">{totalBookings.toLocaleString('en-IN')}</span>
        {changePercent !== null && (
          <span className={`text-xs font-semibold ${changePercent >= 0 ? 'text-[#2E7D32]' : 'text-red-500'}`}>
            {changePercent >= 0 ? '↑' : '↓'} {Math.abs(changePercent).toFixed(1)}% <span className="text-gray-400 font-medium">vs previous week</span>
          </span>
        )}
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
            <CartesianGrid vertical={false} stroke={CHART_INK.gridline} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: CHART_INK.muted }} tickLine={false} axisLine={{ stroke: CHART_INK.gridline }} />
            <YAxis tick={{ fontSize: 11, fill: CHART_INK.muted }} tickLine={false} axisLine={false} />
            <Tooltip content={ChartTooltip} cursor={{ fill: '#FAF5F0' }} />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 11, color: CHART_INK.secondary, paddingTop: 8 }}
            />
            <Bar dataKey="bookings" name="Bookings" fill="#F2D9BC" radius={[4, 4, 0, 0]} maxBarSize={28} />
            <Line
              type="monotone"
              dataKey="completed"
              name="Completed Bookings"
              stroke="#C68A4C"
              strokeWidth={2}
              dot={{ r: 3, fill: '#C68A4C', strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
