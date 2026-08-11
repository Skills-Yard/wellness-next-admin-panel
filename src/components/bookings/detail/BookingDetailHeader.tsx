'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Copy, Calendar, Tag, CreditCard } from 'lucide-react';
import { Booking } from '../../../types/booking';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Avatar } from '../../ui/avatar';

interface BookingDetailHeaderProps {
  booking: Booking;
}

export default function BookingDetailHeader({ booking }: BookingDetailHeaderProps) {
  const code = booking.bookingCode || `BKD-${booking.id.slice(-6).toUpperCase()}`;
  const customerName = booking.user?.name || 'Customer';
  const customerPhone = booking.user?.phone || 'N/A';

  const scheduledDate = booking.scheduledDate
    ? new Date(booking.scheduledDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'N/A';

  const totalServices = booking.items?.length || 0;
  const totalAmount = `₹${(booking.totalAmount || 0).toLocaleString()}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
  };

  return (
    <div className="space-y-4">
      <Link href="/bookings" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 transition-colors font-medium">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Bookings</span>
      </Link>

      <Card className="p-5 sm:p-6 bg-white border-gray-100 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <h1 className="text-xl font-bold text-gray-900">Booking Details</h1>
          <Badge className="bg-amber-50 text-amber-700 border-amber-200 px-3 py-1 text-xs">
            {booking.status.replace('_', ' ')}
          </Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
          <div>
            <p className="text-gray-400 font-medium">Booking ID</p>
            <div className="flex items-center gap-1 mt-1 font-bold text-gray-900">
              <span>{code}</span>
              <button onClick={copyToClipboard} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div>
            <p className="text-gray-400 font-medium">Status</p>
            <div className="mt-1">
              <Badge variant="active">{booking.status}</Badge>
            </div>
          </div>

          <div>
            <p className="text-gray-400 font-medium">Customer</p>
            <div className="flex items-center gap-2 mt-1">
              <Avatar src={booking.user?.avatarUrl || undefined} fallback={customerName.slice(0, 2).toUpperCase()} className="w-6 h-6 border border-gray-200" />
              <div>
                <p className="font-semibold text-gray-900 leading-tight">{customerName}</p>
                <p className="text-[10px] text-gray-400">{customerPhone}</p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-gray-400 font-medium">Scheduled Date</p>
            <div className="flex items-center gap-1 mt-1 font-bold text-gray-900">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <span>{scheduledDate}</span>
            </div>
          </div>

          <div>
            <p className="text-gray-400 font-medium">Total Amount</p>
            <div className="flex items-center gap-1 mt-1 font-bold text-gray-900 text-sm">
              <CreditCard className="w-3.5 h-3.5 text-gray-400" />
              <span>{totalAmount}</span>
            </div>
          </div>

          <div>
            <p className="text-gray-400 font-medium">Total Services</p>
            <div className="flex items-center gap-1 mt-1 font-bold text-gray-900">
              <Tag className="w-3.5 h-3.5 text-gray-400" />
              <span>{totalServices} {totalServices === 1 ? 'Service' : 'Services'}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
