'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { UserListMetrics, UserListTable } from '../../components/users';
import { getUsersServerAction, deleteUserServerAction, updateUserServerAction } from '../../lib/server-actions/user';
import { User, CreateUserPayload } from '../../types/user';
import { Card } from '../../components/ui/card';
import { SkeletonTableRows } from '../../components/ui/skeleton';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  const fetchUsers = useCallback(async (isRefresh = false) => {
    if (fetchedRef.current && !isRefresh) return;
    fetchedRef.current = true;
    setLoading(true);
    try {
      const data = await getUsersServerAction();
      setUsers(data);
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAddUser = async (payload: CreateUserPayload) => {
    alert(`User creation simulated for ${payload.name}.`);
    await fetchUsers(true);
  };

  const handleDeactivateUser = async (userId: string, reason?: string) => {
    const res = await updateUserServerAction(userId, { isActive: false });
    if (res.ok) {
      // Patch just this row locally instead of refetching (and skeleton-flashing) the whole list.
      setUsers(prev => prev.map(u => (u.id === userId ? { ...u, ...(res.data ?? { isActive: false }) } : u)));
    } else {
      alert(res.message || 'Failed to deactivate user');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Metrics */}
      <UserListMetrics users={users} />

      {/* Users Table */}
      {loading ? (
        <Card className="rounded-2xl border border-gray-100 shadow-xs overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
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
                <SkeletonTableRows rows={6} columns={5} />
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <UserListTable
          users={users}
          onAddUser={handleAddUser}
          onDeactivateUser={handleDeactivateUser}
        />
      )}
    </div>
  );
}
