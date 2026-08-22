'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Calendar as CalendarIcon, Download, ShoppingBag } from 'lucide-react';
import { Booking } from '../../../types/booking';
import { getBookingsPagedServerAction } from '../../../lib/server-actions/booking';
import BookingListMetrics from './BookingListMetrics';
import BookingListRow from './BookingListRow';
import BookingListFilters from './BookingListFilters';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import Pagination from '../../shared/Pagination';

interface BookingListTableProps {
  bookings: Booking[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  onRefresh: () => void;
  onCancelBooking?: (id: string) => void;
}

// The backend's status filter (GetBookingsQueryDto.status) now accepts a comma-separated list,
// matched with an `IN (...)` — so a tab that groups several statuses (e.g. "Active Services")
// sends them all in one request instead of needing an unsupported OR-of-statuses. Real
// BookingStatus values only (PARTNER_ASSIGNED/ASSIGNING_PARTNER/bare CANCELLED referenced by the
// old client-side filter were never real enum members — see prisma/schema/enums.prisma in the
// backend repo): active = the partner is actively en route/arrived/mid-service; upcoming =
// confirmed and in the matching pipeline but not yet started; cancelled = all three
// CANCELLED_BY_* variants.
const TAB_STATUS: Record<string, string | undefined> = {
  all: undefined,
  active: 'IN_PROGRESS,PARTNER_ARRIVED,PARTNER_EN_ROUTE',
  upcoming: 'CONFIRMED,BROADCASTED,ACCEPTED',
  completed: 'COMPLETED',
  cancelled: 'CANCELLED_BY_CLIENT,CANCELLED_BY_PARTNER,CANCELLED_BY_ADMIN',
};

export default function BookingListTable({
  bookings,
  activeTab,
  onTabChange,
  onRefresh,
  onCancelBooking,
}: BookingListTableProps) {
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [actionMenuOpenId, setActionMenuOpenId] = useState<string | null>(null);

  const [rows, setRows] = useState<Booking[]>([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Metrics cards still read off the full `bookings` list the parent page fetches — see that
  // page's own fetch/cache for why (unrelated to this table's own paginated rows).
  const activeBookings = bookings.filter((b) => b.status === 'CONFIRMED' || b.status === 'PARTNER_ASSIGNED' || b.status === 'IN_PROGRESS').length;
  const ongoingServices = bookings.filter((b) => b.status === 'IN_PROGRESS' || b.status === 'PARTNER_ARRIVED' || b.status === 'PARTNER_EN_ROUTE').length;
  const todaysServices = bookings.length;
  const totalActiveRevenue = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  // Debounce the search input ~350ms before it turns into a backend request.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearchTerm(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  // The dropdown wins over the tab when both could apply — picking any specific status there is
  // a more precise request than a tab's (mostly unfilterable) grouping.
  const effectiveStatus = selectedStatus !== 'ALL' ? selectedStatus : TAB_STATUS[activeTab];

  const fetchPage = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getBookingsPagedServerAction({
        page,
        limit: pageSize,
        q: searchTerm || undefined,
        status: effectiveStatus,
      });
      setRows(res.data ?? []);
      setPagination({
        total: res.pagination?.total ?? 0,
        totalPages: res.pagination?.totalPages ?? 1,
      });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchTerm, effectiveStatus]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  const handleCancel = onCancelBooking
    ? async (id: string) => {
        // onCancelBooking is declared void-returning but the parent page's implementation is
        // actually async (prompts, calls the API, then silently refetches the full list for the
        // metrics cards) — await it before refetching this table's own current page, so a
        // just-cancelled row's status is already updated server-side by the time it reloads.
        await onCancelBooking(id);
        await fetchPage();
      }
    : undefined;

  const TABS = [
    { id: 'all', label: 'All Bookings' },
    { id: 'active', label: 'Active Services' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'completed', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Active Services</h1>
          <p className="text-xs text-gray-500 mt-1">Manage all ongoing and upcoming bookings across platform</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium bg-white border border-gray-200 rounded-xl text-gray-700 shadow-xs">
            <CalendarIcon className="w-4 h-4 text-gray-400" />
            <span>12 May - 11 Jun, 2025</span>
          </div>
          <Button variant="outline" size="sm" className="h-9">
            <Download className="w-4 h-4 mr-1" />
            <span>Export</span>
          </Button>
        </div>
      </div>

      <BookingListMetrics activeBookings={activeBookings} ongoingServices={ongoingServices} todaysServices={todaysServices} totalActiveRevenue={totalActiveRevenue} />

      <div className="border-b border-gray-200">
        <nav className="flex space-x-6">
          {TABS.map((tab) => (
            <button key={tab.id} onClick={() => { onTabChange(tab.id); setPage(1); }} className={`pb-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${activeTab === tab.id ? 'border-[#D4A373] text-[#D4A373]' : 'border-transparent text-gray-500 hover:text-gray-900'}`}>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <Card className="rounded-2xl border border-gray-100 shadow-xs overflow-hidden bg-white">
        <BookingListFilters searchTerm={searchInput} onSearchChange={setSearchInput} selectedStatus={selectedStatus} onStatusChange={(val) => { setSelectedStatus(val); setPage(1); }} totalCount={pagination.total} />

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-3.5 px-5">Booking & Service</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Partner & Employee</th>
                <th className="py-3.5 px-4">Schedule</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">Loading bookings...</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="font-semibold text-sm text-gray-700">No bookings found</p>
                  </td>
                </tr>
              ) : (
                rows.map((b) => <BookingListRow key={b.id} booking={b} actionMenuOpenId={actionMenuOpenId} setActionMenuOpenId={setActionMenuOpenId} onCancelBooking={handleCancel} />)
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
          pageSizeOptions={[10, 50, 100]}
          totalItems={pagination.total}
          itemLabel="bookings"
          className="p-4 border-t border-gray-100"
        />
      </Card>
    </div>
  );
}
