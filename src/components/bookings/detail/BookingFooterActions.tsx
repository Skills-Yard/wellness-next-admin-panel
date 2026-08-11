'use client';

import React from 'react';
import { Calendar, Edit3, UserCheck, CheckCircle2 } from 'lucide-react';
import { Button } from '../../ui/button';

interface BookingFooterActionsProps {
  onReschedule?: () => void;
  onEditSlots?: () => void;
  onReassignPartner?: () => void;
  onMarkCompleted?: () => void;
}

export default function BookingFooterActions({
  onReschedule,
  onEditSlots,
  onReassignPartner,
  onMarkCompleted,
}: BookingFooterActionsProps) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2.5">
        <Button variant="outline" size="sm" onClick={onReschedule} className="h-9 text-xs font-semibold">
          <Calendar className="w-4 h-4 mr-1 text-gray-500" />
          <span>Reschedule Entire Booking</span>
        </Button>
        <Button variant="outline" size="sm" onClick={onEditSlots} className="h-9 text-xs font-semibold">
          <Edit3 className="w-4 h-4 mr-1 text-gray-500" />
          <span>Edit Individual Service Slots</span>
        </Button>
        <Button variant="outline" size="sm" onClick={onReassignPartner} className="h-9 text-xs font-semibold">
          <UserCheck className="w-4 h-4 mr-1 text-gray-500" />
          <span>Reassign Partner</span>
        </Button>
      </div>

      <Button size="sm" onClick={onMarkCompleted} className="h-9 px-5 bg-[#1C1512] hover:bg-[#2D231E] text-white text-xs font-bold shadow-sm">
        <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-400" />
        <span>Mark Booking Completed</span>
      </Button>
    </div>
  );
}
