'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ShieldCheck, CheckCircle2, FileText, Loader2, RefreshCw, X, ExternalLink } from 'lucide-react';
import { Partner } from '../../../types/partner';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Skeleton } from '../../ui/skeleton';
import { getPartnerKycDocUrlsServerAction, PartnerKycDocUrls } from '../../../lib/server-actions/partner';

interface PartnerKycTabProps {
  partner: Partner;
  onApproveKyc?: () => Promise<void>;
  onRejectKyc?: (reason: string) => Promise<void>;
}

// Maps a doc's display id to the label the backend uses as the key in the
// presigned document-urls response (see PartnerKycService.getKycDocumentUrls).
type DocUrlField = Exclude<keyof PartnerKycDocUrls, 'certificates'>;
type DocMeta = { id: string; name: string; hasKey: boolean; urlField: DocUrlField; kind: 'image' | 'video' };

export default function PartnerKycTab({ partner, onApproveKyc, onRejectKyc }: PartnerKycTabProps) {
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [loading, setLoading] = useState(false);

  const [docUrls, setDocUrls] = useState<PartnerKycDocUrls>({});
  const [urlsLoading, setUrlsLoading] = useState(false);
  const [urlsError, setUrlsError] = useState(false);
  const [failedPreviews, setFailedPreviews] = useState<Record<string, boolean>>({});
  const [lightbox, setLightbox] = useState<{ url: string; name: string; kind: 'image' | 'video' } | null>(null);

  const kyc = partner.kyc;
  const kycStatus = kyc?.status || 'NOT_SUBMITTED';
  const isVerified = kycStatus === 'APPROVED';

  const allDocs: DocMeta[] = [
    { id: 'aadhaar_front', name: 'Aadhaar Front', hasKey: Boolean(kyc?.aadhaarFrontKey), urlField: 'aadhaarFront', kind: 'image' },
    { id: 'aadhaar_back', name: 'Aadhaar Back', hasKey: Boolean(kyc?.aadhaarBackKey), urlField: 'aadhaarBack', kind: 'image' },
    { id: 'pan_card', name: 'PAN Card', hasKey: Boolean(kyc?.panKey), urlField: 'pan', kind: 'image' },
    { id: 'selfie', name: 'Selfie', hasKey: Boolean(kyc?.selfieKey), urlField: 'selfie', kind: 'image' },
    { id: 'video_kyc', name: 'Video KYC', hasKey: Boolean(kyc?.videoKycKey), urlField: 'video', kind: 'video' },
    { id: 'business_license', name: 'Business License', hasKey: Boolean(kyc?.businessLicenseKey), urlField: 'businessLicense', kind: 'image' },
    { id: 'business_pan', name: 'Business PAN', hasKey: Boolean(kyc?.businessPanKey), urlField: 'businessPan', kind: 'image' },
    { id: 'cancelled_cheque', name: 'Cancelled Cheque', hasKey: Boolean(kyc?.cancelledChequeKey), urlField: 'cancelledCheque', kind: 'image' },
  ];
  const docList = allDocs.filter((d) => d.hasKey);

  const certificateCount = kyc?.certificateKeys?.length || 0;
  const certificateUrls = docUrls.certificates || [];

  const fetchDocUrls = useCallback(async () => {
    if (!partner.id || docList.length === 0) return;
    setUrlsLoading(true);
    setUrlsError(false);
    setFailedPreviews({});
    try {
      const urls = await getPartnerKycDocUrlsServerAction(partner.id);
      if (urls && Object.keys(urls).length > 0) {
        setDocUrls(urls);
      } else {
        setUrlsError(true);
      }
    } catch {
      setUrlsError(true);
    } finally {
      setUrlsLoading(false);
    }
  }, [partner.id, docList.length]);

  useEffect(() => {
    fetchDocUrls();
  }, [fetchDocUrls]);

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
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="font-bold text-base text-gray-900">Documents</h3>
          {docList.length > 0 && (
            <button
              type="button"
              onClick={() => fetchDocUrls()}
              disabled={urlsLoading}
              className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 hover:text-gray-900 disabled:opacity-50 cursor-pointer"
              title="Document preview links expire after a while — refresh to reload them"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${urlsLoading ? 'animate-spin' : ''}`} />
              Refresh Previews
            </button>
          )}
        </div>

        {docList.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400">
            <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="font-semibold text-gray-700">No KYC documents submitted yet</p>
          </div>
        ) : (
          <>
            {urlsError && (
              <div className="flex items-center justify-between rounded-lg bg-rose-50 border border-rose-100 px-3 py-2 text-[11px] text-rose-700">
                <span>Couldn&apos;t load document previews.</span>
                <button type="button" onClick={() => fetchDocUrls()} className="font-semibold underline cursor-pointer">Try again</button>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              {docList.map((doc) => {
                const url = docUrls[doc.urlField];
                const failed = failedPreviews[doc.id];
                const canPreview = Boolean(url) && !failed;

                return (
                  <div key={doc.id} className="rounded-xl border border-gray-200 p-3 bg-gray-50/50 space-y-2">
                    <button
                      type="button"
                      disabled={!canPreview}
                      onClick={() => url && setLightbox({ url, name: doc.name, kind: doc.kind })}
                      className={`aspect-4/3 w-full bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center border border-gray-200 text-gray-400 ${canPreview ? 'cursor-zoom-in hover:opacity-90' : ''}`}
                    >
                      {urlsLoading && !url ? (
                        <Skeleton className="w-full h-full rounded-none" />
                      ) : canPreview ? (
                        doc.kind === 'video' ? (
                          <video src={url} className="w-full h-full object-cover" muted />
                        ) : (
                          <img
                            src={url}
                            alt={doc.name}
                            className="w-full h-full object-cover"
                            onError={() => setFailedPreviews((prev) => ({ ...prev, [doc.id]: true }))}
                          />
                        )
                      ) : (
                        <FileText className="w-8 h-8 text-gray-400" />
                      )}
                    </button>
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-gray-900">{doc.name}</p>
                      {url && (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-gray-700 shrink-0"
                          title="Open in new tab"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}

              {certificateUrls.map((url, idx) => (
                <div key={`certificate_${idx}`} className="rounded-xl border border-gray-200 p-3 bg-gray-50/50 space-y-2">
                  <button
                    type="button"
                    onClick={() => setLightbox({ url, name: `Certificate ${idx + 1}`, kind: 'image' })}
                    className="aspect-4/3 w-full bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center border border-gray-200 text-gray-400 cursor-zoom-in hover:opacity-90"
                  >
                    <img
                      src={url}
                      alt={`Certificate ${idx + 1}`}
                      className="w-full h-full object-cover"
                      onError={() => setFailedPreviews((prev) => ({ ...prev, [`certificate_${idx}`]: true }))}
                    />
                  </button>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-gray-900">Certificate {idx + 1}</p>
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-700 shrink-0" title="Open in new tab">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}

              {certificateCount > 0 && certificateUrls.length === 0 && urlsLoading && (
                <Skeleton className="rounded-xl aspect-4/3" />
              )}
            </div>
          </>
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

      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute top-5 right-5 text-white/80 hover:text-white cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="max-w-3xl max-h-[85vh] w-full flex flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
            {lightbox.kind === 'video' ? (
              <video src={lightbox.url} controls autoPlay className="max-h-[75vh] max-w-full rounded-lg" />
            ) : (
              <img src={lightbox.url} alt={lightbox.name} className="max-h-[75vh] max-w-full object-contain rounded-lg" />
            )}
            <p className="text-white/80 text-xs font-semibold">{lightbox.name}</p>
          </div>
        </div>
      )}
    </div>
  );
}
