'use client';

import React from 'react';
import { Phone, Star, ShieldCheck, Clock, ShoppingBag } from 'lucide-react';
import { Booking } from '../../../types/booking';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Avatar } from '../../ui/avatar';

interface BookingServiceTimelineProps {
  booking: Booking;
}

export default function BookingServiceTimeline({ booking }: BookingServiceTimelineProps) {
  const items = booking.items || [];

  if (items.length === 0) {
    return (
      <Card className="p-8 bg-white border-gray-100 shadow-xs text-center text-xs text-gray-400">
        <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-gray-300" />
        <p className="font-bold text-sm text-gray-700">No Service Timeline Items</p>
        <p className="text-gray-400 mt-1">This booking has no itemized service records in the database.</p>
      </Card>
    );
  }

  const totalDurationMinutes = items.reduce((sum, item) => sum + (item.durationMinutes || 0), 0);
  const totalHours = Math.floor(totalDurationMinutes / 60);
  const totalMins = totalDurationMinutes % 60;
  const durationText = `${totalHours > 0 ? `${totalHours} hr ` : ''}${totalMins} min`;

  return (
    <Card className="p-6 bg-white border-gray-100 shadow-xs space-y-6">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <h3 className="font-bold text-base text-gray-900">Service Timeline & Assignment</h3>
        <Badge variant="secondary" className="text-xs">
          <Clock className="w-3.5 h-3.5 mr-1 text-gray-400" />
          Total Duration: {durationText}
        </Badge>
      </div>

      <div className="space-y-6 relative before:absolute before:left-3.5 before:top-4 before:bottom-4 before:w-0.5 before:bg-gray-200">
        {items.map((item, idx) => {
          const statusStr = item.status || booking.status;
          const isCompleted = statusStr === 'COMPLETED';
          const isOngoing = statusStr === 'IN_PROGRESS' || statusStr === 'PARTNER_ARRIVED' || statusStr === 'PARTNER_EN_ROUTE';
          
          const name = item.serviceItemName || item.serviceItem?.name || item.serviceItem?.cardTitle || 'Service';
          const category = item.serviceItem?.subCategory?.category?.name || item.categoryName || 'Service';
          const partnerName = booking.partner?.name || 'Unassigned Partner';
          const ratingVal = booking.partner?.averageRating ? booking.partner.averageRating.toFixed(1) : '0.0';
          const reviewsCount = booking.partner?.totalReviews || 0;

          return (
            <div key={item.id} className="relative flex items-start gap-4 pl-8">
              <div className={`absolute left-0 top-1.5 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-xs z-10 ${
                isCompleted ? 'bg-emerald-500 text-white' : isOngoing ? 'bg-amber-500 text-white' : 'bg-blue-500 text-white'
              }`}>
                {idx + 1}
              </div>

              <div className="flex-1 bg-gray-50/70 p-4 rounded-2xl border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-gray-900">{item.scheduledTime || booking.scheduledTime}</span>
                    <span className="text-[11px] text-gray-400">({item.durationMinutes} mins)</span>
                  </div>
                  <h4 className="font-bold text-sm text-gray-900">{name}</h4>
                  <p className="text-xs text-gray-500">Category: {category}</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2.5 bg-white p-2 px-3 rounded-xl border border-gray-200">
                    <Avatar src={booking.partner?.profilePhotoKey || undefined} fallback={partnerName.slice(0, 2).toUpperCase()} className="w-8 h-8" />
                    <div>
                      <div className="flex items-center gap-1 font-semibold text-xs text-gray-900">
                        <span>{partnerName}</span>
                        {booking.partner && <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-gray-400">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{ratingVal} ({reviewsCount})</span>
                      </div>
                    </div>
                  </div>

                  {booking.partner?.phone && (
                    <a href={`tel:${booking.partner.phone}`} className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50">
                      <Phone className="w-4 h-4" />
                    </a>
                  )}

                  <Badge variant={isCompleted ? 'active' : isOngoing ? 'secondary' : 'inactive'}>
                    {statusStr}
                  </Badge>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
