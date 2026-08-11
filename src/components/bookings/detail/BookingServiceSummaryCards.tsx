'use client';

import React from 'react';
import { Clock, ShoppingBag } from 'lucide-react';
import { Booking } from '../../../types/booking';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Avatar } from '../../ui/avatar';

interface BookingServiceSummaryCardsProps {
  booking: Booking;
}

export default function BookingServiceSummaryCards({ booking }: BookingServiceSummaryCardsProps) {
  const items = booking.items || [];

  if (items.length === 0) {
    return (
      <Card className="p-6 bg-white border-gray-100 shadow-xs text-center text-xs text-gray-400">
        <ShoppingBag className="w-6 h-6 mx-auto mb-1.5 text-gray-300" />
        <p className="font-semibold text-gray-700">No service items recorded for this booking in database</p>
      </Card>
    );
  }

  const getStatusVariant = (status?: string | null) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED': return { variant: 'active' as const, label: 'Completed' };
      case 'IN_PROGRESS': case 'ONGOING': return { variant: 'secondary' as const, label: 'Ongoing' };
      default: return { variant: 'secondary' as const, label: status || 'Upcoming' };
    }
  };

  return (
    <Card className="p-5 bg-white border-gray-100 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm text-gray-900">Booking Summary ({items.length} {items.length === 1 ? 'Service' : 'Services'})</h3>
        <span className="text-xs text-gray-400 font-medium">Database Records</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {items.map((item, idx) => {
          const statusInfo = getStatusVariant(item.status);
          const partnerName = booking.partner?.name || 'Assigned Partner';
          const name = item.serviceItemName || item.serviceItem?.name || item.serviceItem?.cardTitle || 'Service Item';

          return (
            <div key={item.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="w-6 h-6 rounded-full bg-amber-100 text-[#D4A373] text-xs font-bold flex items-center justify-center">
                  {idx + 1}
                </span>
                <Badge variant={statusInfo.variant} className="text-[10px] py-0.5">
                  {statusInfo.label}
                </Badge>
              </div>

              <div>
                <h4 className="font-bold text-xs text-gray-900 line-clamp-1">{name}</h4>
                <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mt-1">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span>{item.scheduledTime || booking.scheduledTime || 'N/A'}</span>
                  <span>({item.durationMinutes || 0} mins)</span>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center gap-2">
                <Avatar src={booking.partner?.profilePhotoKey || undefined} fallback={partnerName.slice(0, 2).toUpperCase()} className="w-6 h-6 border border-gray-200" />
                <span className="text-[11px] font-semibold text-gray-700 truncate">{partnerName}</span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
