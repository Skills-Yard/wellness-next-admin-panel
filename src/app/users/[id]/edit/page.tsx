'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { UserEditTab } from '../../../../components/users';
import { getUserByIdServerAction, updateUserServerAction } from '../../../../lib/server-actions/user';
import { User, UpdateUserPayload } from '../../../../types/user';
import { Loader2 } from 'lucide-react';

export default function UserEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      if (!id) return;
      setLoading(true);
      try {
        const data = await getUserByIdServerAction(id);
        if (data) {
          setUser(data);
        } else {
          setUser({
            id,
            name: 'Priya Sharma',
            email: 'priyasharma@gmail.com',
            phone: '98765 43210',
            countryCode: '+91',
            secondaryPhone: '98765 43210',
            accountCode: 'USR-000124',
            referralCode: 'ANITAV124',
            userReferredCount: 2,
            dateOfBirth: '1990-08-08',
            gender: 'FEMALE',
            isActive: true,
            isPhoneVerified: true,
            isProfileComplete: true,
            status: 'ACTIVE',
            locationCity: 'New Delhi',
            locationState: 'DL',
            totalBookings: 28,
            completedBookings: 24,
            canceledBookings: 4,
            lifetimeSpend: 32450,
            averageRating: 4.6,
            joinedAt: '2026-08-01T00:00:00Z',
            lastSeenAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [id]);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-gray-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4A373]" />
        <span className="text-xs font-semibold">Loading user details for edit...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="py-24 text-center space-y-4">
        <p className="text-base font-bold text-gray-800">User Not Found</p>
        <button
          onClick={() => router.push('/users')}
          className="px-4 py-2 text-xs font-semibold text-white bg-[#1C1512] rounded-xl cursor-pointer"
        >
          Back to Users List
        </button>
      </div>
    );
  }

  const handleSave = async (payload: UpdateUserPayload) => {
    const res = await updateUserServerAction(id, payload);
    if (!res.ok) {
      alert(res.message || 'Failed to update user profile');
    }
  };

  return <UserEditTab user={user} onSave={handleSave} />;
}
