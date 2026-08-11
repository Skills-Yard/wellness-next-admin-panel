'use client';

import React from 'react';
import { MapPin, CheckCircle2, MessageSquare, ExternalLink, Clock, Users, Home } from 'lucide-react';
import { Booking } from '../../../types/booking';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';

interface BookingSidebarInfoProps {
  booking: Booking;
}

export default function BookingSidebarInfo({ booking }: BookingSidebarInfoProps) {
  const addressFormatted = booking.address?.formattedAddress ||
    [booking.address?.houseNo, booking.address?.street, booking.address?.landmark, booking.address?.city, booking.address?.postalCode]
      .filter(Boolean)
      .join(', ') || 'No address provided';

  const createdAtFormatted = booking.createdAt
    ? new Date(booking.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'N/A';

  const items = booking.items || [];
  const totalDurationMinutes = items.reduce((sum, item) => sum + (item.durationMinutes || 0), 0) || booking.estimatedDurationMinutes || 0;
  const totalHours = Math.floor(totalDurationMinutes / 60);
  const totalMins = totalDurationMinutes % 60;
  const durationText = `${totalHours > 0 ? `${totalHours} hr ` : ''}${totalMins} min`;

  const payment = booking.payment;
  const isPaid = booking.paymentStatus === 'COMPLETED' || payment?.status === 'COMPLETED';

  return (
    <div className="space-y-6 text-xs">
      <Card className="p-6 bg-white border-gray-100 shadow-xs space-y-4">
        <h3 className="font-bold text-base text-gray-900 border-b border-gray-100 pb-3">Booking Information</h3>

        <div className="space-y-2">
          <div className="flex items-start gap-2 text-gray-600">
            <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-gray-900">Customer Address</p>
              <p className="text-gray-500 mt-0.5 leading-relaxed">{addressFormatted}</p>
            </div>
          </div>
          {booking.address && (
            <Button variant="outline" size="sm" className="w-full h-8 text-xs font-semibold mt-2">
              <ExternalLink className="w-3.5 h-3.5 mr-1" /> View on Map
            </Button>
          )}
        </div>

        <div className="pt-4 border-t border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-900">Payment Status</span>
            <Badge variant={isPaid ? 'active' : 'secondary'} className="px-2 py-0.5">
              {isPaid && <CheckCircle2 className="w-3 h-3 mr-1" />}
              {booking.paymentStatus || 'Pending'}
            </Badge>
          </div>
          {payment && (
            <div className="text-gray-500 space-y-1 text-[11px]">
              {payment.paidAt && <p>Paid at: {new Date(payment.paidAt).toLocaleString('en-GB')}</p>}
              <p className="font-mono text-gray-700">Payment ID: {payment.razorpayPaymentId || payment.id}</p>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-gray-100 space-y-2.5">
          <div className="flex items-center justify-between text-gray-600">
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-gray-400" /> Total Duration</span>
            <span className="font-bold text-gray-900">{durationText}</span>
          </div>
          <div className="flex items-center justify-between text-gray-600">
            <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-gray-400" /> Partner Assigned</span>
            <span className="font-bold text-gray-900">{booking.partner ? booking.partner.name || 'Assigned' : 'Unassigned'}</span>
          </div>
          <div className="flex items-center justify-between text-gray-600">
            <span className="flex items-center gap-1.5"><Home className="w-3.5 h-3.5 text-gray-400" /> Booking Type</span>
            <span className="font-bold text-gray-900">{booking.bookingType || 'ON_DEMAND'}</span>
          </div>
          <div className="flex items-center justify-between text-gray-600">
            <span>Created At</span>
            <span className="font-medium text-gray-700">{createdAtFormatted}</span>
          </div>
        </div>

        {booking.user?.phone && (
          <a href={`tel:${booking.user.phone}`} className="block">
            <Button size="sm" className="w-full h-9 bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 font-semibold shadow-2xs">
              <MessageSquare className="w-4 h-4 mr-1.5" /> Contact Customer
            </Button>
          </a>
        )}
      </Card>
    </div>
  );
}
