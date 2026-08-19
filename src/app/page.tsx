'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Skeleton, SkeletonCard } from '../components/ui/skeleton';
import { getUsersServerAction } from '../lib/server-actions/user';
import { getBookingsServerAction } from '../lib/server-actions/booking';
import { getPartnersServerAction } from '../lib/server-actions/partner';
import { User } from '../types/user';
import { Booking } from '../types/booking';
import { Partner } from '../types/partner';
import { getCached, setCached } from '../lib/sessionCache';
import DashboardView from '../components/dashboard/DashboardView';
import FetchErrorBanner from '../components/common/FetchErrorBanner';

const CACHE_KEY = 'dashboard:users-bookings-partners';

interface DashboardData {
  users: User[];
  bookings: Booking[];
  partners: Partner[];
}

export default function DashboardPage() {
  const cached = getCached<DashboardData>(CACHE_KEY);
  const [data, setData] = useState<DashboardData>(cached || { users: [], bookings: [], partners: [] });
  // Only the very first, never-cached load shows the full skeleton — a revisit this session
  // renders the cached data immediately while refreshing quietly underneath.
  const [loading, setLoading] = useState(cached === undefined);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    let cancelled = false;
    (async () => {
      if (getCached<DashboardData>(CACHE_KEY) === undefined) setLoading(true);
      setError(null);
      try {
        const [users, bookings, partners] = await Promise.all([
          getUsersServerAction(),
          getBookingsServerAction(),
          getPartnersServerAction(),
        ]);
        if (cancelled) return;
        const fresh = { users, bookings, partners };
        setCached(CACHE_KEY, fresh);
        setData(fresh);
      } catch (err: any) {
        if (cancelled) return;
        console.error('[DashboardPage] load failed:', err?.response?.data || err?.message || err);
        // Keep whatever's already on screen (cached or previous) — a failed refresh shouldn't
        // wipe out good data, it should just say so.
        setError("Couldn't load the latest dashboard data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => load(), [load]);

  return (
    <section className="space-y-6 max-w-[1600px] mx-auto pb-16 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Overview of your platform performance</p>
      </div>

      {error && <FetchErrorBanner message={error} onRetry={load} />}

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
        <DashboardView users={data.users} bookings={data.bookings} partners={data.partners} />
      )}
    </section>
  );
}
