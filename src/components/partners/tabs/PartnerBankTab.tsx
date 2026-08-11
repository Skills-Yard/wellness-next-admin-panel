'use client';

import React, { useState } from 'react';
import { CheckCircle2, ShieldCheck, CreditCard, Loader2 } from 'lucide-react';
import { Partner } from '../../../types/partner';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';

interface PartnerBankTabProps {
  partner: Partner;
  onVerifyBank?: (isVerified: boolean) => Promise<void>;
}

export default function PartnerBankTab({ partner, onVerifyBank }: PartnerBankTabProps) {
  const [loading, setLoading] = useState(false);
  const bank = partner.bankAccount;

  if (!bank) {
    return (
      <Card className="p-12 text-center text-xs text-gray-400 space-y-3 bg-white border-gray-100">
        <CreditCard className="w-10 h-10 mx-auto text-gray-300" />
        <p className="font-bold text-sm text-gray-700">No Bank Account Configured</p>
        <p className="text-gray-400">This partner has not submitted their bank details for payouts yet.</p>
      </Card>
    );
  }

  const isVerified = bank.isVerified;

  const handleToggleVerification = async () => {
    if (!onVerifyBank) return;
    setLoading(true);
    try { await onVerifyBank(!isVerified); } finally { setLoading(false); }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="p-6 shadow-xs space-y-4 bg-white border-gray-100">
        <h3 className="font-bold text-base text-gray-900 border-b border-gray-100 pb-3">Bank Details</h3>
        <div className="space-y-3.5 text-xs">
          <div><p className="text-gray-400 font-medium">Account Holder Name</p><p className="font-semibold text-gray-900 mt-0.5">{bank.accountHolderName}</p></div>
          <div><p className="text-gray-400 font-medium">Account Number</p><p className="font-semibold text-gray-900 mt-0.5">XXXX {bank.accountNumber?.slice(-4)} ({bank.bankName || 'N/A'})</p></div>
          <div><p className="text-gray-400 font-medium">IFSC Code</p><p className="font-semibold text-gray-900 mt-0.5">{bank.ifscCode}</p></div>
        </div>
      </Card>

      <Card className="p-6 shadow-xs space-y-4 flex flex-col justify-between bg-white border-gray-100">
        <h3 className="font-bold text-base text-gray-900 border-b border-gray-100 pb-3">Payout Information</h3>
        <div className="space-y-3.5 text-xs">
          <div><p className="text-gray-400 font-medium">Payout Provider</p><p className="font-semibold text-gray-900 mt-0.5">RazorpayX</p></div>
          <div><p className="text-gray-400 font-medium">Razorpay Contact ID</p><p className="font-mono text-gray-700 mt-0.5">{bank.razorpayContactId || 'N/A'}</p></div>
          <div><p className="text-gray-400 font-medium mb-1">Payouts Enabled</p><Badge variant={isVerified ? 'active' : 'secondary'}>{isVerified ? 'Yes' : 'Pending'}</Badge></div>
        </div>
      </Card>

      <Card className="p-6 shadow-xs space-y-4 flex flex-col justify-between bg-white border-gray-100">
        <div>
          <h3 className="font-bold text-base text-gray-900 border-b border-gray-100 pb-3 mb-4">Verification</h3>
          <Badge variant={isVerified ? 'active' : 'secondary'} className="px-3 py-1">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            <span>{isVerified ? 'Verified' : 'Pending Verification'}</span>
          </Badge>
        </div>
        {onVerifyBank && (
          <div className="pt-3 border-t border-gray-100">
            <Button size="sm" onClick={handleToggleVerification} disabled={loading} variant={isVerified ? 'outline' : 'default'} className="w-full">
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
              <ShieldCheck className="w-4 h-4 mr-1" />
              <span>{isVerified ? 'Unverify Bank' : 'Verify Bank Details'}</span>
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
