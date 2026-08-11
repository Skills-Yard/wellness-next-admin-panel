'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  BookingDetailHeader,
  BookingServiceSummaryCards,
  BookingServiceTimeline,
  BookingServicesList,
  BookingSidebarInfo,
  BookingFooterActions,
} from '../../../components/bookings';
import { getBookingByIdServerAction, updateBookingServerAction } from '../../../lib/server-actions/booking';
import { Booking } from '../../../types/booking';
import { Loader2 } from 'lucide-react';

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'timeline' | 'list'>('timeline');

  const fetchBooking = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getBookingByIdServerAction(id);
      setBooking(data);
    } catch (err) {
      console.error('Error fetching booking detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [id]);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-gray-500 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4A373]" />
        <span className="text-xs font-semibold">Loading booking details from database...</span>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="py-24 text-center space-y-4">
        <p className="text-base font-bold text-gray-800">Booking Not Found</p>
        <p className="text-xs text-gray-500">The booking ID "{id}" does not exist in database.</p>
        <button
          onClick={() => router.push('/bookings')}
          className="px-4 py-2 text-xs font-semibold text-white bg-[#1C1512] rounded-xl cursor-pointer"
        >
          Back to Bookings
        </button>
      </div>
    );
  }

  const handleMarkCompleted = async () => {
    const res = await updateBookingServerAction(id, { status: 'COMPLETED' });
    if (res.ok) await fetchBooking();
    else alert(res.message || 'Failed to update booking status');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Stat Bar */}
      <BookingDetailHeader booking={booking} />

      {/* Main Content Layout: Left 2 Columns, Right 1 Column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Top Horizontal Summary Cards */}
          <BookingServiceSummaryCards booking={booking} />

          {/* Toggle between Timeline & List view */}
          <div className="flex items-center justify-end gap-2 text-xs">
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                viewMode === 'timeline' ? 'bg-[#1C1512] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Timeline View
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                viewMode === 'list' ? 'bg-[#1C1512] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Services Breakdown
            </button>
          </div>

          {/* Render Timeline or List */}
          {viewMode === 'timeline' ? (
            <BookingServiceTimeline booking={booking} />
          ) : (
            <BookingServicesList booking={booking} />
          )}

          {/* Bottom Action Bar */}
          <BookingFooterActions
            onMarkCompleted={handleMarkCompleted}
            onReschedule={() => alert('Reschedule requested')}
            onEditSlots={() => alert('Edit slots requested')}
            onReassignPartner={() => alert('Reassign partner requested')}
          />
        </div>

        {/* Right Sidebar Information Box */}
        <div>
          <BookingSidebarInfo booking={booking} />
        </div>
      </div>
    </div>
  );
}
