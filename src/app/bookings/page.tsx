'use client';

import React, { useCallback, useEffect, useState } from 'react';
import BookingListTable from '../../components/bookings/list/BookingListTable';
import { getBookingsServerAction, cancelBookingServerAction } from '../../lib/server-actions/booking';
import { Booking } from '../../types/booking';
import { Card } from '../../components/ui/card';
import { SkeletonTableRows } from '../../components/ui/skeleton';
import { getCached, setCached } from '../../lib/sessionCache';
import FetchErrorBanner from '../../components/common/FetchErrorBanner';

const CACHE_KEY = 'bookings:list';

export default function BookingsPage() {
  const cached = getCached<Booking[]>(CACHE_KEY);
  const [bookings, setBookings] = useState<Booking[]>(cached || []);
  const [activeTab, setActiveTab] = useState<string>('all');
  // Only the very first, never-cached load shows the full skeleton — a revisit this session
  // renders the cached list immediately while refreshing quietly underneath.
  const [loading, setLoading] = useState(cached === undefined);
  const [error, setError] = useState<string | null>(null);

  // `silent` skips the `loading` flip — used after a single booking's status changes, where the
  // list itself still needs a fresh fetch (cancel's response isn't a reliably-shaped row to patch
  // in locally) but re-flashing the whole page's skeleton over a one-row change is worse than
  // just letting the table quietly update underneath.
  const fetchBookings = useCallback(async (silent = false) => {
    if (!silent && getCached<Booking[]>(CACHE_KEY) === undefined) setLoading(true);
    setError(null);
    try {
      const data = await getBookingsServerAction();
      setCached(CACHE_KEY, data);
      setBookings(data);
    } catch (err: any) {
      console.error('Error fetching bookings:', err?.response?.data || err?.message || err);
      // Keep whatever's already on screen (cached or previous) — a failed refresh shouldn't
      // wipe out good data, it should just say so.
      setError("Couldn't load the latest bookings list.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleCancelBooking = async (id: string) => {
    const reason = prompt('Reason for cancelling this booking?');
    if (!reason) return;
    const res = await cancelBookingServerAction(id, reason);
    if (res.ok) {
      await fetchBookings(true);
    } else {
      alert(res.message || 'Failed to cancel booking');
    }
  };

  if (loading) {
    return (
      <Card className="rounded-2xl border border-gray-100 shadow-xs overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-3.5 px-5">Booking & Service</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Partner & Employee</th>
                <th className="py-3.5 px-4">Schedule</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <SkeletonTableRows rows={6} columns={4} />
            </tbody>
          </table>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {error && <FetchErrorBanner message={error} onRetry={() => fetchBookings()} />}
      <BookingListTable
        bookings={bookings}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onRefresh={fetchBookings}
        onCancelBooking={handleCancelBooking}
      />
    </div>
  );
}
