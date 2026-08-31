'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Users,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Loader2,
  RefreshCw,
  X,
  ExternalLink,
  UserCheck,
  UserX,
  Ban,
} from 'lucide-react';
import { Partner, PartnerEmployee, EmployeeKyc } from '../../../../types/partner';
import { Card } from '../../../ui/card';
import { Badge } from '../../../ui/badge';
import { Button } from '../../../ui/button';
import { Skeleton } from '../../../ui/skeleton';
import {
  EmployeeKycDocUrls,
  getPartnerEmployeeByIdServerAction,
  getPartnerEmployeeKycDocUrlsServerAction,
} from '../../../../lib/server-actions/partner';

interface PartnerTeamTabProps {
  partner: Partner;
  onApproveEmployeeKyc: (employeeId: string) => Promise<void>;
  onRejectEmployeeKyc: (employeeId: string, reason: string) => Promise<void>;
  onApproveEmployee: (employeeId: string) => Promise<void>;
  onRejectEmployee: (employeeId: string) => Promise<void>;
  onSuspendEmployee: (employeeId: string) => Promise<void>;
}

type DocUrlField = Exclude<keyof EmployeeKycDocUrls, 'certificates'>;
type DocMeta = { id: string; name: string; hasKey: boolean; urlField: DocUrlField; kind: 'image' | 'video' };

const KYC_BADGE: Record<string, 'active' | 'secondary' | 'destructive'> = {
  APPROVED: 'active',
  SUBMITTED: 'secondary',
  UNDER_REVIEW: 'secondary',
  NOT_SUBMITTED: 'secondary',
  REJECTED: 'destructive',
  RESUBMISSION_REQUIRED: 'destructive',
};

function pretty(value?: string | null) {
  if (!value) return '—';
  return value.replace(/_/g, ' ');
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return 'Pending Review';
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function EmployeeKycReviewPanel({
  employee,
  onApproveEmployeeKyc,
  onRejectEmployeeKyc,
  onApproveEmployee,
  onRejectEmployee,
  onSuspendEmployee,
}: {
  employee: PartnerEmployee;
} & Omit<PartnerTeamTabProps, 'partner'>) {
  const [detail, setDetail] = useState<PartnerEmployee>(employee);
  const [docUrls, setDocUrls] = useState<EmployeeKycDocUrls>({});
  const [urlsLoading, setUrlsLoading] = useState(false);
  const [urlsError, setUrlsError] = useState(false);
  const [failedPreviews, setFailedPreviews] = useState<Record<string, boolean>>({});
  const [lightbox, setLightbox] = useState<{ url: string; name: string; kind: 'image' | 'video' } | null>(null);

  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  // The inline kyc from partner.employees is enough to render, but the
  // single-employee endpoint additionally carries the decrypted Aadhaar/PAN.
  const kyc: EmployeeKyc | null | undefined = detail.kyc ?? employee.kyc;
  const kycStatus = kyc?.status || 'NOT_SUBMITTED';
  const kycApproved = kycStatus === 'APPROVED';

  const allDocs: DocMeta[] = [
    { id: 'aadhaar_front', name: 'Aadhaar Front', hasKey: Boolean(kyc?.aadhaarFrontKey), urlField: 'aadhaarFront', kind: 'image' },
    { id: 'aadhaar_back', name: 'Aadhaar Back', hasKey: Boolean(kyc?.aadhaarBackKey), urlField: 'aadhaarBack', kind: 'image' },
    { id: 'pan_card', name: 'PAN Card', hasKey: Boolean(kyc?.panKey), urlField: 'pan', kind: 'image' },
    { id: 'selfie', name: 'Selfie', hasKey: Boolean(kyc?.selfieKey), urlField: 'selfie', kind: 'image' },
    { id: 'video_kyc', name: 'Video KYC', hasKey: Boolean(kyc?.videoKycKey), urlField: 'video', kind: 'video' },
  ];
  const docList = allDocs.filter((d) => d.hasKey);
  const certificateCount = kyc?.certificateKeys?.length || 0;
  const certificateUrls = docUrls.certificates || [];

  useEffect(() => {
    let active = true;
    getPartnerEmployeeByIdServerAction(employee.id).then((fresh) => {
      if (active && fresh) setDetail(fresh);
    });
    return () => {
      active = false;
    };
  }, [employee.id]);

  const fetchDocUrls = useCallback(async () => {
    setUrlsLoading(true);
    setUrlsError(false);
    setFailedPreviews({});
    try {
      const urls = await getPartnerEmployeeKycDocUrlsServerAction(employee.id);
      if (urls && Object.keys(urls).length > 0) setDocUrls(urls);
      else setUrlsError(true);
    } catch {
      setUrlsError(true);
    } finally {
      setUrlsLoading(false);
    }
  }, [employee.id]);

  useEffect(() => {
    if (docList.length > 0 || certificateCount > 0) fetchDocUrls();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchDocUrls, docList.length, certificateCount]);

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    try {
      await fn();
    } finally {
      setBusy(null);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReason.trim()) return;
    await run('reject-kyc', async () => {
      await onRejectEmployeeKyc(employee.id, rejectReason);
      setIsRejecting(false);
      setRejectReason('');
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2 p-6 shadow-xs space-y-4 bg-white border-gray-100">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="font-bold text-base text-gray-900">{employee.name} — KYC Documents</h3>
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

        {kyc && (kyc.aadhaarNumber || kyc.panNumber) && (
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-3">
              <p className="text-gray-400 font-medium">Aadhaar Number</p>
              <p className="font-semibold text-gray-900 mt-0.5">{kyc.aadhaarNumber || '—'}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-3">
              <p className="text-gray-400 font-medium">PAN Number</p>
              <p className="font-semibold text-gray-900 mt-0.5">{kyc.panNumber || '—'}</p>
            </div>
          </div>
        )}

        {docList.length === 0 && certificateCount === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400">
            <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="font-semibold text-gray-700">No KYC documents submitted yet</p>
          </div>
        ) : (
          <>
            {urlsError && (
              <div className="flex items-center justify-between rounded-lg bg-rose-50 border border-rose-100 px-3 py-2 text-[11px] text-rose-700">
                <span>Couldn&apos;t load document previews.</span>
                <button type="button" onClick={() => fetchDocUrls()} className="font-semibold underline cursor-pointer">
                  Try again
                </button>
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
                      className={`aspect-4/3 w-full bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center border border-gray-200 text-gray-400 ${
                        canPreview ? 'cursor-zoom-in hover:opacity-90' : ''
                      }`}
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
                    <img src={url} alt={`Certificate ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                  <p className="font-semibold text-gray-900">Certificate {idx + 1}</p>
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
        <div className="space-y-4">
          <h3 className="font-bold text-base text-gray-900 border-b border-gray-100 pb-3">Verification</h3>

          <div className="space-y-1.5 text-xs">
            <p className="text-gray-400 font-medium">KYC Status</p>
            <Badge variant={KYC_BADGE[kycStatus] || 'secondary'} className="px-3 py-1 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              <span>{pretty(kycStatus)}</span>
            </Badge>
          </div>
          <div className="text-gray-500 space-y-1 text-xs">
            <p>Reviewed on: {formatDate(kyc?.reviewedAt)}</p>
            <p>Reviewed by: {kyc?.reviewedBy || 'N/A'}</p>
            {kyc?.adminNotes && <p className="text-rose-600">Notes: {kyc.adminNotes}</p>}
          </div>

          <div className="space-y-1.5 text-xs pt-2 border-t border-gray-100">
            <p className="text-gray-400 font-medium">Employee Status</p>
            <Badge variant={detail.status === 'APPROVED' ? 'active' : 'secondary'} className="px-3 py-1 text-xs">
              <span>{pretty(detail.status)}</span>
            </Badge>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 space-y-2">
          {!isRejecting ? (
            <>
              {!kycApproved && (
                <Button
                  size="sm"
                  onClick={() => run('approve-kyc', () => onApproveEmployeeKyc(employee.id))}
                  disabled={busy !== null}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white w-full"
                >
                  {busy === 'approve-kyc' && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
                  <ShieldCheck className="w-4 h-4 mr-1" />
                  Approve KYC
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsRejecting(true)}
                disabled={busy !== null}
                className="text-rose-700 border-rose-200 hover:bg-rose-50 w-full"
              >
                Reject / Request Resubmission
              </Button>

              <div className="pt-2 mt-1 border-t border-gray-100 grid grid-cols-1 gap-2">
                {detail.status !== 'APPROVED' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => run('approve-emp', () => onApproveEmployee(employee.id))}
                    disabled={busy !== null}
                    className="w-full"
                  >
                    {busy === 'approve-emp' && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
                    <UserCheck className="w-4 h-4 mr-1" />
                    Approve Employee
                  </Button>
                )}
                {detail.status !== 'SUSPENDED' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => run('suspend-emp', () => onSuspendEmployee(employee.id))}
                    disabled={busy !== null}
                    className="w-full text-amber-700 border-amber-200 hover:bg-amber-50"
                  >
                    {busy === 'suspend-emp' && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
                    <Ban className="w-4 h-4 mr-1" />
                    Suspend Employee
                  </Button>
                )}
                {detail.status !== 'REJECTED' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => run('reject-emp', () => onRejectEmployee(employee.id))}
                    disabled={busy !== null}
                    className="w-full text-rose-700 border-rose-200 hover:bg-rose-50"
                  >
                    {busy === 'reject-emp' && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
                    <UserX className="w-4 h-4 mr-1" />
                    Reject Employee
                  </Button>
                )}
              </div>
            </>
          ) : (
            <form onSubmit={handleReject} className="space-y-2 text-xs">
              <textarea
                required
                rows={3}
                placeholder="Reason for rejection..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-2 border border-gray-200 rounded-xl text-xs"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" type="button" onClick={() => setIsRejecting(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" size="sm" type="submit" disabled={busy !== null}>
                  {busy === 'reject-kyc' && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
                  Submit Rejection
                </Button>
              </div>
            </form>
          )}
        </div>
      </Card>

      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6" onClick={() => setLightbox(null)}>
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

export default function PartnerTeamTab({
  partner,
  onApproveEmployeeKyc,
  onRejectEmployeeKyc,
  onApproveEmployee,
  onRejectEmployee,
  onSuspendEmployee,
}: PartnerTeamTabProps) {
  const employees = useMemo(() => partner.employees ?? [], [partner.employees]);
  const [selectedId, setSelectedId] = useState<string | null>(employees[0]?.id ?? null);

  const selected = employees.find((e) => e.id === selectedId) ?? null;

  if (partner.type !== 'BUSINESS') {
    return (
      <Card className="p-12 text-center text-xs text-gray-400 space-y-3 bg-white border-gray-100">
        <Users className="w-10 h-10 mx-auto text-gray-300" />
        <p className="font-bold text-sm text-gray-700">Not a business partner</p>
        <p className="text-gray-400">Only BUSINESS partners have a team of employees to verify.</p>
      </Card>
    );
  }

  if (employees.length === 0) {
    return (
      <Card className="p-12 text-center text-xs text-gray-400 space-y-3 bg-white border-gray-100">
        <Users className="w-10 h-10 mx-auto text-gray-300" />
        <p className="font-bold text-sm text-gray-700">No team members yet</p>
        <p className="text-gray-400">This business hasn&apos;t added any employees for verification.</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <Card className="p-4 shadow-xs bg-white border-gray-100 lg:col-span-1 space-y-1.5">
        <h3 className="font-bold text-sm text-gray-900 px-2 pt-1 pb-2">Team ({employees.length})</h3>
        {employees.map((emp) => {
          const kycStatus = emp.kyc?.status || 'NOT_SUBMITTED';
          const isSel = emp.id === selectedId;
          return (
            <button
              key={emp.id}
              type="button"
              onClick={() => setSelectedId(emp.id)}
              className={`w-full text-left rounded-xl px-3 py-2.5 border transition-colors cursor-pointer ${
                isSel ? 'border-amber-300 bg-amber-50/50' : 'border-transparent hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-xs text-gray-900 truncate">{emp.name}</p>
                <Badge variant={KYC_BADGE[kycStatus] || 'secondary'} className="text-[10px] px-1.5 py-0 shrink-0">
                  {pretty(kycStatus)}
                </Badge>
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                {emp.role} · {pretty(emp.status)}
              </p>
            </button>
          );
        })}
      </Card>

      <div className="lg:col-span-3">
        {selected ? (
          <EmployeeKycReviewPanel
            key={selected.id}
            employee={selected}
            onApproveEmployeeKyc={onApproveEmployeeKyc}
            onRejectEmployeeKyc={onRejectEmployeeKyc}
            onApproveEmployee={onApproveEmployee}
            onRejectEmployee={onRejectEmployee}
            onSuspendEmployee={onSuspendEmployee}
          />
        ) : (
          <Card className="p-12 text-center text-xs text-gray-400 bg-white border-gray-100">
            Select a team member to review their KYC.
          </Card>
        )}
      </div>
    </div>
  );
}
