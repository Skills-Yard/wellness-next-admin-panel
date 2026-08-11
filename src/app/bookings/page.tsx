'use client';

import React, { useEffect, useState } from 'react';
import BookingListTable from '../../components/bookings/list/BookingListTable';
import { getBookingsServerAction, cancelBookingServerAction } from '../../lib/server-actions/booking';
import { Booking } from '../../types/booking';
import { Loader2 } from 'lucide-react';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const data = await getBookingsServerAction();
      setBookings(data);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
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
      await fetchBookings();
    } else {
      alert(res.message || 'Failed to cancel booking');
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-gray-500 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4A373]" />
        <span className="text-xs font-semibold">Loading platform bookings from database...</span>
      </div>
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
