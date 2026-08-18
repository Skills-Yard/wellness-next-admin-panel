'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, TooltipContentProps } from 'recharts';
import { Card } from '../ui/card';

export interface DonutSlice {
  label: string;
  value: number;
  percent: number;
  color: string;
}

interface DonutCardProps {
  title: string;
  badge?: string;
  slices: DonutSlice[];
  centerLabel: string;
  centerValue: string;
  emptyMessage?: string;
}

function DonutTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  const slice = payload[0].payload as unknown as DonutSlice;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-3 py-2 text-xs">
      <div className="font-semibold text-gray-900">{slice.label}</div>
      <div className="text-gray-400">{slice.value.toLocaleString('en-IN')} ({slice.percent.toFixed(1)}%)</div>
    </div>
  );
}

// Shared shell for the three donut charts (Bookings by Service Category, Bookings by Status, New
// vs Returning Customers) — every slice always ships with a colored-dot + label + value legend
// row (never color alone), since a few of the validated slot colors sit under 3:1 contrast on a
// white surface (see palette.ts).
export default function DonutCard({ title, badge, slices, centerLabel, centerValue, emptyMessage }: DonutCardProps) {
  const hasData = slices.some((s) => s.value > 0);

  return (
    <Card className="p-5 sm:p-6 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-gray-800">{title}</h3>
        {badge && (
          <span className="text-[11px] font-medium text-gray-400 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1">{badge}</span>
        )}
      </div>

      {!hasData ? (
        <div className="flex-1 flex items-center justify-center text-xs text-gray-400 py-10">
          {emptyMessage || 'No data yet'}
        </div>
      ) : (
        <>
          <div className="relative h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={slices}
                  dataKey="value"
                  nameKey="label"
                  innerRadius="68%"
                  outerRadius="100%"
                  paddingAngle={2}
                  stroke="#fff"
                  strokeWidth={2}
                >
                  {slices.map((s) => (
                    <Cell key={s.label} fill={s.color} />
                  ))}
                </Pie>
                <Tooltip content={DonutTooltip} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-bold text-gray-900">{centerValue}</span>
              <span className="text-[11px] text-gray-400">{centerLabel}</span>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {slices.map((s) => (
              <div key={s.label} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-gray-600 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                  <span className="truncate">{s.label}</span>
                </span>
                <span className="font-semibold text-gray-800 flex-shrink-0 ml-2">
                  {s.percent.toFixed(1)}% <span className="text-gray-400 font-normal">({s.value.toLocaleString('en-IN')})</span>
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}
