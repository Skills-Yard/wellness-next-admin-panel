'use client';

import React, { useState, useMemo } from 'react';
import { Search, Calendar as CalendarIcon, Download, Plus, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { User, CreateUserPayload } from '../../../types/user';
import UserListRow from './UserListRow';
import AddUserModal from './AddUserModal';
import DeactivateUserModal from './DeactivateUserModal';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';

interface UserListTableProps {
  users: User[];
  onAddUser?: (payload: CreateUserPayload) => Promise<void>;
  onDeactivateUser?: (userId: string, reason?: string) => Promise<void>;
}

export default function UserListTable({
  users,
  onAddUser,
  onDeactivateUser,
}: UserListTableProps) {
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [dateRange, setDateRange] = useState('01 Jun 2026 - 31 Jul 2026');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [userToDeactivate, setUserToDeactivate] = useState<User | null>(null);

  // Filter logic
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        !search ||
        (u.name && u.name.toLowerCase().includes(search.toLowerCase())) ||
        (u.email && u.email.toLowerCase().includes(search.toLowerCase())) ||
        (u.phone && u.phone.includes(search)) ||
        (u.accountCode && u.accountCode.toLowerCase().includes(search.toLowerCase()));

      const matchesStatus =
        selectedStatus === 'ALL' ||
        (selectedStatus === 'ACTIVE' && u.isActive) ||
        (selectedStatus === 'INACTIVE' && !u.isActive) ||
        (selectedStatus === 'UNVERIFIED' && !u.isPhoneVerified);

      return matchesSearch && matchesStatus;
    });
  }, [users, search, selectedStatus]);

  const totalUsers = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalUsers / pageSize));
  
  // Keep currentPage within bounds
  const validPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = totalUsers === 0 ? 0 : (validPage - 1) * pageSize + 1;
  const endIndex = Math.min(validPage * pageSize, totalUsers);

  const paginatedUsers = useMemo(() => {
    const start = (validPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, validPage, pageSize]);

  // Generate page numbers list for rendering
  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (validPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }
    if (validPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', validPage - 1, validPage, validPage + 1, '...', totalPages];
  }, [totalPages, validPage]);

  const handleDeactivateConfirm = async (userId: string, reason?: string) => {
    if (onDeactivateUser) {
      await onDeactivateUser(userId, reason);
    }
  };

  return (
    <Card className="bg-white border-gray-100 shadow-xs rounded-2xl overflow-hidden space-y-4 p-5 sm:p-6">
      {/* Top Search Header & Actions */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-gray-900">Users List</h2>
          <p className="text-xs text-gray-500">Manage and view registered customer accounts</p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Filter Dropdown */}
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="flex h-9 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C68A4C]/30 focus-visible:border-[#C68A4C] transition-all cursor-pointer hover:bg-gray-50"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Users</option>
              <option value="INACTIVE">Inactive Users</option>
              <option value="UNVERIFIED">Unverified Users</option>
            </select>
          </div>

          {/* Date Picker Button */}
          <Button variant="outline" size="sm" className="text-xs gap-2">
            <span>{dateRange}</span>
            <CalendarIcon className="w-3.5 h-3.5 text-gray-400" />
          </Button>

          {/* Export Button */}
          <Button variant="outline" size="sm" className="text-xs gap-2">
            <Download className="w-3.5 h-3.5 text-gray-500" />
            <span>Export</span>
          </Button>

          {/* Add User Button */}
          <Button
            onClick={() => setIsAddModalOpen(true)}
            size="sm"
            className="text-xs gap-2 ml-auto sm:ml-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add User</span>
          </Button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <Input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="Search by name, email or phone..."
          className="pl-10"
        />
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto border border-gray-100 rounded-xl">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-[#FAF8F5] border-b border-gray-100 text-[11px] font-semibold text-gray-600 tracking-wider">
              <th className="py-3 px-4">User</th>
              <th className="py-3 px-4">Contact</th>
              <th className="py-3 px-4">Phone Verified</th>
              <th className="py-3 px-4">Joined</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Last Seen</th>
              <th className="py-3 px-4">Booking</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedUsers.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-xs text-gray-500">
                  No users found matching criteria.
                </td>
              </tr>
            ) : (
              paginatedUsers.map((user) => (
                <UserListRow
                  key={user.id}
                  user={user}
                  onDeactivate={(u) => setUserToDeactivate(u)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <p className="text-xs text-gray-500 font-medium">
          Showing {startIndex} to {endIndex} of {totalUsers} users
        </p>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {/* Prev Button */}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg"
              disabled={validPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            {/* Page Buttons */}
            {pageNumbers.map((item, idx) => {
              if (item === '...') {
                return (
                  <span key={`ellipsis-${idx}`} className="text-xs text-gray-400 px-1">
                    ...
                  </span>
                );
              }
              const pageNum = item as number;
              const isActive = pageNum === validPage;
              return (
                <Button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  variant={isActive ? 'default' : 'ghost'}
                  size="icon"
                  className="h-8 w-8 rounded-lg text-xs font-semibold"
                >
                  {pageNum}
                </Button>
              );
            })}

            {/* Next Button */}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg"
              disabled={validPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Page Size selector */}
          <div className="relative">
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="appearance-none pl-3 pr-8 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl focus:outline-none cursor-pointer"
            >
              <option value={10}>10/ Page</option>
              <option value={20}>20/ Page</option>
              <option value={50}>50/ Page</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={async (payload) => {
          if (onAddUser) await onAddUser(payload);
        }}
      />

      <DeactivateUserModal
        user={userToDeactivate}
        isOpen={!!userToDeactivate}
        onClose={() => setUserToDeactivate(null)}
        onConfirm={handleDeactivateConfirm}
      />
    </Card>
  );
}
