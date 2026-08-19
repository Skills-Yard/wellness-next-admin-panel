'use client';

import React, { useState } from 'react';
import { Edit2, Loader2 } from 'lucide-react';
import { Partner, PartnerAvailabilityItem, DayOfWeek } from '../../../types/partner';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';

interface PartnerScheduleTabProps {
  partner: Partner;
  availability: PartnerAvailabilityItem[];
  onSetAvailability: (schedules: PartnerAvailabilityItem[]) => Promise<void>;
}

const DEFAULT_DAYS: { day: DayOfWeek; name: string }[] = [
  { day: 'MON', name: 'Monday' },
  { day: 'TUE', name: 'Tuesday' },
  { day: 'WED', name: 'Wednesday' },
  { day: 'THU', name: 'Thursday' },
  { day: 'FRI', name: 'Friday' },
  { day: 'SAT', name: 'Saturday' },
  { day: 'SUN', name: 'Sunday' },
];

export default function PartnerScheduleTab({
  partner,
  availability,
  onSetAvailability,
}: PartnerScheduleTabProps) {
  const [editingDay, setEditingDay] = useState<DayOfWeek | null>(null);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [saving, setSaving] = useState(false);

  const availabilityMap = new Map<DayOfWeek, PartnerAvailabilityItem>();
  availability.forEach((item) => availabilityMap.set(item.dayOfWeek, item));

  const handleSaveDay = async (day: DayOfWeek) => {
    setSaving(true);
    try {
      const updated: PartnerAvailabilityItem[] = DEFAULT_DAYS.map(({ day: d }) => {
        if (d === day) return { dayOfWeek: d, startTime, endTime, isActive: true };
        return availabilityMap.get(d) || { dayOfWeek: d, startTime: '09:00', endTime: '18:00', isActive: true };
      });
      await onSetAvailability(updated);
      setEditingDay(null);
      // onSetAvailability already patches `availability` state from its own response (see
      // handleSetAvailability in the partner detail page) — no separate refresh needed here.
    } finally { setSaving(false); }
  };

  const handleToggleDay = async (day: DayOfWeek) => {
    setSaving(true);
    try {
      const updated: PartnerAvailabilityItem[] = DEFAULT_DAYS.map(({ day: d }) => {
        const ex = availabilityMap.get(d);
        if (d === day) return { dayOfWeek: d, startTime: ex?.startTime || '09:00', endTime: ex?.endTime || '18:00', isActive: !ex?.isActive };
        return ex || { dayOfWeek: d, startTime: '09:00', endTime: '18:00', isActive: true };
      });
      await onSetAvailability(updated);
    } finally { setSaving(false); }
  };

  const formatTime = (t: string) => {
    if (!t) return '9:00 AM';
    const [h, m] = t.split(':').map(Number);
    return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
  };

  return (
    <Card className="p-6 shadow-xs space-y-5 bg-white border-gray-100">
      <div>
        <h3 className="font-bold text-base text-gray-900">Weekly Schedule</h3>
        <p className="text-xs text-gray-500 mt-0.5">Manage partner working hours and weekly availability</p>
      </div>

      <div className="overflow-x-auto border border-gray-100 rounded-xl">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-gray-50/70 border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              <th className="py-3 px-6">Day</th>
              <th className="py-3 px-6">Start Time</th>
              <th className="py-3 px-6">End Time</th>
              <th className="py-3 px-6">Status</th>
              <th className="py-3 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700">
            {DEFAULT_DAYS.map(({ day, name }) => {
              const item = availabilityMap.get(day);
              const isActive = item?.isActive ?? false;
              const isEditing = editingDay === day;

              return (
                <tr key={day} className="hover:bg-gray-50/60 transition-colors">
                  <td className="py-3.5 px-6 font-semibold text-gray-900">{name}</td>
                  <td className="py-3.5 px-6">
                    {isEditing ? <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-28 h-8 text-xs" /> : formatTime(item?.startTime || '09:00')}
                  </td>
                  <td className="py-3.5 px-6">
                    {isEditing ? <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-28 h-8 text-xs" /> : formatTime(item?.endTime || '18:00')}
                  </td>
                  <td className="py-3.5 px-6">
                    <button onClick={() => handleToggleDay(day)} className="cursor-pointer">
                      <Badge variant={isActive ? 'active' : 'inactive'}>{isActive ? 'Available' : 'Day Off'}</Badge>
                    </button>
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    {isEditing ? (
                      <Button size="sm" onClick={() => handleSaveDay(day)} disabled={saving} className="h-7 text-xs px-3">
                        {saving && <Loader2 className="w-3 h-3 animate-spin" />} Save
                      </Button>
                    ) : (
                      <button onClick={() => { setEditingDay(day); setStartTime(item?.startTime || '09:00'); setEndTime(item?.endTime || '18:00'); }} className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
