'use client';

import React from 'react';
import Link from 'next/link';
import { MoreVertical, Eye, Calendar, MapPin, Clock, Sparkles } from 'lucide-react';
import { Booking } from '../../../types/booking';
import { Avatar } from '../../ui/avatar';
import { Button } from '../../ui/button';

interface BookingListRowProps {
  booking: Booking;
  actionMenuOpenId: string | null;
  setActionMenuOpenId: (id: string | null) => void;
  onCancelBooking?: (id: string) => void;
}

export default function BookingListRow({
  booking,
  actionMenuOpenId,
  setActionMenuOpenId,
  onCancelBooking,
}: BookingListRowProps) {
  const code = booking.bookingCode || `BKD-${booking.id.slice(-6).toUpperCase()}`;
  const firstItem = booking.items?.[0];
  const serviceName = firstItem?.serviceItemName || firstItem?.serviceItem?.name || firstItem?.serviceItem?.cardTitle || 'Booking Service';
  const categoryName = firstItem?.serviceItem?.subCategory?.category?.name || firstItem?.categoryName || 'Service';
  const itemCount = booking.items?.length || 0;
  const durationMin = booking.estimatedDurationMinutes || firstItem?.durationMinutes || 0;

  const customerName = booking.user?.name || 'Customer';
  const customerPhone = booking.user?.phone || 'N/A';
  const customerEmail = booking.user?.email || 'N/A';

  const partnerName = booking.partner?.name || 'Unassigned';
  const partnerCity = booking.partner?.city || booking.address?.city || 'Delhi NCR';

  const scheduledDateStr = booking.scheduledDate
    ? new Date(booking.scheduledDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'N/A';
  const scheduledTimeStr = booking.scheduledTime || 'N/A';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
      case 'PARTNER_ARRIVED':
      case 'PARTNER_EN_ROUTE':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500 text-white shadow-2xs">Ongoing</span>;
      case 'CONFIRMED':
      case 'ACCEPTED':
      case 'PARTNER_ASSIGNED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">Confirmed</span>;
      case 'COMPLETED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Completed</span>;
      case 'PENDING_PAYMENT':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">Pending Payment</span>;
      case 'EXPIRED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600 border border-gray-200">Expired</span>;
      case 'CANCELLED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">Cancelled</span>;
      case 'NO_PARTNER_FOUND':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#FDF6ED] text-[#D4A373] border border-[#F5E6D3]">No Partner</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-50 text-slate-700 border border-slate-200">{status.replace('_', ' ')}</span>;
    }
  };

  return (
    <tr className="hover:bg-amber-50/20 transition-colors text-xs">
      <td className="py-3.5 px-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1C1512] to-[#3B2D27] text-[#D4A373] shrink-0 font-bold flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4 fill-current stroke-none" />
          </div>
          <div>
            <Link href={`/bookings/${booking.id}`} className="font-bold text-gray-900 hover:text-[#D4A373] transition-colors leading-snug block">
              {serviceName}
            </Link>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] font-medium text-gray-500">{categoryName}</span>
              <span className="text-[10px] font-mono font-semibold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">{code}</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-1">
              <span>{durationMin} min</span>
              <span>•</span>
              <span>{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
            </div>
          </div>
        </div>
      </td>

      <td className="py-3.5 px-4">
        <div className="flex items-center gap-2.5">
          <Avatar src={booking.user?.avatarUrl || undefined} fallback={customerName.slice(0, 2).toUpperCase()} className="w-8 h-8 border border-gray-200 shadow-2xs" />
          <div>
            <p className="font-semibold text-gray-900">{customerName}</p>
            <p className="text-[11px] text-gray-400">{customerPhone}</p>
            <p className="text-[10px] text-gray-400 truncate max-w-[120px]">{customerEmail}</p>
          </div>
        </div>
      </td>

      <td className="py-3.5 px-4">
        <div className="flex items-center gap-2.5">
          <Avatar src={booking.partner?.profilePhotoKey || undefined} fallback={partnerName.slice(0, 2).toUpperCase()} className="w-8 h-8 border border-gray-200 shadow-2xs" />
          <div>
            <p className="font-semibold text-gray-900">{partnerName}</p>
            <p className="text-[11px] text-gray-400">{partnerCity}</p>
          </div>
        </div>
      </td>

      <td className="py-3.5 px-4 whitespace-nowrap">
        <div className="flex items-center gap-1.5 font-semibold text-gray-900">
          <Calendar className="w-3.5 h-3.5 text-gray-400" />
          <span>{scheduledDateStr}</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-0.5">
          <Clock className="w-3 h-3 text-gray-400" />
          <span>{scheduledTimeStr}</span>
        </div>
        {booking.address?.city && (
          <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5">
            <MapPin className="w-3 h-3 text-gray-400" />
            <span className="truncate max-w-[130px]">{booking.address.city}</span>
          </div>
        )}
      </td>

      <td className="py-3.5 px-4">
        {getStatusBadge(booking.status)}
      </td>

      <td className="py-3.5 px-4 whitespace-nowrap">
        <p className="font-extrabold text-gray-900 text-sm">₹{(booking.totalAmount || 0).toLocaleString()}</p>
        <span className={`inline-block text-[10px] font-semibold mt-0.5 px-1.5 py-0.2 rounded ${
          booking.paymentStatus === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
        }`}>
          {booking.paymentStatus === 'COMPLETED' ? 'Paid' : booking.paymentStatus || 'Pending'}
        </span>
      </td>

      <td className="py-3.5 px-5 text-right relative">
        <div className="inline-flex items-center gap-1.5">
          <Link href={`/bookings/${booking.id}`}>
            <Button variant="outline" size="sm" className="h-8 text-xs font-semibold hover:border-amber-400 hover:text-amber-700">
              <Eye className="w-3.5 h-3.5 mr-1 text-gray-400" />
              View Details
            </Button>
          </Link>
          <button
            onClick={() => setActionMenuOpenId(actionMenuOpenId === booking.id ? null : booking.id)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>

        {actionMenuOpenId === booking.id && (
          <div className="absolute right-5 top-12 z-20 w-44 bg-white border border-gray-100 rounded-xl shadow-lg py-1.5 text-left text-xs">
            <Link href={`/bookings/${booking.id}`} className="flex items-center gap-2 px-3.5 py-2 hover:bg-gray-50 text-gray-700">
              <Eye className="w-3.5 h-3.5 text-gray-500" />
              <span>Full Details</span>
            </Link>
            {booking.status !== 'CANCELLED' && onCancelBooking && (
              <button
                onClick={() => { setActionMenuOpenId(null); onCancelBooking(booking.id); }}
                className="w-full flex items-center gap-2 px-3.5 py-2 text-rose-600 hover:bg-rose-50 cursor-pointer"
              >
                <span>Cancel Booking</span>
              </button>
            )}
          </div>
        )}
      </td>
    </tr>
  );
}
