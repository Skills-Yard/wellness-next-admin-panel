'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Partner } from '../../../types/partner';
import PartnerHeaderProfile from './PartnerHeaderProfile';
import { Card } from '../../ui/card';

interface PartnerHeaderCardProps {
  partner: Partner;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onApprove?: () => Promise<void>;
  onSuspend?: () => Promise<void>;
  onDelete?: () => Promise<void>;
}

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'kyc', label: 'KYC & Verification' },
  { id: 'bank', label: 'Bank & Payouts' },
  { id: 'services', label: 'Services' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'booking', label: 'Booking' },
  { id: 'training', label: 'Training' },
  { id: 'reviews', label: 'Reviews' },
];

export default function PartnerHeaderCard({
  partner,
  activeTab,
  onTabChange,
  onApprove,
  onSuspend,
  onDelete,
}: PartnerHeaderCardProps) {
  const completedSteps = partner.onboardingStep || 1;
  const onboardingPercent = Math.min(Math.max((completedSteps / 4) * 100, 25), 100);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
        <Link href="/partners" className="hover:text-gray-900 transition-colors">Partners</Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-amber-600 font-semibold">Edit Partner</span>
      </div>

      <Card className="p-5 sm:p-6 shadow-xs space-y-6 bg-white border-gray-100">
        <PartnerHeaderProfile partner={partner} onApprove={onApprove} onSuspend={onSuspend} onDelete={onDelete} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2">
          <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50/70 p-4 rounded-xl border border-gray-100 text-center">
            <div>
              <p className="text-[11px] font-medium text-gray-500 uppercase">Total Bookings</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">{partner.totalBookings || 0}</p>
            </div>
            <div>
              <p className="text-[11px] font-medium text-gray-500 uppercase">Completion Rate</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">{partner.completionRate || 0}%</p>
            </div>
            <div>
              <p className="text-[11px] font-medium text-gray-500 uppercase">Average Rating</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">{partner.averageRating ? partner.averageRating.toFixed(1) : '0.0'}</p>
            </div>
            <div>
              <p className="text-[11px] font-medium text-gray-500 uppercase">Services Offered</p>
              <p className="text-xl font-bold text-gray-900 mt-0.5">{partner.partnerServices?.length || 0}</p>
            </div>
          </div>

          <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-100 flex flex-col justify-center">
            <div className="flex items-center justify-between text-xs font-semibold mb-2">
              <span className="text-gray-600">Onboarding Progress</span>
              <span className="text-emerald-600">{completedSteps}/4 Completed</span>
            </div>
            <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full transition-all duration-300" style={{ width: `${onboardingPercent}%` }} />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-3 -mb-2 overflow-x-auto">
          <nav className="flex items-center gap-1 min-w-max">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-amber-600 text-amber-600 bg-amber-50/30 rounded-t-lg'
                    : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50/60 rounded-t-lg'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </Card>
    </div>
  );
}
