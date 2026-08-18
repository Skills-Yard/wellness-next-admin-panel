'use client';

import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { getUsersServerAction } from '../lib/server-actions/user';
import { getBookingsServerAction } from '../lib/server-actions/booking';
import { getPartnersServerAction } from '../lib/server-actions/partner';
import { User } from '../types/user';
import { Booking } from '../types/booking';
import { Partner } from '../types/partner';
import DashboardView from '../components/dashboard/DashboardView';

export default function DashboardPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [u, b, p] = await Promise.all([
          getUsersServerAction(),
          getBookingsServerAction(),
          getPartnersServerAction(),
        ]);
        if (cancelled) return;
        setUsers(u);
        setBookings(b);
        setPartners(p);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="space-y-6 max-w-[1600px] mx-auto pb-16 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Overview of your platform performance</p>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-gray-500 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#D4A373]" />
          <span className="text-xs font-semibold">Loading platform data...</span>
        </div>
      ) : (
        <DashboardView users={users} bookings={bookings} partners={partners} />
      )}
    </section>
  );
}
