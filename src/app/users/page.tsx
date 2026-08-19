'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { UserListMetrics, UserListTable } from '../../components/users';
import { getUsersServerAction, deleteUserServerAction, updateUserServerAction } from '../../lib/server-actions/user';
import { User, CreateUserPayload } from '../../types/user';
import { Card } from '../../components/ui/card';
import { SkeletonTableRows } from '../../components/ui/skeleton';
import { getCached, setCached } from '../../lib/sessionCache';
import FetchErrorBanner from '../../components/common/FetchErrorBanner';

const CACHE_KEY = 'users:list';

export default function UsersPage() {
  const cached = getCached<User[]>(CACHE_KEY);
  const [users, setUsers] = useState<User[]>(cached || []);
  // Only the very first, never-cached load shows the full skeleton — a revisit this session
  // renders the cached list immediately while refreshing quietly underneath.
  const [loading, setLoading] = useState(cached === undefined);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    if (getCached<User[]>(CACHE_KEY) === undefined) setLoading(true);
    setError(null);
    try {
      const data = await getUsersServerAction();
      setCached(CACHE_KEY, data);
      setUsers(data);
    } catch (err: any) {
      console.error('Error loading users:', err?.response?.data || err?.message || err);
      // Keep whatever's already on screen (cached or previous) — a failed refresh shouldn't
      // wipe out good data, it should just say so.
      setError("Couldn't load the latest users list.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAddUser = async (payload: CreateUserPayload) => {
    alert(`User creation simulated for ${payload.name}.`);
    await fetchUsers();
  };

  const handleDeactivateUser = async (userId: string, reason?: string) => {
    const res = await updateUserServerAction(userId, { isActive: false });
    if (res.ok) {
      // Patch just this row locally instead of refetching (and skeleton-flashing) the whole list.
      setUsers(prev => {
        const next = prev.map(u => (u.id === userId ? { ...u, ...(res.data ?? { isActive: false }) } : u));
        setCached(CACHE_KEY, next);
        return next;
      });
    } else {
      alert(res.message || 'Failed to deactivate user');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Metrics */}
      <UserListMetrics users={users} />

      {error && <FetchErrorBanner message={error} onRetry={fetchUsers} />}

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
