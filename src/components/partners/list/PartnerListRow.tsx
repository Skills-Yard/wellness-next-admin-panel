'use client';

import React from 'react';
import Link from 'next/link';
import { Star, MoreVertical, Eye, ShieldCheck, AlertCircle, Trash2 } from 'lucide-react';
import { Partner, PartnerStatus } from '../../../types/partner';
import { Avatar } from '../../ui/avatar';
import { Badge } from '../../ui/badge';

interface PartnerListRowProps {
  partner: Partner;
  actionMenuOpenId: string | null;
  setActionMenuOpenId: (id: string | null) => void;
  onApprove?: (id: string) => Promise<void>;
  onSuspend?: (id: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export default function PartnerListRow({
  partner,
  actionMenuOpenId,
  setActionMenuOpenId,
  onApprove,
  onSuspend,
  onDelete,
}: PartnerListRowProps) {
  const partnerName = partner.name || 'Unnamed Partner';
  const partnerPhone = partner.phone || partner.countryCode || '+91';
  const partnerCity = partner.city || partner.state || 'N/A';
  const partnerType = partner.type || 'INDIVIDUAL';
  const ratingVal = partner.averageRating ? partner.averageRating.toFixed(1) : '0.0';
  const reviewCount = partner.totalReviews || 0;
  const totalBookings = partner.totalBookings || 0;
  const completionRate = partner.completionRate ? `${partner.completionRate}%` : '0%';

  const getStatusBadge = (status: PartnerStatus) => {
    switch (status) {
      case 'APPROVED': return <Badge variant="active">Approved</Badge>;
      case 'KYC_SUBMITTED': return <Badge className="bg-amber-50 text-amber-700 border-amber-200">KYC Submitted</Badge>;
      case 'PENDING_APPROVAL': return <Badge className="bg-orange-50 text-orange-700 border-orange-200">Pending Approval</Badge>;
      case 'PENDING_KYC': return <Badge className="bg-blue-50 text-blue-700 border-blue-200">Pending KYC</Badge>;
      case 'SUSPENDED': return <Badge variant="destructive">Suspended</Badge>;
      case 'REJECTED': return <Badge className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
      default: return <Badge variant="inactive">Incomplete</Badge>;
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return dateStr; }
  };

  return (
    <tr className="hover:bg-gray-50/60 transition-colors">
      <td className="py-3.5 px-5">
        <Link href={`/partners/${partner.id}`} className="flex items-center gap-3 group">
          <Avatar src={partner.profilePhotoKey || undefined} fallback={partnerName.slice(0, 2).toUpperCase()} className="w-9 h-9 border border-gray-200" />
          <div>
            <p className="font-semibold text-gray-900 group-hover:text-[#D4A373] transition-colors">{partnerName}</p>
            <p className="text-[11px] text-gray-400">{partnerPhone}</p>
          </div>
        </Link>
      </td>
      <td className="py-3.5 px-4">
        <Badge variant="secondary" className="capitalize">{partnerType.toLowerCase()}</Badge>
      </td>
      <td className="py-3.5 px-4">
        <div className="flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span className="font-semibold text-gray-900">{ratingVal}</span>
          <span className="text-gray-400 text-[11px]">({reviewCount})</span>
        </div>
      </td>
      <td className="py-3.5 px-4 font-medium text-gray-600">{partnerCity}</td>
      <td className="py-3.5 px-4">{getStatusBadge(partner.status)}</td>
      <td className="py-3.5 px-4">
        <div className="font-medium text-gray-900">{totalBookings}</div>
        <div className="text-[11px] text-gray-400">{completionRate}</div>
      </td>
      <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap">{formatDate(partner.createdAt)}</td>
      <td className="py-3.5 px-5 text-right relative">
        <div className="inline-flex items-center gap-2">
          <Link href={`/partners/${partner.id}`} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <Eye className="w-4 h-4" />
          </Link>
          <button onClick={() => setActionMenuOpenId(actionMenuOpenId === partner.id ? null : partner.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
        {actionMenuOpenId === partner.id && (
          <div className="absolute right-5 top-12 z-20 w-44 bg-white border border-gray-100 rounded-xl shadow-lg py-1.5 text-left text-xs animate-in fade-in slide-in-from-top-2 duration-150">
            <Link href={`/partners/${partner.id}`} className="flex items-center gap-2 px-3.5 py-2 hover:bg-gray-50 text-gray-700" onClick={() => setActionMenuOpenId(null)}>
              <Eye className="w-3.5 h-3.5 text-gray-500" />
              <span>View Details</span>
            </Link>
            {partner.status !== 'APPROVED' && onApprove && (
              <button onClick={async () => { setActionMenuOpenId(null); await onApprove(partner.id); }} className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-emerald-50 text-emerald-700 cursor-pointer">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Approve Partner</span>
              </button>
            )}
            {partner.status !== 'SUSPENDED' && onSuspend && (
              <button onClick={async () => { setActionMenuOpenId(null); await onSuspend(partner.id); }} className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-rose-50 text-rose-700 cursor-pointer">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Suspend Partner</span>
              </button>
            )}
            {onDelete && (
              <button onClick={async () => { setActionMenuOpenId(null); if (confirm('Are you sure?')) await onDelete(partner.id); }} className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-red-50 text-red-600 cursor-pointer">
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Partner</span>
              </button>
            )}
          </div>
        )}
      </td>
    </tr>
  );
}
