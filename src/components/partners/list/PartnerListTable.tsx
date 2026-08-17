'use client';

import React, { useState } from 'react';
import { Search, Calendar as CalendarIcon, Download, Plus, ChevronLeft, ChevronRight, UserCheck } from 'lucide-react';
import { Partner, PartnerStatus } from '../../../types/partner';
import AddPartnerModal from './AddPartnerModal';
import PartnerListMetrics from './PartnerListMetrics';
import PartnerListRow from './PartnerListRow';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';

interface PartnerListTableProps {
  partners: Partner[];
  onRefresh: () => void;
  onApprove?: (id: string) => Promise<void>;
  onSuspend?: (id: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

const STATUS_PRIORITY: Record<string, number> = {
  APPROVED: 1,
  KYC_SUBMITTED: 2,
  PENDING_APPROVAL: 3,
  PENDING_KYC: 4,
  INCOMPLETE: 5,
  SUSPENDED: 6,
  REJECTED: 7,
};

// A partner in any of these statuses still needs some admin action before going live. This is
// the single definition of "Pending Approval" — used for both the metrics card above the table
// and the status filter dropdown's "Pending Approval" option/count — so the two never disagree
// on what that label means (they used to: the card summed all three, the dropdown option only
// matched PENDING_APPROVAL itself, so e.g. a partner sitting in KYC_SUBMITTED counted toward
// the card's "4" but not the dropdown's "0" for the exact same label).
const PENDING_APPROVAL_STATUSES: PartnerStatus[] = ['PENDING_KYC', 'KYC_SUBMITTED', 'PENDING_APPROVAL'];
const isPendingApproval = (status: PartnerStatus) => PENDING_APPROVAL_STATUSES.includes(status);

export default function PartnerListTable({
  partners,
  onRefresh,
  onApprove,
  onSuspend,
  onDelete,
}: PartnerListTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [actionMenuOpenId, setActionMenuOpenId] = useState<string | null>(null);

  const totalPartners = partners.length;
  const pendingApprovalCount = partners.filter((p) => isPendingApproval(p.status)).length;
  const activePartnersCount = partners.filter((p) => p.status === 'APPROVED' && p.isActive).length;
  const suspendedCount = partners.filter((p) => p.status === 'SUSPENDED').length;

  const filteredPartners = partners.filter((partner) => {
    const matchesSearch = !searchTerm ||
      (partner.name && partner.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (partner.email && partner.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (partner.city && partner.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (partner.phone && partner.phone.includes(searchTerm));
    const matchesStatus = selectedStatus === 'ALL'
      || (selectedStatus === 'PENDING_APPROVAL' ? isPendingApproval(partner.status) : partner.status === selectedStatus);
    return matchesSearch && matchesStatus;
  });

  // Group and sort partners deterministically so approved partners stay together at top
  const sortedPartners = [...filteredPartners].sort((a, b) => {
    const priorityA = STATUS_PRIORITY[a.status] || 99;
    const priorityB = STATUS_PRIORITY[b.status] || 99;
    if (priorityA !== priorityB) return priorityA - priorityB;
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

  const totalPages = Math.ceil(sortedPartners.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPartners = sortedPartners.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Partners</h1>
          <p className="text-xs text-gray-500 mt-1">Manage platform partners from backend database</p>
        </div>
        <div className="relative flex-1 sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by name, email, city or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
          <h2 className="font-bold text-base text-gray-900">Partners List ({sortedPartners.length})</h2>
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 text-xs font-medium bg-gray-50 border border-gray-200 rounded-xl text-gray-700 cursor-pointer focus:outline-none"
            >
              <option value="ALL">All Status ({partners.length})</option>
              <option value="APPROVED">Approved ({partners.filter(p => p.status === 'APPROVED').length})</option>
              <option value="KYC_SUBMITTED">KYC Submitted ({partners.filter(p => p.status === 'KYC_SUBMITTED').length})</option>
              {/* Same PENDING_KYC + KYC_SUBMITTED + PENDING_APPROVAL bucket as the metrics card
                  above (isPendingApproval) — so this count and that card's never disagree. */}
              <option value="PENDING_APPROVAL">Pending Approval ({partners.filter(p => isPendingApproval(p.status)).length})</option>
              <option value="SUSPENDED">Suspended ({partners.filter(p => p.status === 'SUSPENDED').length})</option>
              <option value="INCOMPLETE">Incomplete ({partners.filter(p => p.status === 'INCOMPLETE').length})</option>
              <option value="TRAINING">Training ({partners.filter(p => p.status === 'TRAINING').length})</option>
              <option value="REJECTED">Rejected ({partners.filter(p => p.status === 'REJECTED').length})</option>
              <option value="DEACTIVATED">Deactivated ({partners.filter(p => p.status === 'DEACTIVATED').length})</option>
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
              {paginatedPartners.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    <UserCheck className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="font-medium text-sm text-gray-600">No partners found</p>
                  </td>
                </tr>
              ) : (
                paginatedPartners.map((partner) => (
                  <PartnerListRow
                    key={partner.id}
                    partner={partner}
                    actionMenuOpenId={actionMenuOpenId}
                    setActionMenuOpenId={setActionMenuOpenId}
                    onApprove={onApprove}
                    onSuspend={onSuspend}
                    onDelete={onDelete}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div>Showing <span className="font-semibold text-gray-900">{sortedPartners.length > 0 ? startIndex + 1 : 0}</span> to <span className="font-semibold text-gray-900">{Math.min(startIndex + itemsPerPage, sortedPartners.length)}</span> of <span className="font-semibold text-gray-900">{sortedPartners.length}</span> partners</div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
              <span className="px-2 font-semibold text-gray-900">{currentPage} / {totalPages}</span>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
            </div>
            <select
              value={itemsPerPage}
              onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="px-2.5 py-1 text-xs border border-gray-200 rounded-lg bg-white text-gray-700 cursor-pointer focus:outline-none"
            >
              <option value={10}>10/ Page</option>
              <option value={20}>20/ Page</option>
              <option value={50}>50/ Page</option>
              <option value={100}>100/ Page</option>
            </select>
          </div>
        </div>
      </Card>

      {isAddModalOpen && (
        <AddPartnerModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSuccess={() => { setIsAddModalOpen(false); onRefresh(); }} />
      )}
    </div>
  );
}
