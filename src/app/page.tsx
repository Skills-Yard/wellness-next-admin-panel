'use client';

import React, { useEffect, useState } from 'react';
import { Skeleton, SkeletonCard } from '../components/ui/skeleton';
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
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Skeleton className="h-72 rounded-2xl lg:col-span-2" />
            <Skeleton className="h-72 rounded-2xl" />
          </div>
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      ) : (
        <DashboardView users={users} bookings={bookings} partners={partners} />
      )}
    </section>
  );
}
