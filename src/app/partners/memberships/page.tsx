'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { toast } from '../../../components/ui/toast';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { SkeletonTableRows } from '../../../components/ui/skeleton';
import FetchErrorBanner from '../../../components/common/FetchErrorBanner';
import {
  getMembershipsServerAction,
  activateMembershipServerAction,
  revokeMembershipServerAction,
} from '../../../lib/server-actions/membership';
import {
  BusinessMembership,
  BusinessMembershipStatus,
  MEMBERSHIP_STATUS_LABEL,
} from '../../../types/membership';

const STATUS_TABS: { key: 'ALL' | BusinessMembershipStatus; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'PENDING_BUSINESS_APPROVAL', label: 'Awaiting business' },
  { key: 'PENDING_EMPLOYEE_APPROVAL', label: 'Awaiting employee' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'REVOKED', label: 'Revoked' },
  { key: 'LEFT', label: 'Left' },
  { key: 'REJECTED', label: 'Rejected' },
];

const badgeVariantFor = (s: BusinessMembershipStatus) =>
  s === 'ACTIVE'
    ? 'default'
    : s === 'PENDING_BUSINESS_APPROVAL' || s === 'PENDING_EMPLOYEE_APPROVAL'
      ? 'secondary'
      : 'outline';

function fmt(iso?: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function MembershipsPage() {
  const [tab, setTab] = useState<'ALL' | BusinessMembershipStatus>('ALL');
  const [rows, setRows] = useState<BusinessMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMembershipsServerAction({
        status: tab === 'ALL' ? undefined : [tab],
        limit: 100,
      });
      setRows(res.rows);
    } catch {
      setError('Could not load memberships.');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount driven by the status tab, not a render loop
    load();
  }, [load]);

  const act = async (
    id: string,
    fn: () => Promise<{ ok: boolean; message?: string }>,
    okMsg: string,
  ) => {
    setBusyId(id);
    try {
      const res = await fn();
      if (res.ok) {
        toast.success(okMsg);
        await load();
      } else {
        toast.error(res.message || 'Action failed');
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[#1C1512]">Team memberships</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Links between a business partner and its employee partners.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              tab === t.key
                ? 'bg-[#1C1512] text-white'
                : 'bg-[#FAF5F0] text-[#1C1512] hover:bg-[#F2E5D9]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <FetchErrorBanner message={error} onRetry={load} />}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3 text-left font-bold">Employee</th>
                <th className="px-4 py-3 text-left font-bold">Business</th>
                <th className="px-4 py-3 text-left font-bold">Role</th>
                <th className="px-4 py-3 text-left font-bold">Origin</th>
                <th className="px-4 py-3 text-left font-bold">Status</th>
                <th className="px-4 py-3 text-left font-bold">Created</th>
                <th className="px-4 py-3 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonTableRows rows={6} columns={7} />
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-sm">
                    No memberships in this view.
                  </td>
                </tr>
              ) : (
                rows.map((m) => {
                  const ended = ['REVOKED', 'LEFT', 'REJECTED'].includes(m.status);
                  return (
                    <tr key={m.id} className="border-t border-gray-100">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-[#1C1512]">
                          {m.employeePartner?.name ?? m.employeePartnerId.slice(0, 8)}
                        </p>
                        {m.employeePartner?.phone && (
                          <p className="text-[11px] text-gray-400">{m.employeePartner.phone}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-[#1C1512]">
                          {m.businessPartner?.name ?? m.businessPartnerId.slice(0, 8)}
                        </p>
                        {m.businessPartner?.businessCode && (
                          <p className="text-[11px] text-gray-400">{m.businessPartner.businessCode}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{m.role || '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{m.origin}</td>
                      <td className="px-4 py-3">
                        <Badge variant={badgeVariantFor(m.status)}>
                          {MEMBERSHIP_STATUS_LABEL[m.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {fmt(m.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {m.status !== 'ACTIVE' && !ended && (
                            <Button
                              size="sm"
                              disabled={busyId === m.id}
                              onClick={() =>
                                act(
                                  m.id,
                                  () => activateMembershipServerAction(m.id),
                                  'Membership activated',
                                )
                              }
                            >
                              Activate
                            </Button>
                          )}
                          {!ended && (
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={busyId === m.id}
                              onClick={() =>
                                act(
                                  m.id,
                                  () => revokeMembershipServerAction(m.id),
                                  'Membership revoked',
                                )
                              }
                            >
                              Revoke
                            </Button>
                          )}
                          {ended && <span className="text-xs text-gray-400">{fmt(m.endedAt)}</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
