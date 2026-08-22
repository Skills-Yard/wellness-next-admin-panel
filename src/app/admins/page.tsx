'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { useConfirm } from '../../components/ui/confirm-dialog';
import AdminListMetrics from '../../components/admins/list/AdminListMetrics';
import AdminListTable from '../../components/admins/list/AdminListTable';
import { getAdminsServerAction, deleteAdminServerAction } from '../../lib/server-actions/admin';
import { Admin } from '../../types/admin';
import { Card } from '../../components/ui/card';
import { SkeletonTableRows } from '../../components/ui/skeleton';
import { getCached, setCached } from '../../lib/sessionCache';
import FetchErrorBanner from '../../components/common/FetchErrorBanner';

const CACHE_KEY = 'admins:list';

export default function AdminsPage() {
  const { user } = useAuth();
  const confirm = useConfirm();

  const cached = getCached<Admin[]>(CACHE_KEY);
  const [admins, setAdmins] = useState<Admin[]>(cached || []);
  // Only the very first, never-cached load shows the full skeleton — a revisit this session
  // renders the cached list immediately while refreshing quietly underneath (see sessionCache.ts).
  const [loading, setLoading] = useState(cached === undefined);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchAdmins = useCallback(async () => {
    if (getCached<Admin[]>(CACHE_KEY) === undefined) setLoading(true);
    setError(null);
    try {
      const data = await getAdminsServerAction();
      setCached(CACHE_KEY, data);
      setAdmins(data);
    } catch (err: any) {
      console.error('Error loading admins:', err?.response?.data || err?.message || err);
      setError("Couldn't load the latest admins list.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const handleDelete = async (admin: Admin) => {
    const ok = await confirm({
      title: 'Delete this admin?',
      description: `"${admin.name}" (${admin.email}) will lose access to the admin panel immediately. This can't be undone.`,
    });
    if (!ok) return;

    setDeletingId(admin.id);
    try {
      const res = await deleteAdminServerAction(admin.id);
      if (res.ok) {
        setAdmins((prev) => {
          const next = prev.filter((a) => a.id !== admin.id);
          setCached(CACHE_KEY, next);
          return next;
        });
        toast.success('Admin deleted successfully!');
      } else {
        toast.error(res.message || 'Failed to delete admin');
      }
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-7 w-32 bg-gray-100 rounded animate-pulse" />
          <div className="h-3.5 w-72 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
        <Card className="rounded-2xl border border-gray-100 shadow-xs overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Admin</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <SkeletonTableRows rows={6} columns={3} />
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Admins</h1>
        <p className="text-xs md:text-sm text-gray-500 mt-0.5">Manage who has access to this admin panel</p>
      </div>

      {error && <FetchErrorBanner message={error} onRetry={fetchAdmins} />}

      <AdminListMetrics admins={admins} />

      <AdminListTable
        admins={admins}
        currentAdminId={user?.id}
        deletingId={deletingId}
        onDelete={handleDelete}
      />
    </div>
  );
}
