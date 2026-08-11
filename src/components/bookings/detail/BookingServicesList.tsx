'use client';

import React from 'react';
import { ShieldCheck, ChevronRight, ShoppingBag } from 'lucide-react';
import { Booking } from '../../../types/booking';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Avatar } from '../../ui/avatar';

interface BookingServicesListProps {
  booking: Booking;
}

export default function BookingServicesList({ booking }: BookingServicesListProps) {
  const items = booking.items || [];

  if (items.length === 0) {
    return (
      <Card className="p-8 bg-white border-gray-100 shadow-xs text-center text-xs text-gray-400">
        <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-gray-300" />
        <p className="font-bold text-sm text-gray-700">No Services Found</p>
      </Card>
    );
  }

  const totalDurationMinutes = items.reduce((sum, item) => sum + (item.durationMinutes || 0), 0);
  const totalHours = Math.floor(totalDurationMinutes / 60);
  const totalMins = totalDurationMinutes % 60;
  const durationText = `${totalHours > 0 ? `${totalHours} hr ` : ''}${totalMins} min`;

  return (
    <Card className="p-6 bg-white border-gray-100 shadow-xs space-y-5">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <h3 className="font-bold text-base text-gray-900">Services ({items.length})</h3>
        <Badge variant="secondary">Itemized Breakdown</Badge>
      </div>

      <div className="space-y-3">
        {items.map((item, idx) => {
          const partnerName = booking.partner?.name || 'Unassigned';
          const name = item.serviceItemName || item.serviceItem?.name || item.serviceItem?.cardTitle || 'Service';
          const priceDisplay = item.customPrice ? `₹${(item.customPrice / 100).toLocaleString()}` : `₹${(booking.totalAmount || 0).toLocaleString()}`;
          return (
            <div key={item.id} className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-[#D4A373] text-xs font-bold flex items-center justify-center shrink-0">
                  {idx + 1}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-900">{name}</h4>
                  <p className="text-xs text-gray-400">Duration: {item.durationMinutes} mins</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 text-xs">
                <div>
                  <p className="text-[10px] text-gray-400 font-medium uppercase">Partner Assigned</p>
                  <div className="flex items-center gap-1.5 mt-0.5 font-semibold text-gray-900">
                    <Avatar src={booking.partner?.profilePhotoKey || undefined} fallback={partnerName.slice(0, 2).toUpperCase()} className="w-5 h-5" />
                    <span>{partnerName}</span>
                    {booking.partner && <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] text-gray-400 font-medium uppercase">Time</p>
                  <p className="font-semibold text-gray-900 mt-0.5">{item.scheduledTime || booking.scheduledTime}</p>
                  <p className="text-[10px] text-gray-400">{item.durationMinutes} mins</p>
                </div>

                <div>
                  <p className="text-[10px] text-gray-400 font-medium uppercase">Price</p>
                  <p className="font-bold text-gray-900 mt-0.5">{priceDisplay}</p>
                </div>

                <ChevronRight className="w-4 h-4 text-gray-400 hidden md:block" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Footer Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-gray-100 text-center text-xs">
        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
          <p className="text-[10px] text-gray-400 font-medium uppercase">Total Duration</p>
          <p className="font-bold text-gray-900 mt-0.5">{durationText}</p>
        </div>

        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
          <p className="text-[10px] text-gray-400 font-medium uppercase">Payment Status</p>
          <p className="font-bold text-emerald-600 mt-0.5">{booking.paymentStatus || 'Pending'}</p>
        </div>

        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
          <p className="text-[10px] text-gray-400 font-medium uppercase">Partner Assigned</p>
          <p className="font-bold text-gray-900 mt-0.5">{booking.partner ? '1 Assigned' : 'Unassigned'}</p>
        </div>

        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
          <p className="text-[10px] text-gray-400 font-medium uppercase">Booking Type</p>
          <p className="font-bold text-gray-900 mt-0.5">{booking.bookingType || 'ON_DEMAND'}</p>
        </div>
      </div>
    </Card>
  );
}
