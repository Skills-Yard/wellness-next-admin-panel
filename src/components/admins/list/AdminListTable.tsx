'use client';

import React, { useMemo, useState } from 'react';
import { Search, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { Admin, AdminRole } from '../../../types/admin';
import AdminListRow from './AdminListRow';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';

interface AdminListTableProps {
  admins: Admin[];
  currentAdminId?: string;
  deletingId: string | null;
  onDelete: (admin: Admin) => void;
}

const ROLE_OPTIONS: { value: 'ALL' | AdminRole; label: string }[] = [
  { value: 'ALL', label: 'All Roles' },
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'OPERATIONS', label: 'Operations' },
  { value: 'FINANCE', label: 'Finance' },
  { value: 'CONTENT', label: 'Content' },
  { value: 'SUPPORT', label: 'Support' },
];

export default function AdminListTable({ admins, currentAdminId, deletingId, onDelete }: AdminListTableProps) {
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<'ALL' | AdminRole>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredAdmins = useMemo(() => {
    return admins.filter((a) => {
      const matchesSearch =
        !search ||
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.email.toLowerCase().includes(search.toLowerCase());
      const matchesRole = selectedRole === 'ALL' || a.role === selectedRole;
      const matchesStatus =
        selectedStatus === 'ALL' ||
        (selectedStatus === 'ACTIVE' && a.isActive) ||
        (selectedStatus === 'INACTIVE' && !a.isActive);
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [admins, search, selectedRole, selectedStatus]);

  const totalAdmins = filteredAdmins.length;
  const totalPages = Math.max(1, Math.ceil(totalAdmins / pageSize));
  const validPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = totalAdmins === 0 ? 0 : (validPage - 1) * pageSize + 1;
  const endIndex = Math.min(validPage * pageSize, totalAdmins);

  const paginatedAdmins = useMemo(() => {
    const start = (validPage - 1) * pageSize;
    return filteredAdmins.slice(start, start + pageSize);
  }, [filteredAdmins, validPage, pageSize]);

  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (validPage <= 4) return [1, 2, 3, 4, 5, '...', totalPages];
    if (validPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', validPage - 1, validPage, validPage + 1, '...', totalPages];
  }, [totalPages, validPage]);

  return (
    <Card className="bg-white border-gray-100 shadow-xs rounded-2xl overflow-hidden space-y-4 p-5 sm:p-6">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-gray-900">Admins List</h2>
          <p className="text-xs text-gray-500">Manage admin panel accounts and access</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <select
              value={selectedRole}
              onChange={(e) => { setSelectedRole(e.target.value as 'ALL' | AdminRole); setCurrentPage(1); }}
              className="flex h-9 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C68A4C]/30 focus-visible:border-[#C68A4C] transition-all cursor-pointer hover:bg-gray-50"
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE'); setCurrentPage(1); }}
              className="flex h-9 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C68A4C]/30 focus-visible:border-[#C68A4C] transition-all cursor-pointer hover:bg-gray-50"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <Input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          placeholder="Search by name or email..."
          className="pl-10"
        />
      </div>

      <div className="overflow-x-auto border border-gray-100 rounded-xl">
        <table className="w-full text-left border-collapse min-w-[760px]">
          <thead>
            <tr className="bg-[#FAF8F5] border-b border-gray-100 text-[11px] font-semibold text-gray-600 tracking-wider">
              <th className="py-3 px-4">Admin</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Last Login</th>
              <th className="py-3 px-4">Joined</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedAdmins.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-xs text-gray-500">
                  No admins found matching criteria.
                </td>
              </tr>
            ) : (
              paginatedAdmins.map((admin) => (
                <AdminListRow
                  key={admin.id}
                  admin={admin}
                  isSelf={admin.id === currentAdminId}
                  deleting={deletingId === admin.id}
                  onDelete={onDelete}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <p className="text-xs text-gray-500 font-medium">
          Showing {startIndex} to {endIndex} of {totalAdmins} admins
        </p>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg"
              disabled={validPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            {pageNumbers.map((item, idx) => {
              if (item === '...') {
                return <span key={`ellipsis-${idx}`} className="text-xs text-gray-400 px-1">...</span>;
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

          <div className="relative">
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
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
    </Card>
  );
}
