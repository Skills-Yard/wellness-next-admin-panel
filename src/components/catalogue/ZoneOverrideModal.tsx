'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { useCatalogue } from '../../contexts/CatalogueContext';
import { OperationalZone, ServiceItem } from '../../types/catalogue';

interface ZoneOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  zone: OperationalZone | null;
  serviceItem: ServiceItem | null;
}

const inputCls =
  'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C]';

export default function ZoneOverrideModal({ isOpen, onClose, zone, serviceItem }: ZoneOverrideModalProps) {
  const {
    zoneServiceItemConfigs,
    zoneDurationConfigs,
    zonePackageConfigs,
    zoneAddOnConfigs,
    serviceDurations,
    servicePackages,
    serviceAddOns,
    saveZoneServiceItemConfig,
    saveZoneDurationConfig,
    deleteZoneDurationConfig,
    saveZonePackageConfig,
    deleteZonePackageConfig,
    saveZoneAddOnConfig,
    deleteZoneAddOnConfig,
  } = useCatalogue();

  const itemConfig = zone && serviceItem
    ? zoneServiceItemConfigs.find(c => c.zoneId === zone.id && c.serviceItemId === serviceItem.id)
    : undefined;

  const [isAvailable, setIsAvailable] = useState(true);
  const [surgeMultiplier, setSurgeMultiplier] = useState('1');
  const [savingAvailability, setSavingAvailability] = useState(false);

  useEffect(() => {
    setIsAvailable(itemConfig?.isAvailable ?? true);
    setSurgeMultiplier(String(itemConfig?.surgeMultiplier ?? 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemConfig?.id, isOpen, zone?.id, serviceItem?.id]);

  if (!isOpen || !zone || !serviceItem) return null;

  const handleSaveAvailability = async () => {
    setSavingAvailability(true);
    const res = await saveZoneServiceItemConfig(itemConfig?.id || null, {
      zoneId: zone.id,
      serviceItemId: serviceItem.id,
      isAvailable,
      surgeMultiplier: Number(surgeMultiplier) || 1,
    });
    setSavingAvailability(false);
    if (res.ok) toast.success('Zone availability saved');
    else toast.error(res.message || 'Failed to save zone availability');
  };

  const zoneDurations = zoneDurationConfigs.filter(c => c.zoneId === zone.id);
  const zonePackages = zonePackageConfigs.filter(c => c.zoneId === zone.id);
  const zoneAddOns = zoneAddOnConfigs.filter(c => c.zoneId === zone.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-2xl p-6 shadow-2xl relative border border-gray-100 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#1C1512] text-white flex items-center justify-center hover:bg-black transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-xl font-bold text-gray-900 mb-1">{zone.name}</h3>
        <p className="text-xs text-gray-400 mb-6">{zone.city} &middot; {serviceItem.name}</p>

        {/* Availability & surge */}
        <div className="space-y-3 pb-6 border-b border-gray-100">
          <h4 className="text-sm font-bold text-gray-900">Availability</h4>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3 items-end">
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Surge Multiplier</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={surgeMultiplier}
                onChange={(e) => setSurgeMultiplier(e.target.value)}
                className={inputCls}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700 pb-2.5">
              <input
                type="checkbox"
                checked={isAvailable}
                onChange={(e) => setIsAvailable(e.target.checked)}
                className="w-4 h-4 accent-[#C68A4C]"
              />
              Available in this zone
            </label>
            <button
              onClick={handleSaveAvailability}
              disabled={savingAvailability}
              className="px-4 py-2 rounded-xl bg-[#221812] text-white text-sm font-medium hover:bg-black disabled:opacity-60"
            >
              {savingAvailability ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Duration price overrides */}
        <PriceOverrideSection
          title="Duration Pricing"
          emptyHint="No durations on this service item yet."
          rows={serviceDurations.map(dur => {
            const cfg = zoneDurations.find(c => c.serviceDurationId === dur.id);
            return { key: dur.id, label: dur.label, basePrice: dur.price, baseDiscounted: dur.discountedPrice, cfg };
          })}
          showDiscounted
          onSave={async (durationId, price, discountedPrice, existingId) => {
            const res = await saveZoneDurationConfig(existingId || null, {
              zoneId: zone.id,
              serviceDurationId: durationId,
              price,
              discountedPrice,
            });
            if (res.ok) toast.success('Duration price saved');
            else toast.error(res.message || 'Failed to save duration price');
          }}
          onClear={async (id) => {
            const res = await deleteZoneDurationConfig(id);
            if (res.ok) toast.success('Override removed');
            else toast.error(res.message || 'Failed to remove override');
          }}
        />

        {/* Package price overrides */}
        <PriceOverrideSection
          title="Package Pricing"
          emptyHint="No session packs on this service item yet."
          rows={servicePackages.map(pkg => {
            const cfg = zonePackages.find(c => c.servicePackageId === pkg.id);
            return { key: pkg.id, label: `${pkg.label} (${pkg.sessions})`, basePrice: pkg.price, baseDiscounted: null, cfg };
          })}
          onSave={async (packageId, price, _discounted, existingId) => {
            const res = await saveZonePackageConfig(existingId || null, {
              zoneId: zone.id,
              servicePackageId: packageId,
              price,
            });
            if (res.ok) toast.success('Package price saved');
            else toast.error(res.message || 'Failed to save package price');
          }}
          onClear={async (id) => {
            const res = await deleteZonePackageConfig(id);
            if (res.ok) toast.success('Override removed');
            else toast.error(res.message || 'Failed to remove override');
          }}
        />

        {/* Add-on price overrides */}
        <PriceOverrideSection
          title="Add-on Pricing"
          emptyHint="No add-ons on this service item yet."
          rows={serviceAddOns.map(addon => {
            const cfg = zoneAddOns.find(c => c.serviceAddOnId === addon.id);
            return { key: addon.id, label: addon.name, basePrice: addon.price, baseDiscounted: null, cfg };
          })}
          onSave={async (addOnId, price, _discounted, existingId) => {
            const res = await saveZoneAddOnConfig(existingId || null, {
              zoneId: zone.id,
              serviceAddOnId: addOnId,
              price,
            });
            if (res.ok) toast.success('Add-on price saved');
            else toast.error(res.message || 'Failed to save add-on price');
          }}
          onClear={async (id) => {
            const res = await deleteZoneAddOnConfig(id);
            if (res.ok) toast.success('Override removed');
            else toast.error(res.message || 'Failed to remove override');
          }}
        />

        <div className="flex justify-end pt-4 mt-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

interface OverrideRowData {
  key: string;
  label: string;
  basePrice: number;
  baseDiscounted?: number | null;
  cfg?: { id: string; price: number; discountedPrice?: number | null };
}

function PriceOverrideSection({
  title,
  emptyHint,
  rows,
  showDiscounted,
  onSave,
  onClear,
}: {
  title: string;
  emptyHint: string;
  rows: OverrideRowData[];
  showDiscounted?: boolean;
  onSave: (entityId: string, price: number, discountedPrice: number | undefined, existingConfigId?: string) => Promise<void>;
  onClear: (configId: string) => Promise<void>;
}) {
  return (
    <div className="space-y-3 py-6 border-b border-gray-100 last:border-b-0">
      <h4 className="text-sm font-bold text-gray-900">{title}</h4>
      {rows.length === 0 ? (
        <p className="text-xs text-gray-400">{emptyHint}</p>
      ) : (
        <div className="space-y-2">
          {rows.map(row => (
            <PriceOverrideRow
              key={row.key}
              row={row}
              showDiscounted={showDiscounted}
              onSave={onSave}
              onClear={onClear}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PriceOverrideRow({
  row,
  showDiscounted,
  onSave,
  onClear,
}: {
  row: OverrideRowData;
  showDiscounted?: boolean;
  onSave: (entityId: string, price: number, discountedPrice: number | undefined, existingConfigId?: string) => Promise<void>;
  onClear: (configId: string) => Promise<void>;
}) {
  const [price, setPrice] = useState(row.cfg ? String(row.cfg.price) : '');
  const [discountedPrice, setDiscountedPrice] = useState(row.cfg?.discountedPrice != null ? String(row.cfg.discountedPrice) : '');
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    setPrice(row.cfg ? String(row.cfg.price) : '');
    setDiscountedPrice(row.cfg?.discountedPrice != null ? String(row.cfg.discountedPrice) : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [row.cfg?.id]);

  const handleSave = async () => {
    if (!price.trim()) {
      toast.error('Enter an override price first');
      return;
    }
    setSaving(true);
    await onSave(row.key, Number(price), discountedPrice.trim() ? Number(discountedPrice) : undefined, row.cfg?.id);
    setSaving(false);
  };

  const handleClear = async () => {
    if (!row.cfg) return;
    setClearing(true);
    await onClear(row.cfg.id);
    setClearing(false);
  };

  return (
    <div className="flex flex-wrap items-end gap-2 bg-[#FAF5F0] border border-[#F2E5D9] rounded-xl px-3 py-2.5">
      <div className="flex-1 min-w-[120px]">
        <p className="text-sm font-medium text-gray-800">{row.label}</p>
        <p className="text-[11px] text-gray-400">
          Base: ₹{row.basePrice.toLocaleString()}
          {row.baseDiscounted ? ` (₹${row.baseDiscounted.toLocaleString()} discounted)` : ''}
        </p>
      </div>
      <input
        type="number"
        placeholder="Zone price"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        className="w-28 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C]"
      />
      {showDiscounted && (
        <input
          type="number"
          placeholder="Discounted"
          value={discountedPrice}
          onChange={(e) => setDiscountedPrice(e.target.value)}
          className="w-28 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C]"
        />
      )}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-8 h-8 rounded-lg bg-[#221812] text-white flex items-center justify-center hover:bg-black disabled:opacity-60"
        title="Save override"
      >
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
      </button>
      {row.cfg && (
        <button
          onClick={handleClear}
          disabled={clearing}
          className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 disabled:opacity-60"
          title="Remove override"
        >
          {clearing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
        </button>
      )}
    </div>
  );
}
