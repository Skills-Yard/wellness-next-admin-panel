'use client';

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'react-toastify';
import { useCatalogue } from '../../contexts/CatalogueContext';
import { getServiceDurationsServerAction } from '../../lib/server-actions/duration';
import { getServicePackagesServerAction } from '../../lib/server-actions/package';
import { getServiceAddOnsServerAction } from '../../lib/server-actions/addon';
import { ServiceDuration, ServicePackage, ServiceAddOn, ServiceItem } from '../../types/catalogue';

type ConfigType = 'service' | 'duration' | 'package' | 'addon';
type SubOption = ServiceDuration | ServicePackage | ServiceAddOn;

interface ZoneConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  zoneId: string;
  configType: ConfigType;
}

const TITLES: Record<ConfigType, string> = {
  service: 'Service Availability',
  duration: 'Duration Price Override',
  package: 'Package Price Override',
  addon: 'Add-on Price Override',
};

const SUB_LABELS: Record<ConfigType, string> = {
  service: '',
  duration: 'Duration',
  package: 'Package',
  addon: 'Add-on',
};

function optionLabel(opt: SubOption): string {
  return 'label' in opt ? opt.label : opt.name;
}

interface CategoryGroup {
  categoryName: string;
  services: ServiceItem[];
}

export default function ZoneConfigModal({ isOpen, onClose, zoneId, configType }: ZoneConfigModalProps) {
  const {
    categories,
    subCategories,
    serviceItems,
    zoneServiceItemConfigs,
    saveZoneServiceItemConfig,
    saveZoneDurationConfig,
    saveZonePackageConfig,
    saveZoneAddOnConfig,
  } = useCatalogue();

  const needsSub = configType !== 'service';

  // Services already carrying a config row for this zone (whether available or not) — the
  // pool that Duration/Package/Add-on overrides are allowed to target, and the pool excluded
  // from the "add service availability" picker (a second entry for the same zone+service pair
  // would just fail on the backend's unique constraint).
  const servicesInZoneIds = new Set(
    zoneServiceItemConfigs.filter((c) => c.zoneId === zoneId).map((c) => c.serviceItemId)
  );
  const pickableServices = serviceItems.filter((s) =>
    needsSub ? servicesInZoneIds.has(s.id) : !servicesInZoneIds.has(s.id)
  );

  // Group whatever's pickable by its parent category, for a "category-wise" <select>.
  const categoryGroups: CategoryGroup[] = categories
    .map((cat) => ({
      categoryName: cat.name,
      services: pickableServices.filter((s) => {
        const subCat = subCategories.find((sc) => sc.id === s.subCategoryId);
        return subCat?.categoryId === cat.id;
      }),
    }))
    .filter((group) => group.services.length > 0);
  // Services whose sub-category isn't in the loaded list for any reason still need a home.
  const groupedServiceIds = new Set(categoryGroups.flatMap((g) => g.services.map((s) => s.id)));
  const ungroupedServices = pickableServices.filter((s) => !groupedServiceIds.has(s.id));
  if (ungroupedServices.length > 0) {
    categoryGroups.push({ categoryName: 'Other', services: ungroupedServices });
  }

  const [serviceItemId, setServiceItemId] = useState('');
  const [subOptions, setSubOptions] = useState<SubOption[]>([]);
  const [subId, setSubId] = useState('');
  const [loadingSub, setLoadingSub] = useState(false);

  const [isAvailable, setIsAvailable] = useState(true);
  const [surgeMultiplier, setSurgeMultiplier] = useState('1');
  const [price, setPrice] = useState('');
  const [discountedPrice, setDiscountedPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [savings, setSavings] = useState('');
  const [savingsPercent, setSavingsPercent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setServiceItemId('');
      setSubOptions([]);
      setSubId('');
      setIsAvailable(true);
      setSurgeMultiplier('1');
      setPrice('');
      setDiscountedPrice('');
      setOriginalPrice('');
      setSavings('');
      setSavingsPercent('');
    }
  }, [isOpen, configType]);

  useEffect(() => {
    if (!serviceItemId || !needsSub) {
      setSubOptions([]);
      setSubId('');
      return;
    }
    let cancelled = false;
    setLoadingSub(true);
    const fetcher =
      configType === 'duration' ? getServiceDurationsServerAction
        : configType === 'package' ? getServicePackagesServerAction
          : getServiceAddOnsServerAction;
    fetcher(serviceItemId).then((items) => {
      if (cancelled) return;
      setSubOptions(items);
      setSubId('');
      setLoadingSub(false);
    });
    return () => {
      cancelled = true;
    };
  }, [serviceItemId, configType, needsSub]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceItemId) {
      toast.error('Select a service item');
      return;
    }
    if (needsSub && !subId) {
      toast.error(`Select a ${SUB_LABELS[configType].toLowerCase()}`);
      return;
    }
    if (needsSub && !price.trim()) {
      toast.error('Enter a price');
      return;
    }

    setSaving(true);
    try {
      let res;
      if (configType === 'service') {
        res = await saveZoneServiceItemConfig(null, {
          zoneId,
          serviceItemId,
          isAvailable,
          surgeMultiplier: Number(surgeMultiplier) || 1,
        });
      } else if (configType === 'duration') {
        res = await saveZoneDurationConfig(null, {
          zoneId,
          serviceDurationId: subId,
          price: Number(price),
          discountedPrice: discountedPrice.trim() ? Number(discountedPrice) : undefined,
        });
      } else if (configType === 'package') {
        res = await saveZonePackageConfig(null, {
          zoneId,
          servicePackageId: subId,
          price: Number(price),
          originalPrice: originalPrice.trim() ? Number(originalPrice) : undefined,
          savings: savings.trim() ? Number(savings) : undefined,
          savingsPercent: savingsPercent.trim() ? Number(savingsPercent) : undefined,
        });
      } else {
        res = await saveZoneAddOnConfig(null, { zoneId, serviceAddOnId: subId, price: Number(price) });
      }

      if (res.ok) {
        toast.success('Saved!');
        onClose();
      } else {
        toast.error(res.message || 'Failed to save');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative border border-gray-100">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#1C1512] text-white flex items-center justify-center hover:bg-black transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-xl font-bold text-gray-900 mb-6">{TITLES[configType]}</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Service Item</label>
            <select
              value={serviceItemId}
              onChange={(e) => setServiceItemId(e.target.value)}
              disabled={pickableServices.length === 0}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C] disabled:opacity-50"
            >
              <option value="">
                {pickableServices.length === 0 ? 'No services available' : 'Select a service...'}
              </option>
              {categoryGroups.map((group) => (
                <optgroup key={group.categoryName} label={group.categoryName}>
                  {group.services.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
            {needsSub && pickableServices.length === 0 && (
              <p className="text-xs text-gray-400 mt-1.5">
                No services have been added to this zone yet — add one via the Services tab first.
              </p>
            )}
            {!needsSub && pickableServices.length === 0 && serviceItems.length > 0 && (
              <p className="text-xs text-gray-400 mt-1.5">
                Every service already has an availability entry in this zone.
              </p>
            )}
          </div>

          {needsSub && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">{SUB_LABELS[configType]}</label>
              <select
                value={subId}
                onChange={(e) => setSubId(e.target.value)}
                disabled={!serviceItemId || loadingSub}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C] disabled:opacity-50"
              >
                <option value="">{loadingSub ? 'Loading...' : `Select a ${SUB_LABELS[configType].toLowerCase()}...`}</option>
                {subOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>{optionLabel(opt)}</option>
                ))}
              </select>
            </div>
          )}

          {configType === 'service' && (
            <>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.checked)}
                  className="w-4 h-4 accent-[#C68A4C]"
                />
                Available in this zone
              </label>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Surge Multiplier</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={surgeMultiplier}
                  onChange={(e) => setSurgeMultiplier(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C]"
                />
              </div>
            </>
          )}

          {needsSub && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Price (₹)</label>
              <input
                type="number"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C]"
              />
            </div>
          )}

          {configType === 'duration' && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Discounted Price (₹)</label>
              <input
                type="number"
                value={discountedPrice}
                onChange={(e) => setDiscountedPrice(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C]"
              />
            </div>
          )}

          {configType === 'package' && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Original</label>
                <input
                  type="number"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Savings</label>
                <input
                  type="number"
                  value={savings}
                  onChange={(e) => setSavings(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Savings %</label>
                <input
                  type="number"
                  value={savingsPercent}
                  onChange={(e) => setSavingsPercent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C]"
                />
              </div>
            </div>
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
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-[#221812] text-white text-sm font-medium hover:bg-black disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
