'use client';

import React from 'react';
import { Star } from 'lucide-react';
import { PartnerBooking } from '../../../../types/partner';
import { Badge } from '../../../ui/badge';

interface PartnerBookingRowProps {
  booking: PartnerBooking;
}

export default function PartnerBookingRow({ booking: b }: PartnerBookingRowProps) {
  const bookingCode = b.bookingCode || `BKG-${b.id.slice(-6).toUpperCase()}`;
  const customerName = b.user?.name || 'Customer';
  const customerPhone = b.user?.phone || 'N/A';
  const serviceName = b.items?.[0]?.serviceItemName || 'Service';
  const duration = b.items?.[0]?.durationMinutes || b.estimatedDurationMinutes || 0;
  const displayAmount = `₹${(b.totalAmount || 0).toLocaleString()}`;
  const ratingVal = b.rating || '-';

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <Badge variant="active">Completed</Badge>;
      case 'CANCELLED': return <Badge variant="destructive">Cancelled</Badge>;
      default: return <Badge className="bg-amber-50 text-amber-700 border-amber-200">{status}</Badge>;
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return dateStr; }
  };

  return (
    <tr className="hover:bg-gray-50/60 transition-colors">
      <td className="py-3.5 px-5 font-bold text-gray-900">{bookingCode}</td>
      <td className="py-3.5 px-4">
        <p className="font-semibold text-gray-900">{customerName}</p>
        <p className="text-[11px] text-gray-400">{customerPhone}</p>
      </td>
      <td className="py-3.5 px-4">
        <p className="font-semibold text-gray-900">{serviceName}</p>
        <p className="text-[11px] text-gray-400">{duration} mins</p>
      </td>
      <td className="py-3.5 px-4 whitespace-nowrap">
        <p className="font-medium text-gray-900">{formatDate(b.scheduledDate)}</p>
        <p className="text-[11px] text-gray-400">{b.scheduledTime || 'N/A'}</p>
      </td>
      <td className="py-3.5 px-4 font-bold text-gray-900">{displayAmount}</td>
      <td className="py-3.5 px-4">{getStatusBadge(b.status)}</td>
      <td className="py-3.5 px-4">
        <Badge variant={b.paymentStatus === 'REFUNDED' ? 'secondary' : 'active'}>
          {b.paymentStatus || 'Paid'}
        </Badge>
      </td>
      <td className="py-3.5 px-4">
        <div className="flex items-center gap-1 font-semibold text-gray-900">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span>{ratingVal}</span>
        </div>
      </td>
    </tr>
  );
}
