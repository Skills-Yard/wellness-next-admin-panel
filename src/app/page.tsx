'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Skeleton, SkeletonCard } from '../components/ui/skeleton';
import { getUsersServerAction } from '../lib/server-actions/user';
import { getBookingsServerAction } from '../lib/server-actions/booking';
import { getPartnersServerAction } from '../lib/server-actions/partner';
import { User } from '../types/user';
import { Booking } from '../types/booking';
import { Partner } from '../types/partner';
import { getCached, setCached, CACHE_KEYS } from '../lib/sessionCache';
import DashboardView from '../components/dashboard/DashboardView';
import FetchErrorBanner from '../components/common/FetchErrorBanner';

export default function DashboardPage() {
  // These three read/write the SAME cache keys as the standalone Users/Bookings/Partners list
  // pages (see CACHE_KEYS in sessionCache) — whichever page loads first this session primes the
  // cache for the others, instead of each one independently re-walking the same full collection.
  const cachedUsers = getCached<User[]>(CACHE_KEYS.users);
  const cachedBookings = getCached<Booking[]>(CACHE_KEYS.bookings);
  const cachedPartners = getCached<Partner[]>(CACHE_KEYS.partners);

  const [users, setUsers] = useState<User[]>(cachedUsers || []);
  const [bookings, setBookings] = useState<Booking[]>(cachedBookings || []);
  const [partners, setPartners] = useState<Partner[]>(cachedPartners || []);
  // Only the very first, never-cached load shows the full skeleton — a revisit this session (or
  // arriving after Users/Bookings/Partners already primed the cache) renders immediately while
  // refreshing quietly underneath.
  const [loading, setLoading] = useState(
    cachedUsers === undefined || cachedBookings === undefined || cachedPartners === undefined
  );
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    let cancelled = false;
    (async () => {
      const allCached =
        getCached<User[]>(CACHE_KEYS.users) !== undefined &&
        getCached<Booking[]>(CACHE_KEYS.bookings) !== undefined &&
        getCached<Partner[]>(CACHE_KEYS.partners) !== undefined;
      if (!allCached) setLoading(true);
      setError(null);
      try {
        const [freshUsers, freshBookings, freshPartners] = await Promise.all([
          getUsersServerAction(),
          getBookingsServerAction(),
          getPartnersServerAction(),
        ]);
        if (cancelled) return;
        setCached(CACHE_KEYS.users, freshUsers);
        setCached(CACHE_KEYS.bookings, freshBookings);
        setCached(CACHE_KEYS.partners, freshPartners);
        setUsers(freshUsers);
        setBookings(freshBookings);
        setPartners(freshPartners);
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
        <DashboardView users={users} bookings={bookings} partners={partners} />
      )}
    </section>
  );
}
