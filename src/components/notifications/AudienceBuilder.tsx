'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Users, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import RecipientPickerModal from './RecipientPickerModal';
import { getAudiencePreviewServerAction } from '../../lib/server-actions/notification';
import { AudienceFilter, AudienceMode, BroadcastAudienceType, RecipientRole } from '../../types/notification';

export interface AudienceSelection {
  role: RecipientRole;
  mode: AudienceMode;
  filter: AudienceFilter;
  recipientIds: string[];
  audienceType: BroadcastAudienceType;
  previewCount: number | null;
  previewLoading: boolean;
}

interface AudienceBuilderProps {
  onChange: (selection: AudienceSelection) => void;
}

const selectClass =
  'w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C] bg-white transition-all';

function audienceTypeFor(role: RecipientRole, mode: AudienceMode): BroadcastAudienceType {
  if (mode === 'ALL') return role === 'USERS' ? 'ALL_USERS' : 'ALL_PARTNERS';
  if (mode === 'SELECTED') return role === 'USERS' ? 'SELECTED_USERS' : 'SELECTED_PARTNERS';
  return role === 'USERS' ? 'SEGMENT_USERS' : 'SEGMENT_PARTNERS';
}

export default function AudienceBuilder({ onChange }: AudienceBuilderProps) {
  const [role, setRole] = useState<RecipientRole>('USERS');
  const [mode, setMode] = useState<AudienceMode>('ALL');
  const [filter, setFilter] = useState<AudienceFilter>({ respectPromotionalOptIn: true });
  const [recipientIds, setRecipientIds] = useState<string[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const audienceType = useMemo(() => audienceTypeFor(role, mode), [role, mode]);

  // Switching role clears fields/selection that don't carry over cleanly —
  // a Partner status picked before flipping to Users would otherwise be sent
  // along silently and just get ignored server-side (harmless, but confusing
  // to see stick around in the form).
  useEffect(() => {
    setFilter({ respectPromotionalOptIn: true });
    setRecipientIds([]);
  }, [role]);

  // Live count for ALL/SEGMENT — debounced so a filter field being typed
  // doesn't fire a request per keystroke. SELECTED counts itself instantly
  // client-side, no request needed.
  useEffect(() => {
    if (mode === 'SELECTED') {
      setPreviewCount(recipientIds.length);
      setPreviewLoading(false);
      return;
    }
    setPreviewLoading(true);
    const t = setTimeout(async () => {
      const res = await getAudiencePreviewServerAction(
        audienceType as Exclude<BroadcastAudienceType, 'SELECTED_USERS' | 'SELECTED_PARTNERS'>,
        mode === 'SEGMENT' ? filter : undefined
      );
      setPreviewCount(res.count);
      setPreviewLoading(false);
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, audienceType, JSON.stringify(filter), recipientIds.length]);

  useEffect(() => {
    onChange({ role, mode, filter, recipientIds, audienceType, previewCount, previewLoading });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, mode, filter, recipientIds, audienceType, previewCount, previewLoading]);

  const set = <K extends keyof AudienceFilter>(key: K, value: AudienceFilter[K]) =>
    setFilter((prev) => ({ ...prev, [key]: value === '' || value === undefined ? undefined : value }));

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        {(['USERS', 'PARTNERS'] as RecipientRole[]).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              role === r ? 'bg-[#1C1512] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {r === 'USERS' ? 'Users' : 'Partners'}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        {(
          [
            { key: 'ALL', label: 'Everyone' },
            { key: 'SEGMENT', label: 'Filtered segment' },
            { key: 'SELECTED', label: 'Specific recipients' },
          ] as { key: AudienceMode; label: string }[]
        ).map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setMode(m.key)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              mode === m.key
                ? 'bg-[#FAF5F0] border-[#C68A4C] text-[#8A5A2A]'
                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === 'SEGMENT' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
          <div className="space-y-1.5">
            <Label>Active status</Label>
            <select
              className={selectClass}
              value={filter.isActive === undefined ? '' : String(filter.isActive)}
              onChange={(e) => set('isActive', e.target.value === '' ? undefined : e.target.value === 'true')}
            >
              <option value="">Any</option>
              <option value="true">Active only</option>
              <option value="false">Inactive only</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label>Gender</Label>
            <select
              className={selectClass}
              value={filter.gender ?? ''}
              onChange={(e) => set('gender', (e.target.value || undefined) as AudienceFilter['gender'])}
            >
              <option value="">Any</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label>City</Label>
            <Input value={filter.city ?? ''} onChange={(e) => set('city', e.target.value)} placeholder="e.g. Bengaluru" />
          </div>

          <div className="space-y-1.5">
            <Label>State</Label>
            <Input value={filter.state ?? ''} onChange={(e) => set('state', e.target.value)} placeholder="e.g. Karnataka" />
          </div>

          <div className="space-y-1.5">
            <Label>Joined from</Label>
            <Input type="date" value={filter.joinedFrom ?? ''} onChange={(e) => set('joinedFrom', e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Joined to</Label>
            <Input type="date" value={filter.joinedTo ?? ''} onChange={(e) => set('joinedTo', e.target.value)} />
          </div>

          {role === 'USERS' ? (
            <>
              <div className="space-y-1.5">
                <Label>Phone verified</Label>
                <select
                  className={selectClass}
                  value={filter.isPhoneVerified === undefined ? '' : String(filter.isPhoneVerified)}
                  onChange={(e) => set('isPhoneVerified', e.target.value === '' ? undefined : e.target.value === 'true')}
                >
                  <option value="">Any</option>
                  <option value="true">Verified only</option>
                  <option value="false">Unverified only</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label>Booking engagement</Label>
                <select
                  className={selectClass}
                  value={filter.neverBooked ? 'never' : filter.lapsedDays ? 'lapsed' : ''}
                  onChange={(e) => {
                    if (e.target.value === 'never') {
                      set('neverBooked', true);
                      set('lapsedDays', undefined);
                    } else if (e.target.value === 'lapsed') {
                      set('neverBooked', undefined);
                      set('lapsedDays', 30);
                    } else {
                      set('neverBooked', undefined);
                      set('lapsedDays', undefined);
                    }
                  }}
                >
                  <option value="">Any</option>
                  <option value="never">Never booked</option>
                  <option value="lapsed">Lapsed (no booking recently)</option>
                </select>
              </div>

              {filter.lapsedDays !== undefined && (
                <div className="space-y-1.5">
                  <Label>No booking in the last (days)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={filter.lapsedDays}
                    onChange={(e) => set('lapsedDays', Number(e.target.value) || 1)}
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Min. completed bookings</Label>
                <Input
                  type="number"
                  min={0}
                  value={filter.minTotalBookings ?? ''}
                  onChange={(e) => set('minTotalBookings', e.target.value === '' ? undefined : Number(e.target.value))}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Min. lifetime spend (₹)</Label>
                <Input
                  type="number"
                  min={0}
                  value={filter.minLifetimeSpend === undefined ? '' : filter.minLifetimeSpend / 100}
                  onChange={(e) =>
                    set('minLifetimeSpend', e.target.value === '' ? undefined : Math.round(Number(e.target.value) * 100))
                  }
                />
              </div>

              <div className="sm:col-span-2 flex items-center gap-2 pt-1">
                <input
                  id="respectPromotionalOptIn"
                  type="checkbox"
                  checked={filter.respectPromotionalOptIn ?? true}
                  onChange={(e) => set('respectPromotionalOptIn', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 accent-[#1C1512]"
                />
                <label htmlFor="respectPromotionalOptIn" className="text-xs text-gray-600">
                  Only send to users who opted into promotional messages (recommended)
                </label>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label>Partner type</Label>
                <select
                  className={selectClass}
                  value={filter.type ?? ''}
                  onChange={(e) => set('type', (e.target.value || undefined) as AudienceFilter['type'])}
                >
                  <option value="">Any</option>
                  <option value="INDIVIDUAL">Individual</option>
                  <option value="BUSINESS">Business</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label>Partner status</Label>
                <select
                  className={selectClass}
                  value={filter.status?.[0] ?? ''}
                  onChange={(e) => set('status', e.target.value ? [e.target.value] : undefined)}
                >
                  <option value="">Any</option>
                  <option value="APPROVED">Approved</option>
                  <option value="PENDING_APPROVAL">Pending approval</option>
                  <option value="PENDING_KYC">Pending KYC</option>
                  <option value="TRAINING">Training</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="DEACTIVATED">Deactivated</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label>Online now</Label>
                <select
                  className={selectClass}
                  value={filter.isOnline === undefined ? '' : String(filter.isOnline)}
                  onChange={(e) => set('isOnline', e.target.value === '' ? undefined : e.target.value === 'true')}
                >
                  <option value="">Any</option>
                  <option value="true">Online only</option>
                  <option value="false">Offline only</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label>KYC status</Label>
                <select
                  className={selectClass}
                  value={filter.kycStatus ?? ''}
                  onChange={(e) => set('kycStatus', (e.target.value || undefined) as AudienceFilter['kycStatus'])}
                >
                  <option value="">Any</option>
                  <option value="APPROVED">Approved</option>
                  <option value="UNDER_REVIEW">Under review</option>
                  <option value="SUBMITTED">Submitted</option>
                  <option value="NOT_SUBMITTED">Not submitted</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="RESUBMISSION_REQUIRED">Resubmission required</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label>Min. rating</Label>
                <Input
                  type="number"
                  min={0}
                  max={5}
                  step={0.5}
                  value={filter.minRating ?? ''}
                  onChange={(e) => set('minRating', e.target.value === '' ? undefined : Number(e.target.value))}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Min. total bookings</Label>
                <Input
                  type="number"
                  min={0}
                  value={filter.minTotalBookings ?? ''}
                  onChange={(e) => set('minTotalBookings', e.target.value === '' ? undefined : Number(e.target.value))}
                />
              </div>
            </>
          )}
        </div>
      )}

      {mode === 'SELECTED' && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
          <Button type="button" variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
            <Users className="w-3.5 h-3.5" />
            Choose {role === 'USERS' ? 'users' : 'partners'}
          </Button>
          <span className="text-xs text-gray-500">{recipientIds.length} selected</span>
        </div>
      )}

      <div className="flex items-center gap-2 text-sm">
        <span className="font-semibold text-gray-900">Audience size:</span>
        {previewLoading ? (
          <span className="flex items-center gap-1.5 text-gray-500">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> calculating…
          </span>
        ) : (
          <span className="font-bold text-[#8A5A2A]">
            ≈ {previewCount ?? 0} {role === 'USERS' ? 'user(s)' : 'partner(s)'}
          </span>
        )}
      </div>

      <RecipientPickerModal
        isOpen={pickerOpen}
        role={role}
        initialSelected={recipientIds}
        onClose={() => setPickerOpen(false)}
        onConfirm={(ids) => {
          setRecipientIds(ids);
          setPickerOpen(false);
        }}
      />
    </div>
  );
}
