'use client';

import React from 'react';
import { CheckCircle2, Clock } from 'lucide-react';
import { Partner } from '../../../types/partner';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';

interface PartnerOverviewTabProps {
  partner: Partner;
}

export default function PartnerOverviewTab({ partner }: PartnerOverviewTabProps) {
  const partnerType = partner.type ? partner.type.charAt(0).toUpperCase() + partner.type.slice(1).toLowerCase() : 'Individual';
  const languages = partner.languages && partner.languages.length > 0 ? partner.languages.join(', ') : 'Not specified';
  const experience = partner.yearsOfExperience != null ? `${partner.yearsOfExperience} years` : 'Not specified';
  const serviceRadius = partner.serviceRadiusKm ? `${partner.serviceRadiusKm} km` : '10 km';
  const bufferTime = partner.bufferMinutes ? `${partner.bufferMinutes} mins` : '30 mins';

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return dateStr; }
  };

  const joinedOn = formatDate(partner.createdAt) || 'N/A';
  const isApproved = partner.status === 'APPROVED';
  const isKycVerified = partner.kyc?.status === 'APPROVED';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="p-6 shadow-xs space-y-4 bg-white border-gray-100">
        <h3 className="font-bold text-base text-gray-900 border-b border-gray-100 pb-3">Partner Information</h3>
        <div className="space-y-3.5 text-xs">
          <div className="flex items-center justify-between text-gray-600"><span>Partner Type</span><Badge variant="secondary">{partnerType}</Badge></div>
          <div className="flex items-center justify-between text-gray-600"><span>Languages</span><span className="font-semibold text-gray-900">{languages}</span></div>
          <div className="flex items-center justify-between text-gray-600"><span>Experience</span><span className="font-semibold text-gray-900">{experience}</span></div>
          <div className="flex items-center justify-between text-gray-600"><span>Service Radius</span><span className="font-semibold text-gray-900">{serviceRadius}</span></div>
          <div className="flex items-center justify-between text-gray-600"><span>Buffer Time</span><span className="font-semibold text-gray-900">{bufferTime}</span></div>
          <div className="flex items-center justify-between text-gray-600"><span>Joined On</span><span className="font-semibold text-gray-900">{joinedOn}</span></div>
        </div>
      </Card>

      <Card className="p-6 shadow-xs space-y-4 bg-white border-gray-100">
        <h3 className="font-bold text-base text-gray-900 border-b border-gray-100 pb-3">Status Timeline</h3>
        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center ${isApproved ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                {isApproved ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
              </div>
              <span className="font-bold text-gray-900">Approved</span>
            </div>
            <Badge variant={isApproved ? 'active' : 'inactive'}>{isApproved ? 'Approved' : 'Pending'}</Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center ${isKycVerified ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                {isKycVerified ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
              </div>
              <span className="font-bold text-gray-900">KYC Verified</span>
            </div>
            <Badge variant={isKycVerified ? 'active' : 'inactive'}>{isKycVerified ? 'Verified' : 'Pending'}</Badge>
          </div>
        </div>
      </Card>
    </div>
  );
}
