'use client';

import React, { useCallback, useEffect, useState } from 'react';
import PartnerListTable from '../../components/partners/list/PartnerListTable';
import {
  getPartnersServerAction,
  approvePartnerServerAction,
  suspendPartnerServerAction,
  deletePartnerServerAction,
} from '../../lib/server-actions/partner';
import { Partner } from '../../types/partner';
import { Card } from '../../components/ui/card';
import { Skeleton, SkeletonCard, SkeletonTableRows } from '../../components/ui/skeleton';
import { getCached, setCached, CACHE_KEYS } from '../../lib/sessionCache';
import FetchErrorBanner from '../../components/common/FetchErrorBanner';

const CACHE_KEY = CACHE_KEYS.partners;

export default function PartnersPage() {
  const cached = getCached<Partner[]>(CACHE_KEY);
  const [partners, setPartners] = useState<Partner[]>(cached || []);
  // Only the very first, never-cached load shows the full skeleton — a revisit this session
  // renders the cached list immediately while refreshing quietly underneath.
  const [loading, setLoading] = useState(cached === undefined);
  const [error, setError] = useState<string | null>(null);

  const fetchPartners = useCallback(async () => {
    if (getCached<Partner[]>(CACHE_KEY) === undefined) setLoading(true);
    setError(null);
    try {
      const data = await getPartnersServerAction();
      setCached(CACHE_KEY, data);
      setPartners(data);
    } catch (err: any) {
      console.error('Error loading partners:', err?.response?.data || err?.message || err);
      // Keep whatever's already on screen (cached or previous) — a failed refresh shouldn't
      // wipe out good data, it should just say so.
      setError("Couldn't load the latest partners list.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  // Each patches just the one row it touched from the response the write already returns —
  // no full refetch (and no page-wide skeleton flash) for a single partner's status/removal.
  const handleApprove = async (id: string) => {
    const res = await approvePartnerServerAction(id);
    if (res.ok) {
      setPartners(prev => {
        const next = prev.map(p => (p.id === id ? res.data : p));
        setCached(CACHE_KEY, next);
        return next;
      });
    } else {
      alert(res.message || 'Failed to approve partner');
    }
  };

  const handleSuspend = async (id: string) => {
    const res = await suspendPartnerServerAction(id);
    if (res.ok) {
      setPartners(prev => {
        const next = prev.map(p => (p.id === id ? res.data : p));
        setCached(CACHE_KEY, next);
        return next;
      });
    } else {
      alert(res.message || 'Failed to suspend partner');
    }
  };

  const handleDelete = async (id: string) => {
    const res = await deletePartnerServerAction(id);
    if (res.ok) {
      setPartners(prev => {
        const next = prev.filter(p => p.id !== id);
        setCached(CACHE_KEY, next);
        return next;
      });
    } else {
      alert(res.message || 'Failed to delete partner');
    }
  };

  // AddPartnerModal hands back the partner it just created — append it here instead of
  // re-fetching the entire list a second time (PartnerListTable's own fetchPage() already
  // refreshes the paged rows actually on screen).
  const handlePartnerCreated = (partner: Partner) => {
    setPartners(prev => {
      const next = [partner, ...prev];
      setCached(CACHE_KEY, next);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-3.5 w-64" />
          </div>
          <Skeleton className="h-10 w-full sm:w-80 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <Card className="rounded-2xl border border-gray-100 shadow-xs overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Partner</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Rating</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Booking</th>
                  <th className="py-3.5 px-4">Joined</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <SkeletonTableRows rows={6} columns={4} />
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && <FetchErrorBanner message={error} onRetry={fetchPartners} />}
      <PartnerListTable
        partners={partners}
        onPartnerCreated={handlePartnerCreated}
        onApprove={handleApprove}
        onSuspend={handleSuspend}
        onDelete={handleDelete}
      />
    </div>
  );
}
