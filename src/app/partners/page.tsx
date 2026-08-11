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
import { Loader2 } from 'lucide-react';

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

  const handleApprove = async (id: string) => {
    const res = await approvePartnerServerAction(id);
    if (res.ok) {
      await fetchPartners();
    } else {
      alert(res.message || 'Failed to approve partner');
    }
  };

  const handleSuspend = async (id: string) => {
    const res = await suspendPartnerServerAction(id);
    if (res.ok) {
      await fetchPartners();
    } else {
      alert(res.message || 'Failed to suspend partner');
    }
  };

  const handleDelete = async (id: string) => {
    const res = await deletePartnerServerAction(id);
    if (res.ok) {
      await fetchPartners();
    } else {
      alert(res.message || 'Failed to delete partner');
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-gray-500 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4A373]" />
        <span className="text-xs font-semibold">Loading platform partners from database...</span>
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
