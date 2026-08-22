'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { UserListMetrics, UserListTable } from '../../components/users';
import { getUsersServerAction, updateUserServerAction } from '../../lib/server-actions/user';
import { User, CreateUserPayload } from '../../types/user';
import { SkeletonCard } from '../../components/ui/skeleton';
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
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : (
        <UserListMetrics users={users} />
      )}

      {error && <FetchErrorBanner message={error} onRetry={fetchUsers} />}

      {/* Users Table — fetches and paginates its own data server-side; `users` above is only
          the full list used for the metrics cards. */}
      <UserListTable
        onAddUser={handleAddUser}
        onDeactivateUser={handleDeactivateUser}
      />
    </div>
  );
}
