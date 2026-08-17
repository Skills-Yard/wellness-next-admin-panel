'use client';

import React from 'react';
import { OperationalZone } from '../../types/catalogue';

export interface ZoneOverrideValue {
  // Currency amount — only meaningful in mode="price" (DurationModal).
  price?: string;
  discountedPrice?: string;
  // Percent — only meaningful in mode="discount" (PackModal). Packages don't carry a flat
  // price of their own (see PackModal's Discount Percent field), so their per-zone override
  // is a percent applied the same way, not a currency amount.
  discountPercent?: string;
}

interface ZonePriceOverridesFieldsProps {
  zones: OperationalZone[];
  values: Record<string, ZoneOverrideValue>;
  onChange: (zoneId: string, value: ZoneOverrideValue) => void;
  // Duration pricing supports a discounted price per zone; package pricing doesn't (mirrors
  // ZoneOverrideModal's PriceOverrideSection, which only passes showDiscounted for durations).
  showDiscounted?: boolean;
  // Used only for the input placeholder — shows what price applies when a zone is left blank.
  basePrice?: number;
  // "price" (default) is a flat currency override, used by DurationModal. "discount" renders a
  // Discount Percent input instead, used by PackModal — a pack's price is always sessions x
  // duration price adjusted by a percent, never a standalone number, so its zone override has
  // to be a percent too rather than a currency amount.
  mode?: 'price' | 'discount';
  // In discount mode, shown in the placeholder so admins can see what "leave blank" resolves
  // to (the pack's own Discount Percent above).
  defaultDiscountPercent?: number;
  // In discount mode, an optional computed-price preview per zone (e.g. "≈ ₹930 for this
  // zone's duration price"), shown under the row — since the percent typed there can't show
  // the resulting rupee amount by itself.
  hints?: Record<string, string>;
}

// Inline, per-zone price override rows shared by DurationModal and PackModal so the admin can
// set zone-specific pricing right where a duration/pack is created — instead of only afterwards,
// via the separate "Zone Availability & Pricing" -> per-zone -> Edit flow (ZoneOverrideModal).
// Leaving a row blank means "use the price above for that zone" (no override row is written/kept).
export default function ZonePriceOverridesFields({
  zones,
  values,
  onChange,
  showDiscounted,
  basePrice,
  mode = 'price',
  defaultDiscountPercent,
  hints,
}: ZonePriceOverridesFieldsProps) {
  if (zones.length === 0) {
    return (
      <p className="text-xs text-gray-400 bg-gray-50 border border-dashed border-gray-200 rounded-xl p-3">
        No zones configured yet. Create one under Zones management, then per-zone pricing can be set here.
      </p>
    );
  }

  return (
    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
      {zones.map((zone) => {
        const val = values[zone.id] ?? { price: '', discountedPrice: '', discountPercent: '' };
        const hint = mode === 'discount' ? hints?.[zone.id] : undefined;
        return (
          <div
            key={zone.id}
            className="bg-[#FAF5F0] border border-[#F2E5D9] rounded-xl px-3 py-2 space-y-1"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex-1 min-w-[100px] text-xs font-medium text-gray-700">
                {zone.name} <span className="text-gray-400">({zone.city})</span>
              </span>
              {mode === 'discount' ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    placeholder={defaultDiscountPercent !== undefined ? `Default ${defaultDiscountPercent}%` : '0%'}
                    value={val.discountPercent ?? ''}
                    onChange={(e) => onChange(zone.id, { ...val, discountPercent: e.target.value })}
                    className="w-24 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C]"
                  />
                  <span className="text-xs text-gray-400">%</span>
                </div>
              ) : (
                <>
                  <input
                    type="number"
                    placeholder={basePrice ? `Default ₹${basePrice}` : 'Zone price'}
                    value={val.price ?? ''}
                    onChange={(e) => onChange(zone.id, { ...val, price: e.target.value })}
                    className="w-28 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C]"
                  />
                  {showDiscounted && (
                    <input
                      type="number"
                      placeholder="Discounted"
                      value={val.discountedPrice ?? ''}
                      onChange={(e) => onChange(zone.id, { ...val, discountedPrice: e.target.value })}
                      className="w-28 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C]"
                    />
                  )}
                </>
              )}
            </div>
            {hint && <p className="text-[10px] text-gray-400 pl-0.5">{hint}</p>}
          </div>
        );
      })}
    </div>
  );
}
