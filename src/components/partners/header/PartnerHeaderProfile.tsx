'use client';

import React, { useState } from 'react';
import { MapPin, Phone, Mail, ChevronRight, Trash2 } from 'lucide-react';
import { Partner } from '../../../types/partner';
import { Avatar } from '../../ui/avatar';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';

interface PartnerHeaderProfileProps {
  partner: Partner;
  onApprove?: () => Promise<void>;
  onSuspend?: () => Promise<void>;
  onDelete?: () => Promise<void>;
}

export default function PartnerHeaderProfile({
  partner,
  onApprove,
  onSuspend,
  onDelete,
}: PartnerHeaderProfileProps) {
  const [moreActionsOpen, setMoreActionsOpen] = useState(false);

  const partnerName = partner.name || 'Unnamed Partner';
  const partnerIdDisplay = `PR_${partner.id.slice(-6).toUpperCase()}`;
  const partnerLocation = partner.city || partner.state || 'N/A';
  const partnerPhone = partner.phone || partner.countryCode || 'N/A';
  const partnerEmail = partner.email || 'N/A';
  const partnerType = partner.type || 'INDIVIDUAL';
  const isOnline = partner.isOnline;

  const lastSeenDisplay = partner.lastSeenAt
    ? new Date(partner.lastSeenAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    : 'Not recently seen';

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-start gap-4">
        <Avatar src={partner.profilePhotoKey || undefined} fallback={partnerName.slice(0, 2).toUpperCase()} className="w-14 h-14 border border-gray-200 shadow-xs" />
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-bold text-lg text-gray-900">{partnerName}</h1>
            <Badge variant={partner.status === 'APPROVED' ? 'active' : partner.status === 'SUSPENDED' ? 'destructive' : 'secondary'}>
              {partner.status.toLowerCase().replace('_', ' ')}
            </Badge>
            <Badge variant="secondary" className="capitalize">{partnerType.toLowerCase()}</Badge>
          </div>
          <p className="text-xs text-gray-400 font-medium">ID: {partnerIdDisplay}</p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-1">
            <div className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-gray-400" /><span>{partnerLocation}</span></div>
            <div className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-gray-400" /><span>{partnerPhone}</span></div>
            <div className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-gray-400" /><span>{partnerEmail}</span></div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-start md:items-end gap-3">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-400">Last seen: {lastSeenDisplay}</span>
          <Badge variant={isOnline ? 'active' : 'inactive'}>{isOnline ? 'Online' : 'Offline'}</Badge>
        </div>

        <div className="flex items-center gap-2 relative">
          {partner.status === 'APPROVED' ? (
            <Button variant="outline" size="sm" onClick={onSuspend}>Suspend Partner</Button>
          ) : (
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={onApprove}>Approve Partner</Button>
          )}

          <div className="relative">
            <Button variant="outline" size="sm" onClick={() => setMoreActionsOpen(!moreActionsOpen)}>
              <span>More Actions</span>
              <ChevronRight className={`w-3.5 h-3.5 text-gray-400 transition-transform ${moreActionsOpen ? 'rotate-90' : 'rotate-0'}`} />
            </Button>
            {moreActionsOpen && (
              <div className="absolute right-0 top-11 z-20 w-44 bg-white border border-gray-100 rounded-xl shadow-lg py-1.5 text-left text-xs">
                {onDelete && (
                  <button onClick={async () => { setMoreActionsOpen(false); if (confirm('Delete partner?')) await onDelete(); }} className="w-full flex items-center gap-2 px-3.5 py-2 text-red-600 hover:bg-red-50 cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Partner</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
