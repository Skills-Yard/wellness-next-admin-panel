'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Calendar as CalendarIcon, Download, Plus, UserCheck } from 'lucide-react';
import { Partner, PartnerStatus, PartnerType } from '../../../types/partner';
import { getPartnersPagedServerAction } from '../../../lib/server-actions/partner';
import AddPartnerModal from './AddPartnerModal';
import PartnerListMetrics from './PartnerListMetrics';
import PartnerListRow from './PartnerListRow';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import Pagination from '../../shared/Pagination';

interface PartnerListTableProps {
  // One key per PartnerStatus (see getPartnerStatusCountsServerAction), independent of whichever
  // page/filter the table below is currently showing — backend-computed, so it no longer takes
  // the full partners list to derive these.
  statusCounts: Record<string, number>;
  // Driven by the ?type= query param (set from the sidebar's Partner > Individual / Business
  // entries). undefined = the plain "Partner" entry, i.e. no type filter.
  typeFilter?: PartnerType;
  // Tells the parent page a partner was added so it can refresh statusCounts — replaces a full
  // onRefresh() re-fetch after Add.
  onPartnerCreated: () => void;
  onApprove?: (id: string) => Promise<void>;
  onSuspend?: (id: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

// A partner in any of these statuses still needs some admin action before going live. This is
// the single definition of "Pending Approval" — used for both the metrics card above the table
// and the status filter dropdown's "Pending Approval" option/count — so the two never disagree
// on what that label means (they used to: the card summed all three, the dropdown option only
// matched PENDING_APPROVAL itself, so e.g. a partner sitting in KYC_SUBMITTED counted toward
// the card's "4" but not the dropdown's "0" for the exact same label).
const PENDING_APPROVAL_STATUSES: PartnerStatus[] = ['PENDING_KYC', 'KYC_SUBMITTED', 'PENDING_APPROVAL'];

// Every real PartnerStatus value — used to sum statusCounts into a total without picking up the
// parent page's synthetic '__activeApproved' key.
const PARTNER_STATUS_KEYS: PartnerStatus[] = [
  'INCOMPLETE',
  'PENDING_KYC',
  'KYC_SUBMITTED',
  'TRAINING',
  'PENDING_APPROVAL',
  'APPROVED',
  'SUSPENDED',
  'REJECTED',
  'DEACTIVATED',
];

export default function PartnerListTable({
  statusCounts,
  typeFilter,
  onPartnerCreated,
  onApprove,
  onSuspend,
  onDelete,
}: PartnerListTableProps) {
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [actionMenuOpenId, setActionMenuOpenId] = useState<string | null>(null);

  const [rows, setRows] = useState<Partner[]>([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // '__activeApproved' is a synthetic key the parent page folds in alongside the real
  // per-PartnerStatus ones — see getActivePartnerCountServerAction's doc comment for why
  // "Active Partners" needs its own dedicated (status=APPROVED AND isActive=true) count rather
  // than reading statusCounts.APPROVED directly (which also includes soft-deleted APPROVED rows).
  const countFor = (status: string) => statusCounts[status] ?? 0;
  // Metrics cards + the status dropdown's per-option counts now come straight from the backend's
  // per-status counts — no need for the full partners list this used to require. Only real
  // PartnerStatus keys are summed for the total (excludes the synthetic one above).
  const totalPartners = PARTNER_STATUS_KEYS.reduce((sum, s) => sum + countFor(s), 0);
  const pendingApprovalCount = PENDING_APPROVAL_STATUSES.reduce((sum, s) => sum + countFor(s), 0);
  const activePartnersCount = countFor('__activeApproved');
  const suspendedCount = countFor('SUSPENDED');

  // Debounce the search input ~350ms before it turns into a backend request.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearchTerm(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchPage = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPartnersPagedServerAction({
        page,
        limit: pageSize,
        q: searchTerm || undefined,
        status: selectedStatus === 'ALL' ? undefined : selectedStatus,
        type: typeFilter,
      });
      setRows(res.data ?? []);
      setPagination({
        total: res.pagination?.total ?? 0,
        totalPages: res.pagination?.totalPages ?? 1,
      });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchTerm, selectedStatus, typeFilter]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  // Row actions can move a partner out of whatever status filter is currently applied (e.g.
  // approving one while filtered to "Pending Approval") — refetch this page after each so a
  // now-filtered-out row actually disappears, instead of patching it in place.
  const wrapAction = (action?: (id: string) => Promise<void>) =>
    action
      ? async (id: string) => {
          await action(id);
          await fetchPage();
        }
      : undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {typeFilter === 'INDIVIDUAL' ? 'Individual Partners' : typeFilter === 'BUSINESS' ? 'Business Partners' : 'Partners'}
          </h1>
          <p className="text-xs text-gray-500 mt-1">Manage platform partners from backend database</p>
        </div>
        <div className="relative flex-1 sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by name, email, city or phone..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <PartnerListMetrics
        totalPartners={totalPartners}
        pendingApprovalCount={pendingApprovalCount}
        activePartnersCount={activePartnersCount}
        suspendedCount={suspendedCount}
      />

      <Card className="rounded-2xl border border-gray-100 shadow-xs overflow-hidden bg-white">
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-gray-100">
          <h2 className="font-bold text-base text-gray-900">Partners List ({pagination.total})</h2>
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
              className="px-3 py-2 text-xs font-medium bg-gray-50 border border-gray-200 rounded-xl text-gray-700 cursor-pointer focus:outline-none"
            >
              <option value="ALL">All Status ({totalPartners})</option>
              <option value="APPROVED">Approved ({countFor('APPROVED')})</option>
              <option value="KYC_SUBMITTED">KYC Submitted ({countFor('KYC_SUBMITTED')})</option>
              {/* Same PENDING_KYC + KYC_SUBMITTED + PENDING_APPROVAL bucket as the metrics card
                  above (pendingApprovalCount) — sent to the backend as the same comma-separated
                  list (GetPartnersFilterDto.status now accepts one value or several, matched
                  with an IN (...)), so this option's count and its actual filtered results
                  agree with the metrics card instead of only matching the literal
                  PENDING_APPROVAL status. */}
              <option value={PENDING_APPROVAL_STATUSES.join(',')}>Pending Approval ({pendingApprovalCount})</option>
              <option value="SUSPENDED">Suspended ({countFor('SUSPENDED')})</option>
              <option value="INCOMPLETE">Incomplete ({countFor('INCOMPLETE')})</option>
              <option value="TRAINING">Training ({countFor('TRAINING')})</option>
              <option value="REJECTED">Rejected ({countFor('REJECTED')})</option>
              <option value="DEACTIVATED">Deactivated ({countFor('DEACTIVATED')})</option>
            </select>
            <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium bg-gray-50 border border-gray-200 rounded-xl text-gray-600">
              <CalendarIcon className="w-3.5 h-3.5 text-gray-400" />
              <span>All Dates</span>
            </div>
            <Button variant="outline" size="sm" className="h-9">
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </Button>
            <Button size="sm" className="h-9" onClick={() => setIsAddModalOpen(true)}>
              <Plus className="w-4 h-4" />
              <span>Add Partner</span>
            </Button>
          </div>
        </div>

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
            <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">Loading partners...</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    <UserCheck className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="font-medium text-sm text-gray-600">No partners found</p>
                  </td>
                </tr>
              ) : (
                rows.map((partner) => (
                  <PartnerListRow
                    key={partner.id}
                    partner={partner}
                    actionMenuOpenId={actionMenuOpenId}
                    setActionMenuOpenId={setActionMenuOpenId}
                    onApprove={wrapAction(onApprove)}
                    onSuspend={wrapAction(onSuspend)}
                    onDelete={wrapAction(onDelete)}
                  />
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
          onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
          totalItems={pagination.total}
          itemLabel="partners"
          className="p-4 border-t border-gray-100"
        />
      </Card>

      {isAddModalOpen && (
        <AddPartnerModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={() => { setIsAddModalOpen(false); onPartnerCreated(); fetchPage(); }}
        />
      )}
    </div>
  );
}
