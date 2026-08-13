'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { UserListMetrics, UserListTable } from '../../components/users';
import { getUsersServerAction, deleteUserServerAction, updateUserServerAction } from '../../lib/server-actions/user';
import { User, CreateUserPayload } from '../../types/user';
import { Loader2 } from 'lucide-react';

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
      await fetchUsers(true);
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
        <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#D4A373]" />
          <span className="text-xs font-semibold">Loading users list...</span>
        </div>
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
