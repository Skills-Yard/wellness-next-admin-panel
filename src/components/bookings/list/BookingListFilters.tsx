'use client';

import React from 'react';
import { Search, Filter } from 'lucide-react';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';

interface BookingListFiltersProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  selectedStatus: string;
  onStatusChange: (val: string) => void;
  totalCount: number;
}

export default function BookingListFilters({
  searchTerm,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  totalCount,
}: BookingListFiltersProps) {
  return (
    <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-100 bg-gray-50/40">
      <div className="relative flex-1">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search by service, customer, partner, employee or booking ID..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9.5 h-10 text-xs rounded-xl bg-white border-gray-200 shadow-2xs focus:border-[#D4A373] transition-all"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <select
          value={selectedStatus}
          onChange={(e) => onStatusChange(e.target.value)}
          className="px-3.5 py-2 text-xs font-semibold bg-white border border-gray-200 rounded-xl text-gray-700 cursor-pointer shadow-2xs focus:outline-none focus:border-[#D4A373] transition-all"
        >
          <option value="ALL">All Status ({totalCount})</option>
          <option value="IN_PROGRESS">Ongoing</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="PENDING_PAYMENT">Pending Payment</option>
          <option value="EXPIRED">Expired</option>
        </select>

        <Button variant="outline" size="sm" className="h-10 px-3.5 rounded-xl border-gray-200 font-semibold text-gray-700 bg-white shadow-2xs hover:bg-gray-50">
          <Filter className="w-3.5 h-3.5 mr-1.5 text-gray-500" />
          <span>Filters</span>
        </Button>
      </div>
    </div>
  );
}
