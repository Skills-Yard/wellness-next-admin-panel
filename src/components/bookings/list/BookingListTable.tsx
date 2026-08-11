'use client';

import React, { useState } from 'react';
import { Calendar as CalendarIcon, Download, ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
import { Booking } from '../../../types/booking';
import BookingListMetrics from './BookingListMetrics';
import BookingListRow from './BookingListRow';
import BookingListFilters from './BookingListFilters';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';

interface BookingListTableProps {
  bookings: Booking[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  onRefresh: () => void;
  onCancelBooking?: (id: string) => void;
}

export default function BookingListTable({
  bookings,
  activeTab,
  onTabChange,
  onRefresh,
  onCancelBooking,
}: BookingListTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [actionMenuOpenId, setActionMenuOpenId] = useState<string | null>(null);

  const activeBookings = bookings.filter((b) => b.status === 'CONFIRMED' || b.status === 'PARTNER_ASSIGNED' || b.status === 'IN_PROGRESS').length;
  const ongoingServices = bookings.filter((b) => b.status === 'IN_PROGRESS' || b.status === 'PARTNER_ARRIVED' || b.status === 'PARTNER_EN_ROUTE').length;
  const todaysServices = bookings.length;
  const totalActiveRevenue = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  const filteredBookings = bookings.filter((b) => {
    let matchesTab = true;
    if (activeTab === 'active') matchesTab = b.status === 'IN_PROGRESS' || b.status === 'PARTNER_ARRIVED' || b.status === 'PARTNER_EN_ROUTE';
    else if (activeTab === 'upcoming') matchesTab = b.status === 'CONFIRMED' || b.status === 'PARTNER_ASSIGNED' || b.status === 'ASSIGNING_PARTNER';
    else if (activeTab === 'completed') matchesTab = b.status === 'COMPLETED';
    else if (activeTab === 'cancelled') matchesTab = b.status === 'CANCELLED' || b.status === 'EXPIRED';

    const matchesStatus = selectedStatus === 'ALL' || b.status === selectedStatus;
    const matchesSearch = !searchTerm ||
      (b.bookingCode && b.bookingCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (b.user?.name && b.user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (b.user?.phone && b.user.phone.includes(searchTerm)) ||
      (b.partner?.name && b.partner.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesTab && matchesStatus && matchesSearch;
  });

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBookings = filteredBookings.slice(startIndex, startIndex + itemsPerPage);

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
            <button key={tab.id} onClick={() => { onTabChange(tab.id); setCurrentPage(1); }} className={`pb-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${activeTab === tab.id ? 'border-[#D4A373] text-[#D4A373]' : 'border-transparent text-gray-500 hover:text-gray-900'}`}>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <Card className="rounded-2xl border border-gray-100 shadow-xs overflow-hidden bg-white">
        <BookingListFilters searchTerm={searchTerm} onSearchChange={setSearchTerm} selectedStatus={selectedStatus} onStatusChange={(val) => { setSelectedStatus(val); setCurrentPage(1); }} totalCount={bookings.length} />

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
              {paginatedBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="font-semibold text-sm text-gray-700">No bookings found</p>
                  </td>
                </tr>
              ) : (
                paginatedBookings.map((b) => <BookingListRow key={b.id} booking={b} actionMenuOpenId={actionMenuOpenId} setActionMenuOpenId={setActionMenuOpenId} onCancelBooking={onCancelBooking} />)
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div>Showing <span className="font-semibold text-gray-900">{filteredBookings.length > 0 ? startIndex + 1 : 0}</span> to <span className="font-semibold text-gray-900">{Math.min(startIndex + itemsPerPage, filteredBookings.length)}</span> of <span className="font-semibold text-gray-900">{filteredBookings.length}</span> bookings</div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
              <span className="px-2 font-semibold text-gray-900">{currentPage} / {totalPages}</span>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
            </div>
            <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="px-2.5 py-1 text-xs border border-gray-200 rounded-lg bg-white text-gray-700 cursor-pointer focus:outline-none">
              <option value={10}>10/ Page</option>
              <option value={50}>50/ Page</option>
              <option value={100}>100/ Page</option>
            </select>
          </div>
        </div>
      </Card>
    </div>
  );
}
