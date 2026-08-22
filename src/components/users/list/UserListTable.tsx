'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Calendar as CalendarIcon, Download, Plus } from 'lucide-react';
import { User, CreateUserPayload } from '../../../types/user';
import { getUsersPagedServerAction } from '../../../lib/server-actions/user';
import UserListRow from './UserListRow';
import AddUserModal from './AddUserModal';
import DeactivateUserModal from './DeactivateUserModal';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import Pagination from '../../shared/Pagination';

interface UserListTableProps {
  onAddUser?: (payload: CreateUserPayload) => Promise<void>;
  onDeactivateUser?: (userId: string, reason?: string) => Promise<void>;
}

export default function UserListTable({
  onAddUser,
  onDeactivateUser,
}: UserListTableProps) {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [dateRange] = useState('01 Jun 2026 - 31 Jul 2026');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [userToDeactivate, setUserToDeactivate] = useState<User | null>(null);

  // Debounce the search input ~350ms before it turns into a backend request.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const isActiveParam =
    selectedStatus === 'ACTIVE' ? true : selectedStatus === 'INACTIVE' ? false : undefined;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getUsersPagedServerAction({
        page,
        limit: pageSize,
        q: search || undefined,
        isActive: isActiveParam,
      });
      setUsers(res.data ?? []);
      setPagination({
        total: res.pagination?.total ?? 0,
        totalPages: res.pagination?.totalPages ?? 1,
      });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, isActiveParam]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDeactivateConfirm = async (userId: string, reason?: string) => {
    if (onDeactivateUser) {
      await onDeactivateUser(userId, reason);
    }
    // The row's active state just changed under whatever isActive filter is applied — refetch
    // this page instead of patching locally so a now-filtered-out row actually disappears.
    await fetchUsers();
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
                setPage(1);
              }}
              className="flex h-9 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C68A4C]/30 focus-visible:border-[#C68A4C] transition-all cursor-pointer hover:bg-gray-50"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Users</option>
              <option value="INACTIVE">Inactive Users</option>
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
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
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
            {loading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-xs text-gray-500">
                  Loading users...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-xs text-gray-500">
                  No users found matching criteria.
                </td>
              </tr>
            ) : (
              users.map((user) => (
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
      <Pagination
        page={page}
        totalPages={pagination.totalPages}
        onPageChange={setPage}
        pageSize={pageSize}
        onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
        pageSizeOptions={[10, 20, 50]}
        totalItems={pagination.total}
        itemLabel="users"
        className="pt-2"
      />

      {/* Modals */}
      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={async (payload) => {
          if (onAddUser) await onAddUser(payload);
          await fetchUsers();
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
