'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  UserHeaderCard,
  UserOverviewTab,
  UserAddressesTab,
  UserNotificationTab,
  UserDevicesTab,
  UserActivitySummaryTab,
  DeactivateUserModal,
} from '../../../components/users';
import {
  getUserByIdServerAction,
  updateUserServerAction,
  addUserAddressServerAction,
  updateUserAddressServerAction,
  deleteUserAddressServerAction,
  updateUserNotificationPreferenceServerAction,
  updateUserDeviceTokenServerAction,
} from '../../../lib/server-actions/user';
import { User, UserNotificationPreference } from '../../../types/user';
import { Loader2 } from 'lucide-react';

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params?.id as string;

  const initialTab = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const fetchedRef = useRef(false);

  const fetchUserDetails = useCallback(async (isRefresh = false) => {
    if (!id) return;
    if (fetchedRef.current && !isRefresh) return;
    fetchedRef.current = true;
    setLoading(true);
    try {
      const data = await getUserByIdServerAction(id);
      setUser(data || null);
    } catch (err) {
      console.error('Error fetching user details:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchUserDetails();
  }, [fetchUserDetails]);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) setActiveTab(tabParam);
  }, [searchParams]);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-gray-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4A373]" />
        <span className="text-xs font-semibold">Loading user profile from database...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="py-24 text-center space-y-4">
        <p className="text-base font-bold text-gray-800">User Not Found</p>
        <p className="text-xs text-gray-500">The requested user ID "{id}" does not exist.</p>
        <button
          onClick={() => router.push('/users')}
          className="px-4 py-2 text-xs font-semibold text-white bg-[#1C1512] rounded-xl cursor-pointer"
        >
          Back to Users List
        </button>
      </div>
    );
  }

  const handleDeactivate = async (userId: string, reason?: string) => {
    const res = await updateUserServerAction(userId, { isActive: false });
    if (res.ok) {
      await fetchUserDetails(true);
    } else {
      alert(res.message || 'Failed to deactivate user');
    }
  };

  const handleAddAddress = async (dto: any) => {
    const res = await addUserAddressServerAction(id, dto);
    if (res.ok) await fetchUserDetails(true);
    else alert(res.message || 'Failed to add address');
  };

  const handleUpdateAddress = async (addressId: string, dto: any) => {
    const res = await updateUserAddressServerAction(addressId, dto);
    if (res.ok) await fetchUserDetails(true);
    else alert(res.message || 'Failed to update address');
  };

  const handleDeleteAddress = async (addressId: string) => {
    const res = await deleteUserAddressServerAction(addressId);
    if (res.ok) await fetchUserDetails(true);
    else alert(res.message || 'Failed to delete address');
  };

  const handleUpdateNotificationPreferences = async (prefs: Partial<UserNotificationPreference>) => {
    const res = await updateUserNotificationPreferenceServerAction(id, prefs);
    if (!res.ok) alert(res.message || 'Failed to update notification preferences');
  };

  const handleRevokeDevice = async (tokenId: string) => {
    const res = await updateUserDeviceTokenServerAction(tokenId, { isActive: false });
    if (res.ok) await fetchUserDetails(true);
    else alert(res.message || 'Failed to revoke device token');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Card */}
      <UserHeaderCard
        user={user}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          router.replace(`/users/${id}?tab=${tab}`);
        }}
      />

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <UserOverviewTab
          user={user}
          onDeactivate={() => setShowDeactivateModal(true)}
          onVerifyPhone={() => alert('OTP Verification triggered for phone number.')}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            router.replace(`/users/${id}?tab=${tab}`);
          }}
        />
      )}

      {activeTab === 'addresses' && (
        <UserAddressesTab
          user={user}
          onAddAddress={handleAddAddress}
          onUpdateAddress={handleUpdateAddress}
          onDeleteAddress={handleDeleteAddress}
        />
      )}

      {activeTab === 'notifications' && (
        <UserNotificationTab
          user={user}
          onUpdatePreferences={handleUpdateNotificationPreferences}
        />
      )}

      {activeTab === 'devices' && (
        <UserDevicesTab
          user={user}
          onRevokeDevice={handleRevokeDevice}
        />
      )}

      {activeTab === 'activity' && (
        <UserActivitySummaryTab user={user} />
      )}

      {/* Deactivate User Modal */}
      <DeactivateUserModal
        user={user}
        isOpen={showDeactivateModal}
        onClose={() => setShowDeactivateModal(false)}
        onConfirm={handleDeactivate}
      />
    </div>
  );
}