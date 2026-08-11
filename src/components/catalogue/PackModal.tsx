'use client';

import React, { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { ServiceDuration, ServicePackage } from '../../types/catalogue';

interface PackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (pkg: Omit<ServicePackage, 'id'>) => void | Promise<void>;
  initialData?: ServicePackage | null;
  // This service's own durations. No manual "which duration" picker — a pack's base price is
  // always sessions x the service's default duration price (same rule everywhere), adjusted by
  // Discount Percent. There's no free-typed "Original Price" anymore either.
  durations: ServiceDuration[];
  // Cosmetic — every saved pack is already reusable across services via the Library (see
  // useLibrarySections), so there's no separate "private" state to gate on. Shown to match the
  // Create screen design; hidden for edit forms.
  showLibraryCheckbox?: boolean;
  // Renders just the form (no backdrop/card/close button/title) for use inside AddSectionModal's
  // "Create" tab. Standalone (non-embedded) use — the Edit flow — is unaffected.
  embedded?: boolean;
}

export default function PackModal({
  isOpen,
  onClose,
  onAdd,
  initialData,
  durations,
  showLibraryCheckbox = true,
  embedded = false,
}: PackModalProps) {
  const [label, setLabel] = useState('1 Session');
  const [sessions, setSessions] = useState('1');
  // Non-negative (≥0%) — the field itself never goes negative, "Discount Percent" is just what
  // this adjustment is called. Defaulting to 0% is what makes a fresh "1 Session" pack land
  // exactly on the default duration's price. NOTE: the underlying price math still ADDS this
  // percentage (unchanged, per instruction not to touch that) — only the label changed here.
  const [discountPercent, setDiscountPercent] = useState('0');
  const [saveToLibrary, setSaveToLibrary] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSaveToLibrary(true);
      setSaving(false);
      if (initialData) {
        setLabel(initialData.label);
        setSessions(String(initialData.sessions));
        const base = initialData.originalPrice ?? initialData.price;
        const percent = base > 0 ? Math.round(((initialData.price - base) / base) * 100) : 0;
        setDiscountPercent(String(Math.max(0, percent)));
      } else {
        setLabel('1 Session');
        setSessions('1');
        setDiscountPercent('0');
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const isEditing = !!initialData;
  // Every pack rides on the same reference rate — the service's default duration (falling back
  // to its first one) — so the same Discount Percent means the same thing no matter which pack
  // you're editing.
  const baseDuration = durations.find((d) => d.isDefault) ?? durations[0] ?? null;
  const sessionsNum = Number(sessions) || 0;
  const discountNum = Math.max(0, Number(discountPercent) || 0);
  const basePrice = baseDuration ? baseDuration.price * sessionsNum : 0;
  const finalPrice = Math.round(basePrice * (1 + discountNum / 100));
  const pricePerSession = sessionsNum > 0 ? Math.round(finalPrice / sessionsNum) : 0;
  const canSubmit = !!baseDuration && sessionsNum > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || saving) return;
    setSaving(true);
    try {
      await onAdd({
        label: label.trim() || `${sessionsNum} Session${sessionsNum === 1 ? '' : 's'}`,
        sessions: sessionsNum,
        // price/pricePerSession/originalPrice are only computed here to satisfy ServicePackage's
        // shape and drive this modal's own preview — CatalogueContext no longer forwards them to
        // the backend, which derives price itself from sessions + savingsPercent.
        price: finalPrice,
        pricePerSession,
        originalPrice: basePrice,
        savings: undefined,
        savingsPercent: discountNum,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const body = !baseDuration ? (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-xl p-4">
        Add a duration (timeslot) to this service first — packs are priced off its duration price.
      </p>
      <div className="flex justify-end pt-2 border-t border-gray-100">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Close
        </button>
      </div>
    </div>
  ) : (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">Label</label>
        <input
          type="text"
          required
          placeholder="e.g. 4 Sessions"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C]"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Sessions Count</label>
          <input
            type="number"
            required
            min={1}
            placeholder="e.g. 4"
            value={sessions}
            onChange={(e) => setSessions(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C]"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Discount Percent</label>
          <input
            type="number"
            min={0}
            placeholder="0"
            value={discountPercent}
            onChange={(e) => setDiscountPercent(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C]"
          />
        </div>
      </div>

      {/* No rupee total shown here — this service can have multiple durations, and the
          same multiplier/discount apply to whichever one a customer books with this pack,
          so any single computed amount would only ever be right for one of them. */}
      <div className="rounded-xl bg-[#FAF5F0] border border-[#F2E5D9] px-4 py-3 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500">Pack Price</span>
        <span className="text-sm font-bold text-gray-900">
          ×{sessionsNum || 0} duration price
          {discountNum > 0 && <span className="text-[#C68A4C]"> · {discountNum}% discount</span>}
        </span>
      </div>
      <p className="text-[11px] text-gray-400 -mt-2.5">
        Applies to whichever duration this pack is booked with{durations.length > 1 ? ` — this service has ${durations.length} durations` : ''}.
      </p>

      {showLibraryCheckbox && !isEditing && (
        <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
          <input
            type="checkbox"
            checked={saveToLibrary}
            onChange={(e) => setSaveToLibrary(e.target.checked)}
            className="w-4 h-4 rounded border-gray-400 text-[#25180F] focus:ring-[#C68A4C]/30"
          />
          <span className="text-xs text-gray-700">Save this on library</span>
        </label>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!canSubmit || saving}
          className="px-5 py-2 rounded-xl bg-[#221812] text-white text-sm font-medium hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
        >
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {saving ? 'Saving...' : isEditing ? 'Update Pack' : 'Add Pack'}
        </button>
      </div>
    </form>
  );

  if (embedded) return body;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative border border-gray-100">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#1C1512] text-white flex items-center justify-center hover:bg-black transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-xl font-bold text-gray-900 mb-6">
          {isEditing ? 'Edit Session Pack' : 'Create Session Pack'}
        </h3>

        {body}
      </div>
    </div>
  );
}
