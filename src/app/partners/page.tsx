'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import PartnerListTable from '../../components/partners/list/PartnerListTable';
import { PartnerType } from '../../types/partner';
import {
  getPartnerStatusCountsServerAction,
  getActivePartnerCountServerAction,
  approvePartnerServerAction,
  suspendPartnerServerAction,
  deletePartnerServerAction,
} from '../../lib/server-actions/partner';
import { Card } from '../../components/ui/card';
import { Skeleton, SkeletonCard, SkeletonTableRows } from '../../components/ui/skeleton';
import { getCached, setCached, CACHE_KEYS } from '../../lib/sessionCache';
import FetchErrorBanner from '../../components/common/FetchErrorBanner';

// Counts are cached per partner-type scope — the plain list, Individual and Business each get
// their own bag so switching between them doesn't flash the wrong numbers.
const cacheKeyFor = (type?: string) =>
  type ? `${CACHE_KEYS.partnerStatusCounts}:${type}` : CACHE_KEYS.partnerStatusCounts;
// Synthetic key folded into the same statusCounts object — see
// getActivePartnerCountServerAction's doc comment for why "Active Partners" isn't just
// statusCounts.APPROVED.
const ACTIVE_APPROVED_KEY = '__activeApproved';

export default function PartnersPage() {
  // Sidebar's Partner > Individual / Business entries route here as ?type=INDIVIDUAL|BUSINESS;
  // the plain Partner entry has no ?type= and shows everything.
  const searchParams = useSearchParams();
  const rawType = searchParams.get('type');
  const typeFilter: PartnerType | undefined =
    rawType === 'INDIVIDUAL' || rawType === 'BUSINESS' ? rawType : undefined;
  const cacheKey = cacheKeyFor(typeFilter);

  // Was the FULL partners list (walked across every backend page) fetched solely to derive the
  // metrics cards + status dropdown's per-option counts — the backend now returns those counts
  // directly (one key per PartnerStatus), so this page no longer needs every partner in memory
  // at all; PartnerListTable's rows come from its own separate paged fetch regardless.
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>(
    () => getCached<Record<string, number>>(cacheKey) || {},
  );
  // Only the very first, never-cached load shows the full skeleton — a revisit this session
  // renders the cached counts immediately while refreshing quietly underneath.
  const [loading, setLoading] = useState(getCached<Record<string, number>>(cacheKey) === undefined);
  const [error, setError] = useState<string | null>(null);

  const fetchStatusCounts = useCallback(async () => {
    const hit = getCached<Record<string, number>>(cacheKey);
    // Switching to a type-scope we've never loaded shows the skeleton; a revisit shows its
    // cached numbers immediately and refreshes underneath.
    setStatusCounts(hit || {});
    if (hit === undefined) setLoading(true);
    setError(null);
    try {
      const [statusData, activeApproved] = await Promise.all([
        getPartnerStatusCountsServerAction(typeFilter),
        getActivePartnerCountServerAction(typeFilter),
      ]);
      const data = { ...statusData, [ACTIVE_APPROVED_KEY]: activeApproved };
      setCached(cacheKey, data);
      setStatusCounts(data);
    } catch (err: any) {
      console.error('Error loading partner status counts:', err?.response?.data || err?.message || err);
      // Keep whatever's already on screen (cached or previous) — a failed refresh shouldn't
      // wipe out good data, it should just say so.
      setError("Couldn't load the latest partners list.");
    } finally {
      setLoading(false);
    }
  }, [cacheKey, typeFilter]);

  useEffect(() => {
    fetchStatusCounts();
  }, [fetchStatusCounts]);

  // Each of these already refetches the visible page's rows itself (PartnerListTable's
  // wrapAction) — status counts just need a lightweight refresh alongside, not a full row patch.
  const handleApprove = async (id: string) => {
    const res = await approvePartnerServerAction(id);
    if (res.ok) {
      fetchStatusCounts();
    } else {
      alert(res.message || 'Failed to approve partner');
    }
  };

  const handleSuspend = async (id: string) => {
    const res = await suspendPartnerServerAction(id);
    if (res.ok) {
      fetchStatusCounts();
    } else {
      alert(res.message || 'Failed to suspend partner');
    }
  };

  const handleDelete = async (id: string) => {
    const res = await deletePartnerServerAction(id);
    if (res.ok) {
      fetchStatusCounts();
    } else {
      alert(res.message || 'Failed to delete partner');
    }
  };

  // AddPartnerModal hands back the partner it just created — refresh the counts (one lightweight
  // call) instead of appending to a full list this page no longer keeps.
  const handlePartnerCreated = () => {
    fetchStatusCounts();
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
      {error && <FetchErrorBanner message={error} onRetry={fetchStatusCounts} />}
      <PartnerListTable
        // Remount on a type switch so page number, search and status filter all reset to a
        // clean slate for the newly-scoped list.
        key={typeFilter ?? 'ALL'}
        statusCounts={statusCounts}
        typeFilter={typeFilter}
        onPartnerCreated={handlePartnerCreated}
        onApprove={handleApprove}
        onSuspend={handleSuspend}
        onDelete={handleDelete}
      />
    </div>
  );
}
