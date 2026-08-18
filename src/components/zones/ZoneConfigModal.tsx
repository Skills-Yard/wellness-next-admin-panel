'use client';

import React, { useEffect, useState } from 'react';
import { X, Check, Plus } from 'lucide-react';
import { toast } from 'react-toastify';
import { useCatalogue } from '../../contexts/CatalogueContext';
import { getServiceDurationsServerAction } from '../../lib/server-actions/duration';
import { getServicePackagesServerAction } from '../../lib/server-actions/package';
import { getServiceAddOnsServerAction } from '../../lib/server-actions/addon';
import {
  saveZoneServiceItemConfigServerAction,
  saveZoneDurationConfigServerAction,
  saveZonePackageConfigServerAction,
  saveZoneAddOnConfigServerAction,
  saveZoneSuiteConfigServerAction,
} from '../../lib/server-actions/zone';
import { ServiceDuration, ServicePackage, ServiceAddOn, ServiceItem, ServiceSuite } from '../../types/catalogue';

type ConfigType = 'service' | 'duration' | 'package' | 'addon' | 'suite';
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
  suite: 'Suite Availability',
};

const SUB_LABELS: Record<ConfigType, string> = {
  service: '',
  duration: 'Duration',
  package: 'Package',
  addon: 'Add-on',
  suite: '',
};

function optionLabel(opt: SubOption): string {
  return 'label' in opt ? opt.label : opt.name;
}

// Duration cards show minutes, package cards show session count — add-ons have no such extra field.
function optionMeta(opt: SubOption, configType: ConfigType): string | undefined {
  if (configType === 'duration') return `${(opt as ServiceDuration).durationMinutes} min`;
  if (configType === 'package') {
    const sessions = (opt as ServicePackage).sessions;
    return `${sessions} session${sessions === 1 ? '' : 's'}`;
  }
  return undefined;
}

// Normalized shape of "this sub-option already has a zone override" — pulled from whichever of
// the three config arrays matches configType, keyed by the sub-option's own id, so a card can be
// themed (and its price shown) without caring which concrete config type it came from.
interface SubConfigInfo {
  id: string;
  price: number;
  discountedPrice?: number | null;
  originalPrice?: number | null;
  savings?: number | null;
  savingsPercent?: number | null;
}

interface CategoryGroup {
  categoryName: string;
  services: ServiceItem[];
}

interface SuiteCategoryGroup {
  categoryName: string;
  suites: ServiceSuite[];
}

export default function ZoneConfigModal({ isOpen, onClose, zoneId, configType }: ZoneConfigModalProps) {
  const {
    categories,
    subCategories,
    serviceItems,
    suites,
    zones,
    zoneServiceItemConfigs,
    zoneDurationConfigs,
    zonePackageConfigs,
    zoneAddOnConfigs,
    zoneSuiteConfigs,
    saveZoneServiceItemConfig,
    saveZoneDurationConfig,
    saveZonePackageConfig,
    saveZoneAddOnConfig,
    saveZoneSuiteConfig,
    deleteZoneDurationConfig,
    deleteZonePackageConfig,
    deleteZoneAddOnConfig,
    refreshData,
  } = useCatalogue();

  const isSuiteConfig = configType === 'suite';
  const needsSub = configType !== 'service' && !isSuiteConfig;

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

  // Suites without a config row for this zone yet — same "no config row yet" pool as
  // pickableServices above, just keyed off ZoneSuiteConfig instead.
  const suitesInZoneIds = new Set(
    zoneSuiteConfigs.filter((c) => c.zoneId === zoneId).map((c) => c.suiteId)
  );
  const pickableSuites = suites.filter((s) => !suitesInZoneIds.has(s.id));
  const suiteCategoryGroups: SuiteCategoryGroup[] = categories
    .map((cat) => ({
      categoryName: cat.name,
      suites: pickableSuites.filter((s) => s.categoryId === cat.id),
    }))
    .filter((group) => group.suites.length > 0);

  const [serviceItemId, setServiceItemId] = useState('');
  const [suiteId, setSuiteId] = useState('');
  const [subOptions, setSubOptions] = useState<SubOption[]>([]);
  const [subId, setSubId] = useState('');
  const [loadingSub, setLoadingSub] = useState(false);
  // Set only when the picked sub-option already has a config row for this zone — carries that
  // row's id so submit PATCHes it instead of POSTing a duplicate.
  const [editingConfigId, setEditingConfigId] = useState<string | null>(null);
  const [deletingSubConfigId, setDeletingSubConfigId] = useState<string | null>(null);

  // Every duration/package/add-on belonging to the selected service, cross-referenced against
  // this zone's existing config rows — lets the card grid theme "already added" (with its price)
  // vs "empty" for the whole service at a glance, not just whatever one entry happens to be open.
  const subConfigMap = new Map<string, SubConfigInfo>();
  if (configType === 'duration') {
    zoneDurationConfigs
      .filter((c) => c.zoneId === zoneId)
      .forEach((c) => subConfigMap.set(c.serviceDurationId, { id: c.id, price: c.price, discountedPrice: c.discountedPrice }));
  } else if (configType === 'package') {
    zonePackageConfigs
      .filter((c) => c.zoneId === zoneId)
      .forEach((c) => subConfigMap.set(c.servicePackageId, {
        id: c.id, price: c.price, originalPrice: c.originalPrice, savings: c.savings, savingsPercent: c.savingsPercent,
      }));
  } else if (configType === 'addon') {
    zoneAddOnConfigs
      .filter((c) => c.zoneId === zoneId)
      .forEach((c) => subConfigMap.set(c.serviceAddOnId, { id: c.id, price: c.price }));
  }
  const selectedSubOption = subOptions.find((o) => o.id === subId);

  const [isAvailable, setIsAvailable] = useState(true);
  const [surgeMultiplier, setSurgeMultiplier] = useState('1');
  const [price, setPrice] = useState('');
  const [discountedPrice, setDiscountedPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [savings, setSavings] = useState('');
  const [savingsPercent, setSavingsPercent] = useState('');
  const [applyToAllZones, setApplyToAllZones] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setServiceItemId('');
      setSuiteId('');
      setSubOptions([]);
      setSubId('');
      setEditingConfigId(null);
      setIsAvailable(true);
      setSurgeMultiplier('1');
      setPrice('');
      setDiscountedPrice('');
      setOriginalPrice('');
      setSavings('');
      setSavingsPercent('');
      setApplyToAllZones(false);
    }
  }, [isOpen, configType]);

  useEffect(() => {
    if (!serviceItemId || !needsSub) {
      setSubOptions([]);
      setSubId('');
      setEditingConfigId(null);
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
      setEditingConfigId(null);
      setPrice('');
      setDiscountedPrice('');
      setOriginalPrice('');
      setSavings('');
      setSavingsPercent('');
      setLoadingSub(false);
    });
    return () => {
      cancelled = true;
    };
  }, [serviceItemId, configType, needsSub]);

  if (!isOpen) return null;

  // Picking a card either opens an existing zone override for editing (price fields prefill from
  // it, submit will PATCH) or starts a fresh one (fields clear, submit will POST).
  const handleSelectSubOption = (opt: SubOption) => {
    setSubId(opt.id);
    const existing = subConfigMap.get(opt.id);
    if (existing) {
      setEditingConfigId(existing.id);
      setPrice(String(existing.price ?? ''));
      setDiscountedPrice(existing.discountedPrice != null ? String(existing.discountedPrice) : '');
      setOriginalPrice(existing.originalPrice != null ? String(existing.originalPrice) : '');
      setSavings(existing.savings != null ? String(existing.savings) : '');
      setSavingsPercent(existing.savingsPercent != null ? String(existing.savingsPercent) : '');
    } else {
      setEditingConfigId(null);
      setPrice('');
      setDiscountedPrice('');
      setOriginalPrice('');
      setSavings('');
      setSavingsPercent('');
    }
  };

  // Lets the admin drop a zone override right from its card without leaving this modal — the
  // little checkmark badge on an "already added" card doubles as this delete button on hover.
  const handleQuickDelete = async (optId: string) => {
    const existing = subConfigMap.get(optId);
    if (!existing) return;
    setDeletingSubConfigId(existing.id);
    try {
      const deleter =
        configType === 'duration' ? deleteZoneDurationConfig
          : configType === 'package' ? deleteZonePackageConfig
            : deleteZoneAddOnConfig;
      const res = await deleter(existing.id);
      if (res.ok) {
        toast.success('Removed from this zone');
        if (editingConfigId === existing.id) {
          setEditingConfigId(null);
          setSubId('');
          setPrice('');
          setDiscountedPrice('');
          setOriginalPrice('');
          setSavings('');
          setSavingsPercent('');
        }
      } else {
        toast.error(res.message || 'Failed to remove');
      }
    } finally {
      setDeletingSubConfigId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSuiteConfig && !suiteId) {
      toast.error('Select a suite');
      return;
    }
    if (!isSuiteConfig && !serviceItemId) {
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
      if (applyToAllZones) {
        await handleApplyToAllZones();
        return;
      }

      let res;
      if (configType === 'service') {
        res = await saveZoneServiceItemConfig(null, {
          zoneId,
          serviceItemId,
          isAvailable,
          surgeMultiplier: Number(surgeMultiplier) || 1,
        });
      } else if (configType === 'suite') {
        res = await saveZoneSuiteConfig(null, { zoneId, suiteId, isAvailable });
      } else if (configType === 'duration') {
        res = await saveZoneDurationConfig(editingConfigId, {
          zoneId,
          serviceDurationId: subId,
          price: Number(price),
          discountedPrice: discountedPrice.trim() ? Number(discountedPrice) : undefined,
        });
      } else if (configType === 'package') {
        res = await saveZonePackageConfig(editingConfigId, {
          zoneId,
          servicePackageId: subId,
          price: Number(price),
          originalPrice: originalPrice.trim() ? Number(originalPrice) : undefined,
          savings: savings.trim() ? Number(savings) : undefined,
          savingsPercent: savingsPercent.trim() ? Number(savingsPercent) : undefined,
        });
      } else {
        res = await saveZoneAddOnConfig(editingConfigId, { zoneId, serviceAddOnId: subId, price: Number(price) });
      }

      if (res.ok) {
        toast.success(editingConfigId ? 'Updated!' : 'Saved!');
        onClose();
      } else {
        toast.error(res.message || 'Failed to save');
      }
    } finally {
      setSaving(false);
    }
  };

  // "Apply to all zones" writes one row per zone that doesn't already have this exact
  // service/duration/package/add-on/suite configured — a snapshot fan-out, not a live "applies
  // to every zone forever" rule (zoneId is required on these 5 models, unlike PromotionalCampaign,
  // so there's no null-means-everywhere option here). A zone created later needs this re-run.
  // Calls the raw server actions directly (not the context-wrapped ones) so N zones only cost
  // one refreshData() at the end instead of N.
  const handleApplyToAllZones = async () => {
    let alreadyConfiguredZoneIds: Set<string>;
    let results: { ok: boolean; message?: string }[];
    let targets = zones;

    if (configType === 'service') {
      alreadyConfiguredZoneIds = new Set(
        zoneServiceItemConfigs.filter((c) => c.serviceItemId === serviceItemId).map((c) => c.zoneId)
      );
      targets = zones.filter((z) => !alreadyConfiguredZoneIds.has(z.id));
      results = await Promise.all(targets.map((z) => saveZoneServiceItemConfigServerAction(null, {
        zoneId: z.id, serviceItemId, isAvailable, surgeMultiplier: Number(surgeMultiplier) || 1,
      })));
    } else if (configType === 'duration') {
      alreadyConfiguredZoneIds = new Set(
        zoneDurationConfigs.filter((c) => c.serviceDurationId === subId).map((c) => c.zoneId)
      );
      targets = zones.filter((z) => !alreadyConfiguredZoneIds.has(z.id));
      results = await Promise.all(targets.map((z) => saveZoneDurationConfigServerAction(null, {
        zoneId: z.id,
        serviceDurationId: subId,
        price: Number(price),
        discountedPrice: discountedPrice.trim() ? Number(discountedPrice) : undefined,
      })));
    } else if (configType === 'package') {
      alreadyConfiguredZoneIds = new Set(
        zonePackageConfigs.filter((c) => c.servicePackageId === subId).map((c) => c.zoneId)
      );
      targets = zones.filter((z) => !alreadyConfiguredZoneIds.has(z.id));
      results = await Promise.all(targets.map((z) => saveZonePackageConfigServerAction(null, {
        zoneId: z.id,
        servicePackageId: subId,
        price: Number(price),
        originalPrice: originalPrice.trim() ? Number(originalPrice) : undefined,
        savings: savings.trim() ? Number(savings) : undefined,
        savingsPercent: savingsPercent.trim() ? Number(savingsPercent) : undefined,
      })));
    } else if (configType === 'suite') {
      alreadyConfiguredZoneIds = new Set(
        zoneSuiteConfigs.filter((c) => c.suiteId === suiteId).map((c) => c.zoneId)
      );
      targets = zones.filter((z) => !alreadyConfiguredZoneIds.has(z.id));
      results = await Promise.all(targets.map((z) => saveZoneSuiteConfigServerAction(null, {
        zoneId: z.id, suiteId, isAvailable,
      })));
    } else {
      alreadyConfiguredZoneIds = new Set(
        zoneAddOnConfigs.filter((c) => c.serviceAddOnId === subId).map((c) => c.zoneId)
      );
      targets = zones.filter((z) => !alreadyConfiguredZoneIds.has(z.id));
      results = await Promise.all(targets.map((z) => saveZoneAddOnConfigServerAction(null, {
        zoneId: z.id, serviceAddOnId: subId, price: Number(price),
      })));
    }

    if (targets.length === 0) {
      toast.info('Every zone already has this configured.');
      onClose();
      return;
    }

    const failed = results.filter((r) => !r.ok).length;
    await refreshData();

    if (failed === 0) {
      const skipped = alreadyConfiguredZoneIds.size;
      toast.success(
        `Applied to all ${targets.length} zone${targets.length === 1 ? '' : 's'}${skipped > 0 ? ` (${skipped} already had it)` : ''}!`
      );
      onClose();
    } else {
      toast.error(`Applied to ${targets.length - failed} of ${targets.length} zones — ${failed} failed.`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className={`bg-white rounded-3xl w-full p-6 shadow-2xl relative border border-gray-100 max-h-[90vh] overflow-y-auto ${needsSub ? 'max-w-2xl' : 'max-w-md'}`}>
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#1C1512] text-white flex items-center justify-center hover:bg-black transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-xl font-bold text-gray-900 mb-6">{TITLES[configType]}</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSuiteConfig && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Suite</label>
              <select
                value={suiteId}
                onChange={(e) => setSuiteId(e.target.value)}
                disabled={pickableSuites.length === 0}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C] disabled:opacity-50"
              >
                <option value="">
                  {pickableSuites.length === 0 ? 'No suites available' : 'Select a suite...'}
                </option>
                {suiteCategoryGroups.map((group) => (
                  <optgroup key={group.categoryName} label={group.categoryName}>
                    {group.suites.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {pickableSuites.length === 0 && suites.length > 0 && (
                <p className="text-xs text-gray-400 mt-1.5">
                  Every suite already has an availability entry in this zone.
                </p>
              )}
              {suites.length === 0 && (
                <p className="text-xs text-gray-400 mt-1.5">
                  No suites exist yet — add one from the Categories page first.
                </p>
              )}
            </div>
          )}

          {!isSuiteConfig && (
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
          )}

          {needsSub && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-gray-700 block">{SUB_LABELS[configType]}</label>
                {serviceItemId && !loadingSub && subOptions.length > 0 && (
                  <span className="text-[11px] text-gray-400">
                    {subOptions.filter((o) => subConfigMap.has(o.id)).length} of {subOptions.length} added in this zone
                  </span>
                )}
              </div>

              {!serviceItemId && (
                <p className="text-xs text-gray-400 border border-dashed border-gray-200 rounded-xl p-4 text-center">
                  Select a service above to see its {SUB_LABELS[configType].toLowerCase()}s.
                </p>
              )}
              {serviceItemId && loadingSub && (
                <p className="text-xs text-gray-400 border border-gray-100 rounded-xl p-4 text-center">Loading...</p>
              )}
              {serviceItemId && !loadingSub && subOptions.length === 0 && (
                <p className="text-xs text-gray-400 border border-dashed border-gray-200 rounded-xl p-4 text-center">
                  This service has no {SUB_LABELS[configType].toLowerCase()}s yet.
                </p>
              )}
              {serviceItemId && !loadingSub && subOptions.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto pr-1 -mr-1">
                  {subOptions.map((opt) => (
                    <SubOptionCard
                      key={opt.id}
                      option={opt}
                      configType={configType}
                      isSelected={subId === opt.id}
                      existing={subConfigMap.get(opt.id)}
                      onSelect={() => handleSelectSubOption(opt)}
                      onDelete={() => handleQuickDelete(opt.id)}
                      deleting={deletingSubConfigId === subConfigMap.get(opt.id)?.id}
                    />
                  ))}
                </div>
              )}

              {subId && (
                <p className={`text-xs mt-2 font-medium ${editingConfigId ? 'text-[#2E7D32]' : 'text-[#C68A4C]'}`}>
                  {editingConfigId
                    ? 'Already added to this zone — update the price below and save.'
                    : `New override for "${selectedSubOption ? optionLabel(selectedSubOption) : ''}" — set its zone price below.`}
                </p>
              )}
            </div>
          )}

          {(configType === 'service' || isSuiteConfig) && (
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
              {configType === 'service' && (
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
              )}
            </>
          )}

          {needsSub && (
            <div className={configType === 'duration' ? 'grid grid-cols-2 gap-3' : ''}>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Price {selectedSubOption ? `for "${optionLabel(selectedSubOption)}"` : ''} (₹)
                </label>
                <input
                  type="number"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C]"
                />
              </div>
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

          <div className="pt-2 border-t border-gray-100">
            <label className="flex items-center gap-2 text-sm text-gray-700 pt-4">
              <input
                type="checkbox"
                checked={applyToAllZones}
                onChange={(e) => setApplyToAllZones(e.target.checked)}
                className="w-4 h-4 accent-[#C68A4C]"
              />
              Apply to all zones
            </label>
            <p className="text-xs text-gray-400 mt-1 ml-6">
              Writes this to every zone that doesn&apos;t already have it configured, instead of just this one.
              Zones created later won&apos;t inherit it automatically — re-run this if that happens.
            </p>
          </div>

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
              {saving
                ? 'Saving...'
                : applyToAllZones
                  ? 'Apply to All Zones'
                  : editingConfigId
                    ? 'Update'
                    : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SubOptionCard({
  option,
  configType,
  isSelected,
  existing,
  onSelect,
  onDelete,
  deleting,
}: {
  option: SubOption;
  configType: ConfigType;
  isSelected: boolean;
  existing?: SubConfigInfo;
  onSelect: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const isConfigured = !!existing;
  const meta = optionMeta(option, configType);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`relative text-left p-3 rounded-2xl border cursor-pointer transition-all ${
        isSelected
          ? 'border-[#C68A4C] ring-2 ring-[#C68A4C]/30 bg-[#FFF9F2]'
          : isConfigured
            ? 'border-[#C8E6C9] bg-[#E8F5E9] hover:border-[#A5D6A7]'
            : 'border-dashed border-gray-200 bg-white hover:border-[#D4A373] hover:bg-[#FAF5F0]/40'
      }`}
    >
      {isConfigured && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          disabled={deleting}
          title="Remove from this zone"
          className="group/del absolute top-2 right-2 w-5 h-5 rounded-full bg-[#2E7D32] text-white flex items-center justify-center hover:bg-red-500 transition-colors disabled:opacity-60"
        >
          {deleting ? (
            <span className="w-2.5 h-2.5 border-2 border-white/60 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Check className="w-2.5 h-2.5 group-hover/del:hidden" />
              <X className="w-2.5 h-2.5 hidden group-hover/del:block" />
            </>
          )}
        </button>
      )}

      <div className={`text-sm font-semibold pr-5 truncate ${isConfigured ? 'text-[#1B5E20]' : 'text-gray-800'}`}>
        {optionLabel(option)}
      </div>
      {meta && <div className="text-[11px] text-gray-400 mt-0.5">{meta}</div>}

      <div className="mt-1.5">
        {isConfigured ? (
          <span className="text-xs font-bold text-[#2E7D32]">₹{existing!.price.toLocaleString()}</span>
        ) : (
          <span className="text-[11px] text-gray-400 inline-flex items-center gap-1">
            <Plus className="w-3 h-3" /> Not added
          </span>
        )}
      </div>
    </div>
  );
}
