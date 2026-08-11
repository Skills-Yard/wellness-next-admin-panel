'use client';

import React, { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { ServiceDuration } from '../../types/catalogue';

interface DurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (duration: Omit<ServiceDuration, 'id'>) => void | Promise<void>;
  initialData?: ServiceDuration | null;
  // Cosmetic — every saved duration is already reusable across services via the Library (see
  // useLibrarySections), so there's no separate "private" state to gate on. Shown to match the
  // Create screen design; hidden for edit forms.
  showLibraryCheckbox?: boolean;
  // Renders just the form (no backdrop/card/close button/title) for use inside AddSectionModal's
  // "Create" tab. Standalone (non-embedded) use — the Edit flow — is unaffected.
  embedded?: boolean;
}

export default function DurationModal({
  isOpen,
  onClose,
  onAdd,
  initialData,
  showLibraryCheckbox = true,
  embedded = false,
}: DurationModalProps) {
  const [label, setLabel] = useState('90 mins');
  const [minutes, setMinutes] = useState('90');
  // Original Price maps to the `price` column — required. Discounted Price maps to the existing
  // `discountedPrice` column — optional, the only field savings/discount% are derived from.
  const [originalPrice, setOriginalPrice] = useState('1199');
  const [discountedPrice, setDiscountedPrice] = useState('');
  const [saveToLibrary, setSaveToLibrary] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLabel(initialData?.label ?? '90 mins');
      setMinutes(initialData ? String(initialData.durationMinutes) : '90');
      setOriginalPrice(initialData ? String(initialData.price) : '1199');
      setDiscountedPrice(initialData?.discountedPrice != null ? String(initialData.discountedPrice) : '');
      setSaveToLibrary(true);
      setSaving(false);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const isEditing = !!initialData;

  const originalNum = Number(originalPrice) || 0;
  const hasOriginalPrice = originalNum > 0;
  const discountedNum = discountedPrice.trim() !== '' ? Number(discountedPrice) : null;
  const discountInvalid = discountedNum !== null && discountedNum > originalNum;
  const hasDiscount = discountedNum !== null && discountedNum > 0 && discountedNum < originalNum;
  const savingsAmount = hasDiscount ? originalNum - (discountedNum as number) : 0;
  const savingsPercent = hasDiscount && originalNum > 0 ? Math.round((savingsAmount / originalNum) * 100) : 0;
  const canSubmit = hasOriginalPrice && !discountInvalid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || saving) return;
    setSaving(true);
    try {
      await onAdd({
        label,
        durationMinutes: Number(minutes) || 90,
        price: originalNum,
        discountedPrice: discountedNum ?? undefined,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const form = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">Label</label>
        <input
          type="text"
          required
          placeholder="e.g. 90 mins"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C]"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">Duration (Minutes)</label>
        <input
          type="number"
          required
          placeholder="90"
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C]"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">Original Price (₹)</label>
        <input
          type="number"
          required
          placeholder="1199"
          value={originalPrice}
          onChange={(e) => setOriginalPrice(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C]"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">Discounted Price (₹)</label>
        <input
          type="number"
          placeholder="Optional — leave blank for no discount"
          value={discountedPrice}
          onChange={(e) => setDiscountedPrice(e.target.value)}
          className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 ${
            discountInvalid ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-[#C68A4C]'
          }`}
        />
        {discountInvalid ? (
          <p className="text-xs text-red-500 mt-1">Discounted price can't be higher than the original price.</p>
        ) : hasDiscount ? (
          <p className="text-xs text-green-600 mt-1">
            Customer saves ₹{savingsAmount} ({savingsPercent}% off)
          </p>
        ) : (
          <p className="text-xs text-gray-400 mt-1">Savings and discount % are calculated automatically.</p>
        )}
      </div>

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
          {saving ? 'Saving...' : isEditing ? 'Update Duration' : 'Add Duration'}
        </button>
      </div>
    </form>
  );

  if (embedded) return form;

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
          {isEditing ? 'Edit Duration (Timeslot)' : 'Create Duration (Timeslot)'}
        </h3>

        {form}
      </div>
    </div>
  );
}
