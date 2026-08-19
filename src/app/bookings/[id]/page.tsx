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
import { Skeleton, SkeletonText } from '../../../components/ui/skeleton';

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'timeline' | 'list'>('timeline');

  // `silent` skips the `loading` flip — used after marking this booking's own status, where
  // update's response isn't a reliably-shaped row to patch in locally, but re-flashing the whole
  // detail page's skeleton over a one-field change is worse than a quiet in-place update.
  const fetchBooking = async (silent = false) => {
    if (!id) return;
    if (!silent) setLoading(true);
    try {
      const data = await getBookingByIdServerAction(id);
      setBooking(data);
    } catch (err) {
      console.error('Error fetching booking detail:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <SkeletonText className="w-48 h-6" />
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-56 rounded-2xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-48 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </div>
        </div>
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
    if (res.ok) await fetchBooking(true);
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
