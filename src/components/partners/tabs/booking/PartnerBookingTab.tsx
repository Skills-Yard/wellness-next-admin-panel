'use client';

import React, { useState } from 'react';
import { Download, ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
import { Partner, PartnerBooking } from '../../../../types/partner';
import PartnerBookingRow from './PartnerBookingRow';
import { Card } from '../../../ui/card';
import { Button } from '../../../ui/button';

interface PartnerBookingTabProps {
  partner: Partner;
  bookings: PartnerBooking[];
}

export default function PartnerBookingTab({ partner, bookings }: PartnerBookingTabProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const filteredBookings = bookings.filter((b) =>
    selectedStatus === 'ALL' ? true : b.status === selectedStatus
  );

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBookings = filteredBookings.slice(startIndex, startIndex + itemsPerPage);

  return (
    <Card className="p-6 shadow-xs space-y-5 bg-white border-gray-100">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-base text-gray-900">Bookings History</h3>
          <p className="text-xs text-gray-500 mt-0.5">Real booking history recorded for this partner in database</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedStatus}
            onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 text-xs font-medium bg-gray-50 border border-gray-200 rounded-xl text-gray-700 cursor-pointer focus:outline-none"
          >
            <option value="ALL">All Status ({bookings.length})</option>
            <option value="COMPLETED">Completed</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <Button variant="outline" size="sm" className="h-9">
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto border border-gray-100 rounded-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/70 border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              <th className="py-3 px-5">Booking ID</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Service</th>
              <th className="py-3 px-4">Date & Time</th>
              <th className="py-3 px-4">Amount</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Payment</th>
              <th className="py-3 px-4">Rating</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
            {paginatedBookings.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-gray-400">
                  <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="font-semibold text-sm text-gray-700">No bookings found for this partner</p>
                </td>
              </tr>
            ) : (
              paginatedBookings.map((b) => <PartnerBookingRow key={b.id} booking={b} />)
            )}
          </tbody>
        </table>
      </div>

      <div className="p-2 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
        <div>Showing <span className="font-semibold text-gray-900">{filteredBookings.length > 0 ? startIndex + 1 : 0}</span> to <span className="font-semibold text-gray-900">{Math.min(startIndex + itemsPerPage, filteredBookings.length)}</span> of <span className="font-semibold text-gray-900">{filteredBookings.length}</span> bookings</div>
        <div className="flex items-center gap-1">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
          <span className="px-2 font-semibold text-gray-900">{currentPage} / {totalPages}</span>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>
    </Card>
  );
}
