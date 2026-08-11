'use client';

import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, FileText, Loader2 } from 'lucide-react';
import { Partner } from '../../../types/partner';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';

interface PartnerKycTabProps {
  partner: Partner;
  onApproveKyc?: () => Promise<void>;
  onRejectKyc?: (reason: string) => Promise<void>;
}

export default function PartnerKycTab({ partner, onApproveKyc, onRejectKyc }: PartnerKycTabProps) {
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [loading, setLoading] = useState(false);

  const kyc = partner.kyc;
  const kycStatus = kyc?.status || 'NOT_SUBMITTED';
  const isVerified = kycStatus === 'APPROVED';

  const docList = [
    { id: 'aadhaar_front', name: 'Aadhaar Front', key: kyc?.aadhaarFrontKey },
    { id: 'aadhaar_back', name: 'Aadhaar Back', key: kyc?.aadhaarBackKey },
    { id: 'pan_card', name: 'PAN Card', key: kyc?.panKey },
    { id: 'selfie', name: 'Selfie', key: kyc?.selfieKey },
    { id: 'video_kyc', name: 'Video KYC', key: kyc?.videoKycKey },
  ].filter((d) => Boolean(d.key));

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'Pending Review';
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return dateStr; }
  };

  const handleApprove = async () => {
    if (!onApproveKyc) return;
    setLoading(true);
    try { await onApproveKyc(); } finally { setLoading(false); }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onRejectKyc || !rejectReason.trim()) return;
    setLoading(true);
    try {
      await onRejectKyc(rejectReason);
      setIsRejecting(false);
      setRejectReason('');
    } finally { setLoading(false); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2 p-6 shadow-xs space-y-4 bg-white border-gray-100">
        <h3 className="font-bold text-base text-gray-900 border-b border-gray-100 pb-3">Documents</h3>
        {docList.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400">
            <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="font-semibold text-gray-700">No KYC documents submitted yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {docList.map((doc) => (
              <div key={doc.id} className="rounded-xl border border-gray-200 p-3 bg-gray-50/50 space-y-2">
                <div className="aspect-4/3 w-full bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200 text-gray-400">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{doc.name}</p>
                  <p className="text-[11px] text-gray-400 truncate">{doc.key}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6 shadow-xs space-y-4 flex flex-col justify-between bg-white border-gray-100">
        <div>
          <h3 className="font-bold text-base text-gray-900 border-b border-gray-100 pb-3 mb-4">KYC Status</h3>
          <div className="space-y-4 text-xs">
            <Badge variant={isVerified ? 'active' : 'secondary'} className="px-3 py-1 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              <span>{kycStatus.replace('_', ' ')}</span>
            </Badge>
            <div className="text-gray-500 space-y-1">
              <p>Reviewed on: {formatDate(kyc?.reviewedAt)}</p>
              <p>Reviewed by: {kyc?.reviewedBy || 'N/A'}</p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 space-y-3">
          {!isRejecting ? (
            <div className="flex flex-col gap-2">
              {!isVerified && onApproveKyc && (
                <Button size="sm" onClick={handleApprove} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white w-full">
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
                  <ShieldCheck className="w-4 h-4 mr-1" />
                  Approve KYC
                </Button>
              )}
              {onRejectKyc && (
                <Button variant="outline" size="sm" onClick={() => setIsRejecting(true)} className="text-rose-700 border-rose-200 hover:bg-rose-50 w-full">
                  Reject / Request Resubmission
                </Button>
              )}
            </div>
          ) : (
            <form onSubmit={handleReject} className="space-y-2 text-xs">
              <textarea
                required
                rows={2}
                placeholder="Reason for rejection..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-2 border border-gray-200 rounded-xl text-xs"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" type="button" onClick={() => setIsRejecting(false)}>Cancel</Button>
                <Button variant="destructive" size="sm" type="submit" disabled={loading}>Submit Rejection</Button>
              </div>
            </form>
          )}
        </div>
      </Card>
    </div>
  );
}
