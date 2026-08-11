'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  PartnerHeaderCard,
  PartnerOverviewTab,
  PartnerKycTab,
  PartnerBankTab,
  PartnerServicesTab,
  PartnerScheduleTab,
  PartnerBookingTab,
  PartnerTrainingTab,
  PartnerReviewsTab,
} from '../../../components/partners';
import {
  getPartnerByIdServerAction,
  approvePartnerServerAction,
  suspendPartnerServerAction,
  deletePartnerServerAction,
  approvePartnerKycServerAction,
  rejectPartnerKycServerAction,
  verifyPartnerBankServerAction,
  getPartnerServicesServerAction,
  setPartnerServicesServerAction,
  updatePartnerServiceServerAction,
  removePartnerServiceServerAction,
  getPartnerAvailabilityServerAction,
  setPartnerAvailabilityServerAction,
  getPartnerBookingsServerAction,
  getPartnerReviewsServerAction,
} from '../../../lib/server-actions/partner';
import {
  Partner,
  PartnerServiceItem,
  PartnerAvailabilityItem,
  PartnerBooking,
  PartnerReview,
} from '../../../types/partner';
import { Loader2 } from 'lucide-react';

export default function PartnerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [partner, setPartner] = useState<Partner | null>(null);
  const [services, setServices] = useState<PartnerServiceItem[]>([]);
  const [availability, setAvailability] = useState<PartnerAvailabilityItem[]>([]);
  const [bookings, setBookings] = useState<PartnerBooking[]>([]);
  const [reviews, setReviews] = useState<PartnerReview[]>([]);
  
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [loading, setLoading] = useState(true);

  const fetchPartnerDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [partnerData, servicesData, availabilityData, bookingsData, reviewsData] = await Promise.all([
        getPartnerByIdServerAction(id),
        getPartnerServicesServerAction(id),
        getPartnerAvailabilityServerAction(id),
        getPartnerBookingsServerAction(id),
        getPartnerReviewsServerAction(id),
      ]);

      if (partnerData) {
        setPartner(partnerData);
        setServices(servicesData);
        setAvailability(availabilityData);
        setBookings(bookingsData);
        setReviews(reviewsData);
      }
    } catch (err) {
      console.error('Error loading partner detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartnerDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-gray-500 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4A373]" />
        <span className="text-xs font-semibold">Loading partner profile from backend database...</span>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="py-24 text-center space-y-4">
        <p className="text-base font-bold text-gray-800">Partner Not Found</p>
        <p className="text-xs text-gray-500">The requested partner ID "{id}" does not exist in the database.</p>
        <button
          onClick={() => router.push('/partners')}
          className="px-4 py-2 text-xs font-semibold text-white bg-[#1C1512] rounded-xl cursor-pointer"
        >
          Back to Partners
        </button>
      </div>
    );
  }

  const handleApprove = async () => {
    const res = await approvePartnerServerAction(id);
    if (res.ok) await fetchPartnerDetails();
    else alert(res.message || 'Failed to approve partner');
  };

  const handleSuspend = async () => {
    const res = await suspendPartnerServerAction(id);
    if (res.ok) await fetchPartnerDetails();
    else alert(res.message || 'Failed to suspend partner');
  };

  const handleDelete = async () => {
    const res = await deletePartnerServerAction(id);
    if (res.ok) router.push('/partners');
    else alert(res.message || 'Failed to delete partner');
  };

  const handleApproveKyc = async () => {
    const res = await approvePartnerKycServerAction(id);
    if (res.ok) await fetchPartnerDetails();
    else alert(res.message || 'Failed to approve KYC');
  };

  const handleRejectKyc = async (reason: string) => {
    const res = await rejectPartnerKycServerAction(id, reason);
    if (res.ok) await fetchPartnerDetails();
    else alert(res.message || 'Failed to reject KYC');
  };

  const handleVerifyBank = async (isVerified: boolean) => {
    const res = await verifyPartnerBankServerAction(id, isVerified);
    if (res.ok) await fetchPartnerDetails();
    else alert(res.message || 'Failed to update bank verification');
  };

  const handleUpdateService = async (serviceItemId: string, payload: { customPrice?: number; isActive?: boolean }) => {
    const res = await updatePartnerServiceServerAction(id, serviceItemId, payload);
    if (res.ok) await fetchPartnerDetails();
    else alert(res.message || 'Failed to update service');
  };

  const handleRemoveService = async (serviceItemId: string) => {
    const res = await removePartnerServiceServerAction(id, serviceItemId);
    if (res.ok) await fetchPartnerDetails();
    else alert(res.message || 'Failed to remove service');
  };

  const handleSetServices = async (serviceItemIds: string[]) => {
    const res = await setPartnerServicesServerAction(id, serviceItemIds);
    if (res.ok) await fetchPartnerDetails();
    else alert(res.message || 'Failed to set services');
  };

  const handleSetAvailability = async (schedules: PartnerAvailabilityItem[]) => {
    const res = await setPartnerAvailabilityServerAction(id, schedules);
    if (res.ok) await fetchPartnerDetails();
    else alert(res.message || 'Failed to set availability');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header Card */}
      <PartnerHeaderCard
        partner={partner}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onApprove={handleApprove}
        onSuspend={handleSuspend}
        onDelete={handleDelete}
      />

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <PartnerOverviewTab partner={partner} />
      )}

      {activeTab === 'kyc' && (
        <PartnerKycTab
          partner={partner}
          onApproveKyc={handleApproveKyc}
          onRejectKyc={handleRejectKyc}
        />
      )}

      {activeTab === 'bank' && (
        <PartnerBankTab
          partner={partner}
          onVerifyBank={handleVerifyBank}
        />
      )}

      {activeTab === 'services' && (
        <PartnerServicesTab
          partner={partner}
          services={services}
          onRefresh={fetchPartnerDetails}
          onUpdateService={handleUpdateService}
          onRemoveService={handleRemoveService}
          onSetServices={handleSetServices}
        />
      )}

      {activeTab === 'schedule' && (
        <PartnerScheduleTab
          partner={partner}
          availability={availability}
          onRefresh={fetchPartnerDetails}
          onSetAvailability={handleSetAvailability}
        />
      )}

      {activeTab === 'booking' && (
        <PartnerBookingTab
          partner={partner}
          bookings={bookings}
        />
      )}

      {activeTab === 'training' && (
        <PartnerTrainingTab partner={partner} />
      )}

      {activeTab === 'reviews' && (
        <PartnerReviewsTab
          partner={partner}
          reviews={reviews}
        />
      )}
    </div>
  );
}
