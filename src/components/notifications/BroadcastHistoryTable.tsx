'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Info } from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import Pagination from '../shared/Pagination';
import { getBroadcastsPagedServerAction } from '../../lib/server-actions/notification';
import { BroadcastStatus, NotificationBroadcast } from '../../types/notification';

const STATUS_VARIANT: Record<BroadcastStatus, 'default' | 'inactive' | 'destructive' | 'secondary'> = {
  PENDING: 'secondary',
  PROCESSING: 'secondary',
  COMPLETED: 'default',
  PARTIALLY_FAILED: 'destructive',
  FAILED: 'destructive',
};

const STATUS_LABEL: Record<BroadcastStatus, string> = {
  PENDING: 'Pending',
  PROCESSING: 'Sending…',
  COMPLETED: 'Completed',
  PARTIALLY_FAILED: 'Partially failed',
  FAILED: 'Failed',
};

function audienceLabel(broadcast: NotificationBroadcast): string {
  const map: Record<string, string> = {
    ALL_USERS: 'All users',
    ALL_PARTNERS: 'All partners',
    SELECTED_USERS: 'Selected users',
    SELECTED_PARTNERS: 'Selected partners',
    SEGMENT_USERS: 'User segment',
    SEGMENT_PARTNERS: 'Partner segment',
  };
  return map[broadcast.audienceType] ?? broadcast.audienceType;
}

export default function BroadcastHistoryTable() {
  const [statusFilter, setStatusFilter] = useState<'ALL' | BroadcastStatus>('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [rows, setRows] = useState<NotificationBroadcast[]>([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getBroadcastsPagedServerAction({
        page,
        limit: pageSize,
        status: statusFilter === 'ALL' ? undefined : [statusFilter],
      });
      setRows(res.data ?? []);
      setPagination({
        total: res.pagination?.total ?? 0,
        totalPages: res.pagination?.totalPages ?? 1,
      });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  return (
    <Card className="bg-white border-gray-100 shadow-xs rounded-2xl overflow-hidden space-y-4 p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-sm font-bold text-gray-900">Sent notifications</h2>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as 'ALL' | BroadcastStatus);
            setPage(1);
          }}
          className="px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 bg-white"
        >
          <option value="ALL">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="PROCESSING">Sending</option>
          <option value="COMPLETED">Completed</option>
          <option value="PARTIALLY_FAILED">Partially failed</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      <div className="flex items-start gap-1.5 text-[11px] text-gray-500 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
        <Info className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-px" />
        <span>
          &ldquo;Sent&rdquo; reflects a push send attempt for each recipient, not a confirmed device
          delivery — treat it as a lower bound.
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-gray-400 border-b border-gray-100">
              <th className="py-2.5 pr-4">Title</th>
              <th className="py-2.5 pr-4">Audience</th>
              <th className="py-2.5 pr-4">Status</th>
              <th className="py-2.5 pr-4">Target / Sent / Failed</th>
              <th className="py-2.5 pr-4">Sent on</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-xs text-gray-400">Loading…</td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-xs text-gray-400">No notifications sent yet.</td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50/60">
                  <td className="py-3 pr-4">
                    <p className="font-semibold text-gray-900 text-xs">{row.title}</p>
                    <p className="text-[11px] text-gray-500 truncate max-w-xs">{row.body}</p>
                  </td>
                  <td className="py-3 pr-4 text-xs text-gray-600">{audienceLabel(row)}</td>
                  <td className="py-3 pr-4">
                    <Badge variant={STATUS_VARIANT[row.status]}>{STATUS_LABEL[row.status]}</Badge>
                  </td>
                  <td className="py-3 pr-4 text-xs text-gray-600">
                    {row.targetCount} / {row.sentCount} / {row.failedCount}
                  </td>
                  <td className="py-3 pr-4 text-xs text-gray-500">
                    {new Date(row.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        totalPages={pagination.totalPages}
        onPageChange={setPage}
        pageSize={pageSize}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        totalItems={pagination.total}
        itemLabel="notifications"
      />
    </Card>
  );
}
