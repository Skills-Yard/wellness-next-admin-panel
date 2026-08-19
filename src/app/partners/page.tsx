'use client';

import React, { useEffect, useState } from 'react';
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

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const data = await getPartnersServerAction();
      setPartners(data);
    } catch (error) {
      console.error('Error loading partners:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  // Each patches just the one row it touched from the response the write already returns —
  // no full refetch (and no page-wide skeleton flash) for a single partner's status/removal.
  const handleApprove = async (id: string) => {
    const res = await approvePartnerServerAction(id);
    if (res.ok) {
      setPartners(prev => prev.map(p => (p.id === id ? res.data : p)));
    } else {
      alert(res.message || 'Failed to approve partner');
    }
  };

  const handleSuspend = async (id: string) => {
    const res = await suspendPartnerServerAction(id);
    if (res.ok) {
      setPartners(prev => prev.map(p => (p.id === id ? res.data : p)));
    } else {
      alert(res.message || 'Failed to suspend partner');
    }
  };

  const handleDelete = async (id: string) => {
    const res = await deletePartnerServerAction(id);
    if (res.ok) {
      setPartners(prev => prev.filter(p => p.id !== id));
    } else {
      alert(res.message || 'Failed to delete partner');
    }
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
    <PartnerListTable
      partners={partners}
      onRefresh={fetchPartners}
      onApprove={handleApprove}
      onSuspend={handleSuspend}
      onDelete={handleDelete}
    />
  );
}
