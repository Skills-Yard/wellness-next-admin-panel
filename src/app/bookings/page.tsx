'use client';

import React, { useEffect, useState } from 'react';
import BookingListTable from '../../components/bookings/list/BookingListTable';
import { getBookingsServerAction, cancelBookingServerAction } from '../../lib/server-actions/booking';
import { Booking } from '../../types/booking';
import { Card } from '../../components/ui/card';
import { SkeletonTableRows } from '../../components/ui/skeleton';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // `silent` skips the `loading` flip — used after a single booking's status changes, where the
  // list itself still needs a fresh fetch (cancel's response isn't a reliably-shaped row to patch
  // in locally) but re-flashing the whole page's skeleton over a one-row change is worse than
  // just letting the table quietly update underneath.
  const fetchBookings = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await getBookingsServerAction();
      setBookings(data);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

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
    <BookingListTable
      bookings={bookings}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onRefresh={fetchBookings}
      onCancelBooking={handleCancelBooking}
    />
  );
}
