'use client';

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TooltipContentProps } from 'recharts';
import { Card } from '../ui/card';
import { CHART_INK } from './palette';

interface EarningsChartProps {
  data: { date: string; earnings: number }[];
  totalEarnings: number;
}

function formatCompactCurrency(n: number): string {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n}`;
}

function ChartTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-3 py-2 text-xs">
      <div className="text-gray-400 mb-0.5">{label}</div>
      <div className="font-bold text-gray-900">₹{Number(payload[0].value).toLocaleString('en-IN')}</div>
    </div>
  );
}

export default function EarningsChart({ data, totalEarnings }: EarningsChartProps) {
  // Thin every-few-days so the x-axis doesn't collide over 30 daily points, matching the
  // marks-and-anatomy guidance to keep axis ticks recessive and legible rather than dense.
  const tickInterval = Math.max(0, Math.floor(data.length / 6) - 1);

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-bold text-gray-800">Earnings Overview</h3>
        <span className="text-[11px] font-medium text-gray-400 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1">Last 30 days</span>
      </div>
      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-2xl font-bold text-gray-900">₹{Math.round(totalEarnings).toLocaleString('en-IN')}</span>
        <span className="text-xs text-gray-400">Total earnings</span>
      </div>
      <div className="h-64 -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="earningsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C68A4C" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#C68A4C" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke={CHART_INK.gridline} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: CHART_INK.muted }}
              tickLine={false}
              axisLine={{ stroke: CHART_INK.gridline }}
              interval={tickInterval}
            />
            <YAxis
              tick={{ fontSize: 11, fill: CHART_INK.muted }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatCompactCurrency}
              width={48}
            />
            <Tooltip content={ChartTooltip} cursor={{ stroke: CHART_INK.muted, strokeDasharray: '3 3' }} />
            <Area
              type="monotone"
              dataKey="earnings"
              stroke="#C68A4C"
              strokeWidth={2}
              fill="url(#earningsFill)"
              activeDot={{ r: 4, fill: '#C68A4C', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
