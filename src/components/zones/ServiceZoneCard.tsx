'use client';

import React, { useState } from 'react';
import { Plus, ChevronDown, Trash2, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { useCatalogue } from '../../contexts/CatalogueContext';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import DurationModal from '../catalogue/DurationModal';
import PackModal from '../catalogue/PackModal';
import AddOnModal from '../catalogue/AddOnModal';
import {
  saveZoneDurationConfigServerAction,
  saveZonePackageConfigServerAction,
  saveZoneAddOnConfigServerAction,
  saveZoneSuiteConfigServerAction,
} from '../../lib/server-actions/zone';
import { ServiceDuration, ServicePackage, ServiceAddOn, ZoneServiceItemConfig } from '../../types/catalogue';

export type PanelKind = 'duration' | 'package' | 'addon' | 'suite';
type ApplyScope = 'this' | 'all';

const PANEL_LABELS: Record<PanelKind, string> = {
  duration: 'Durations',
  package: 'Packages',
  addon: 'Add-ons',
  suite: 'Suite',
};

// entity: null means "creating a new one"; a row means "editing that existing one". Suite has
// neither — a service always has exactly one (its own suiteId), so there's only ever an
// availability toggle to edit, never a list to create into.
type FormMode =
  | { kind: 'duration'; entity: ServiceDuration | null }
  | { kind: 'package'; entity: ServicePackage | null }
  | { kind: 'addon'; entity: ServiceAddOn | null }
  | { kind: 'suite' };

interface ServiceZoneCardProps {
  config: ZoneServiceItemConfig;
  serviceName: string;
  zoneId: string;
  zoneName: string;
  // The service's own suite (ServiceItem.suiteId) — undefined only if the service has none
  // assigned or the suite record couldn't be resolved.
  suiteId?: string;
  suiteName?: string;
  // null when this card isn't the one currently expanded — ZoneDetailView keeps only one
  // card's panel open at a time (see its togglePanel), since Duration/Package/Add-on data below
  // rides on CatalogueContext's single "currently selected service" slot, same as ServiceDetailView.
  openPanel: PanelKind | null;
  onTogglePanel: (panel: PanelKind) => void;
  onDelete: () => void;
}

export default function ServiceZoneCard({
  config,
  serviceName,
  zoneId,
  zoneName,
  suiteId,
  suiteName,
  openPanel,
  onTogglePanel,
  onDelete,
}: ServiceZoneCardProps) {
  const {
    zones,
    selectedServiceItem,
    serviceDurations,
    servicePackages,
    serviceAddOns,
    serviceDurationsLoading,
    servicePackagesLoading,
    serviceAddOnsLoading,
    zoneDurationConfigs,
    zonePackageConfigs,
    zoneAddOnConfigs,
    zoneSuiteConfigs,
    addDurationToService,
    updateDurationInService,
    addPackageToService,
    updatePackageInService,
    addAddOnToService,
    updateAddOnInService,
    refreshZoneConfigs,
  } = useCatalogue();

  const [formMode, setFormMode] = useState<FormMode | null>(null);
  const [applyScope, setApplyScope] = useState<ApplyScope>('this');
  const [suiteSaving, setSuiteSaving] = useState(false);

  // Switching which button is open (or closing the panel) always starts back at the list, never
  // stuck mid-edit on whatever was open under the previous button — adjusted during render
  // (React's documented alternative to an effect for "reset state when a prop changes"). In
  // practice the popup's backdrop blocks every other click while formMode is set, so this mostly
  // guards against future changes to that assumption rather than a reachable case today.
  const [formModeResetKey, setFormModeResetKey] = useState(openPanel);
  if (formModeResetKey !== openPanel) {
    setFormModeResetKey(openPanel);
    setFormMode(null);
  }

  // CatalogueContext only tracks ONE service's durations/packages/add-ons at a time (keyed off
  // selectedServiceItem, refetched by its own effect) — ZoneDetailView points that slot at this
  // card's service the moment its panel opens. Until the ids match AND loading has finished,
  // treat the list as empty/loading rather than risk flashing a different service's data.
  const isActiveSlot = selectedServiceItem?.id === config.serviceItemId;
  const durationsLoading = !isActiveSlot || serviceDurationsLoading;
  const packagesLoading = !isActiveSlot || servicePackagesLoading;
  const addOnsLoading = !isActiveSlot || serviceAddOnsLoading;
  const durations = isActiveSlot ? serviceDurations : [];
  const packages = isActiveSlot ? servicePackages : [];
  const addOns = isActiveSlot ? serviceAddOns : [];

  // This zone's own price override for each duration/package/add-on, if any — drives the
  // green "present in this zone" theming on every tile below.
  const durationZoneConfig = new Map(
    zoneDurationConfigs.filter((c) => c.zoneId === zoneId).map((c) => [c.serviceDurationId, c])
  );
  const packageZoneConfig = new Map(
    zonePackageConfigs.filter((c) => c.zoneId === zoneId).map((c) => [c.servicePackageId, c])
  );
  const addOnZoneConfig = new Map(
    zoneAddOnConfigs.filter((c) => c.zoneId === zoneId).map((c) => [c.serviceAddOnId, c])
  );
  // Suite has no per-service list — just this one zone's row (if any) for the service's own suite.
  const suiteZoneConfig = suiteId
    ? zoneSuiteConfigs.find((c) => c.zoneId === zoneId && c.suiteId === suiteId)
    : undefined;

  const openForm = (mode: FormMode) => {
    setApplyScope('this');
    setFormMode(mode);
  };
  const closeForm = () => setFormMode(null);

  // Writes/updates one zone-price row per target zone ('this' = just the current zone, 'all' =
  // every zone) using the exact price the admin just typed into the base entity form above —
  // no second price field to fill in. Converges every target to this price (overwriting any
  // existing override there), unlike ZoneConfigModal's "Apply to all zones" which only fills gaps.
  //
  // Calls the RAW server actions here (not the saveZone*Config context wrappers) so N target
  // zones cost exactly one refreshZoneConfigs() at the end instead of N — same reasoning as
  // ZoneConfigModal's handleApplyToAllZones. Going through the wrappers was the actual bug behind
  // "adding calls the API so many times" and the "have to refresh to see what I added" staleness:
  // N concurrent wrapper calls meant N concurrent full-app refetches racing each other, and
  // whichever one happened to resolve last (not necessarily the one reading the newest data) won.
  // refreshZoneConfigs() only refetches the 5 zone-config lists (not categories/sub-categories/
  // genders/suites/service-items/zones, and without flipping the page-wide `loading` flag).
  const syncDurationZonePrice = async (durationId: string, price: number, discountedPrice?: number | null) => {
    const targets = applyScope === 'all' ? zones : zones.filter((z) => z.id === zoneId);
    const results = await Promise.all(
      targets.map((z) => {
        const existing = zoneDurationConfigs.find((c) => c.zoneId === z.id && c.serviceDurationId === durationId);
        return saveZoneDurationConfigServerAction(existing?.id ?? null, {
          zoneId: z.id,
          serviceDurationId: durationId,
          price,
          discountedPrice: discountedPrice ?? undefined,
        });
      })
    );
    await refreshZoneConfigs();
    const failed = results.filter((r) => !r.ok).length;
    if (failed > 0) toast.error(`Zone price failed for ${failed} of ${targets.length} zone${targets.length === 1 ? '' : 's'}.`);
  };

  const syncPackageZonePrice = async (
    packageId: string,
    price: number,
    originalPrice?: number | null,
    savingsPercent?: number | null
  ) => {
    const targets = applyScope === 'all' ? zones : zones.filter((z) => z.id === zoneId);
    const results = await Promise.all(
      targets.map((z) => {
        const existing = zonePackageConfigs.find((c) => c.zoneId === z.id && c.servicePackageId === packageId);
        return saveZonePackageConfigServerAction(existing?.id ?? null, {
          zoneId: z.id,
          servicePackageId: packageId,
          price,
          originalPrice: originalPrice ?? undefined,
          savingsPercent: savingsPercent ?? undefined,
        });
      })
    );
    await refreshZoneConfigs();
    const failed = results.filter((r) => !r.ok).length;
    if (failed > 0) toast.error(`Zone price failed for ${failed} of ${targets.length} zone${targets.length === 1 ? '' : 's'}.`);
  };

  const syncAddOnZonePrice = async (addonId: string, price: number) => {
    const targets = applyScope === 'all' ? zones : zones.filter((z) => z.id === zoneId);
    const results = await Promise.all(
      targets.map((z) => {
        const existing = zoneAddOnConfigs.find((c) => c.zoneId === z.id && c.serviceAddOnId === addonId);
        return saveZoneAddOnConfigServerAction(existing?.id ?? null, { zoneId: z.id, serviceAddOnId: addonId, price });
      })
    );
    await refreshZoneConfigs();
    const failed = results.filter((r) => !r.ok).length;
    if (failed > 0) toast.error(`Zone price failed for ${failed} of ${targets.length} zone${targets.length === 1 ? '' : 's'}.`);
  };

  const handleDurationSubmit = async (dur: Omit<ServiceDuration, 'id'>) => {
    const editing = formMode?.kind === 'duration' ? formMode.entity : null;
    const res = editing
      ? await updateDurationInService(config.serviceItemId, editing.id, dur)
      : await addDurationToService(config.serviceItemId, dur);
    if (!res.ok) {
      toast.error(res.message || `Failed to ${editing ? 'update' : 'add'} duration`);
      return res;
    }
    toast.success(editing ? 'Duration updated!' : 'Duration added!');
    const durationId = editing?.id ?? res.id;
    if (durationId) await syncDurationZonePrice(durationId, dur.price, dur.discountedPrice);
    return res;
  };

  const handlePackageSubmit = async (pkg: Omit<ServicePackage, 'id'>) => {
    const editing = formMode?.kind === 'package' ? formMode.entity : null;
    const res = editing
      ? await updatePackageInService(config.serviceItemId, editing.id, pkg)
      : await addPackageToService(config.serviceItemId, pkg);
    if (!res.ok) {
      toast.error(res.message || `Failed to ${editing ? 'update' : 'add'} package`);
      return res;
    }
    toast.success(editing ? 'Package updated!' : 'Package added!');
    const packageId = editing?.id ?? res.id;
    if (packageId) await syncPackageZonePrice(packageId, pkg.price, pkg.originalPrice, pkg.savingsPercent);
    return res;
  };

  const handleAddOnSubmit = async (addon: Omit<ServiceAddOn, 'id' | 'serviceItems'>) => {
    const editing = formMode?.kind === 'addon' ? formMode.entity : null;
    const res = editing
      ? await updateAddOnInService(config.serviceItemId, editing.id, addon)
      : await addAddOnToService(config.serviceItemId, addon);
    if (!res.ok) {
      toast.error(res.message || `Failed to ${editing ? 'update' : 'add'} add-on`);
      return;
    }
    toast.success(editing ? 'Add-on updated!' : 'Add-on added!');
    const addonId = editing?.id ?? res.id;
    if (addonId) await syncAddOnZonePrice(addonId, addon.price);
  };

  // Suite has no base entity to save (it already exists — it's the service's own suiteId) and no
  // price, just an availability flag — so this both saves AND closes the popup itself, unlike the
  // three above which hand off to DurationModal/PackModal/AddOnModal's own submit/close.
  const handleSuiteSubmit = async (isAvailable: boolean) => {
    if (!suiteId) return;
    setSuiteSaving(true);
    try {
      const targets = applyScope === 'all' ? zones : zones.filter((z) => z.id === zoneId);
      const results = await Promise.all(
        targets.map((z) => {
          const existing = zoneSuiteConfigs.find((c) => c.zoneId === z.id && c.suiteId === suiteId);
          return saveZoneSuiteConfigServerAction(existing?.id ?? null, { zoneId: z.id, suiteId, isAvailable });
        })
      );
      await refreshZoneConfigs();
      const failed = results.filter((r) => !r.ok).length;
      if (failed > 0) {
        toast.error(`Zone suite availability failed for ${failed} of ${targets.length} zone${targets.length === 1 ? '' : 's'}.`);
      } else {
        toast.success('Suite availability updated!');
      }
      closeForm();
    } finally {
      setSuiteSaving(false);
    }
  };

  const formPopupTitle = (mode: FormMode): string => {
    switch (mode.kind) {
      case 'duration':
        return mode.entity ? `Edit "${mode.entity.label}"` : 'New Duration';
      case 'package':
        return mode.entity ? `Edit "${mode.entity.label}"` : 'New Package';
      case 'addon':
        return mode.entity ? `Edit "${mode.entity.name}"` : 'New Add-on';
      case 'suite':
        return `Suite Availability${suiteName ? ` — ${suiteName}` : ''}`;
    }
  };

  return (
    <div className="border border-gray-100 rounded-2xl bg-white overflow-hidden">
      <div className="px-4 py-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-gray-900 truncate">{serviceName}</div>
          <div className="text-xs text-gray-400 mt-0.5">
            {config.isAvailable ? 'Available' : 'Unavailable'} · {config.surgeMultiplier}x surge
          </div>
        </div>
        <Button
          variant="destructive"
          size="icon"
          onClick={onDelete}
          className="w-7 h-7 bg-red-50 text-red-500 hover:bg-red-100 border-none flex-shrink-0"
          title="Remove from this zone"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="px-4 pb-3 flex items-center gap-1.5">
        {(Object.keys(PANEL_LABELS) as PanelKind[]).map((panel) => (
          <button
            key={panel}
            type="button"
            onClick={() => onTogglePanel(panel)}
            className={`flex-1 inline-flex items-center justify-center gap-1 text-xs font-semibold py-1.5 rounded-lg border transition-colors ${
              openPanel === panel
                ? 'bg-[#1C1512] text-white border-[#1C1512]'
                : 'bg-[#FAF5F0] text-gray-600 border-[#F2E5D9] hover:border-[#D4A373]'
            }`}
          >
            {PANEL_LABELS[panel]}
            <ChevronDown className={`w-3 h-3 transition-transform ${openPanel === panel ? 'rotate-180' : ''}`} />
          </button>
        ))}
      </div>

      {openPanel && (
        <div className="border-t border-[#F2E5D9] bg-[#FCFAF8] p-4 animate-in fade-in duration-150">
          {openPanel === 'duration' && (
            durationsLoading ? (
              <LoadingRow label="durations" />
            ) : (
              <div className="space-y-2">
                <TileGrid>
                  {durations.map((d) => {
                    const zoneCfg = durationZoneConfig.get(d.id);
                    return (
                      <EntityTile
                        key={d.id}
                        title={d.label}
                        meta={`${d.durationMinutes} min`}
                        price={zoneCfg ? zoneCfg.price : d.price}
                        inZone={!!zoneCfg}
                        onClick={() => openForm({ kind: 'duration', entity: d })}
                      />
                    );
                  })}
                  <AddTile label="Add Duration" onClick={() => openForm({ kind: 'duration', entity: null })} />
                </TileGrid>
                {durations.length === 0 && (
                  <p className="text-[11px] text-gray-400">No durations yet — add this service&apos;s first timeslot.</p>
                )}
              </div>
            )
          )}

          {openPanel === 'package' && (
            packagesLoading ? (
              <LoadingRow label="packages" />
            ) : (
              <div className="space-y-2">
                <TileGrid>
                  {packages.map((p) => {
                    const zoneCfg = packageZoneConfig.get(p.id);
                    return (
                      <EntityTile
                        key={p.id}
                        title={p.label}
                        meta={`${p.sessions} session${p.sessions === 1 ? '' : 's'}`}
                        price={zoneCfg ? zoneCfg.price : p.price}
                        inZone={!!zoneCfg}
                        onClick={() => openForm({ kind: 'package', entity: p })}
                      />
                    );
                  })}
                  <AddTile label="Add Package" onClick={() => openForm({ kind: 'package', entity: null })} />
                </TileGrid>
                {packages.length === 0 && (
                  <p className="text-[11px] text-gray-400">No packages yet.</p>
                )}
              </div>
            )
          )}

          {openPanel === 'addon' && (
            addOnsLoading ? (
              <LoadingRow label="add-ons" />
            ) : (
              <div className="space-y-2">
                <TileGrid>
                  {addOns.map((a) => {
                    const zoneCfg = addOnZoneConfig.get(a.id);
                    return (
                      <EntityTile
                        key={a.id}
                        title={a.name}
                        meta={a.extraMinutes ? `+${a.extraMinutes} min` : undefined}
                        price={zoneCfg ? zoneCfg.price : a.price}
                        inZone={!!zoneCfg}
                        onClick={() => openForm({ kind: 'addon', entity: a })}
                      />
                    );
                  })}
                  <AddTile label="Add Add-on" onClick={() => openForm({ kind: 'addon', entity: null })} />
                </TileGrid>
                {addOns.length === 0 && (
                  <p className="text-[11px] text-gray-400">No add-ons linked to this service yet.</p>
                )}
              </div>
            )
          )}

          {openPanel === 'suite' && (
            !suiteId ? (
              <p className="text-[11px] text-gray-400">This service has no suite assigned.</p>
            ) : (
              <TileGrid>
                <SuiteTile
                  name={suiteName || 'Suite'}
                  isAvailable={!!suiteZoneConfig?.isAvailable}
                  inZone={!!suiteZoneConfig}
                  onClick={() => openForm({ kind: 'suite' })}
                />
              </TileGrid>
            )
          )}
        </div>
      )}

      {formMode && (
        <FormPopup
          title={formPopupTitle(formMode)}
          zoneName={zoneName}
          applyScope={applyScope}
          onApplyScopeChange={setApplyScope}
          onClose={closeForm}
        >
          {formMode.kind === 'duration' && (
            <DurationModal
              embedded
              isOpen
              hideZonePricing
              initialData={formMode.entity}
              onAdd={handleDurationSubmit}
              onClose={closeForm}
            />
          )}
          {formMode.kind === 'package' && (
            <PackModal
              embedded
              isOpen
              hideZonePricing
              initialData={formMode.entity}
              durations={durations}
              onAdd={handlePackageSubmit}
              onClose={closeForm}
            />
          )}
          {formMode.kind === 'addon' && (
            <AddOnModal
              embedded
              isOpen
              initialData={formMode.entity}
              onAdd={handleAddOnSubmit}
              onClose={closeForm}
            />
          )}
          {formMode.kind === 'suite' && (
            <SuiteAvailabilityForm
              initialAvailable={suiteZoneConfig?.isAvailable ?? true}
              saving={suiteSaving}
              onCancel={closeForm}
              onSave={handleSuiteSubmit}
            />
          )}
        </FormPopup>
      )}
    </div>
  );
}

function LoadingRow({ label }: { label: string }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" aria-label={`Loading ${label}...`}>
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-14 rounded-xl" />
      ))}
    </div>
  );
}

function TileGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1 -mr-1">{children}</div>;
}

function EntityTile({
  title,
  meta,
  price,
  inZone,
  onClick,
}: {
  title: string;
  meta?: string;
  price: number;
  inZone: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left p-2.5 rounded-xl border transition-colors ${
        inZone
          ? 'border-[#C8E6C9] bg-[#E8F5E9] hover:border-[#A5D6A7]'
          : 'border-gray-200 bg-white hover:border-[#D4A373] hover:bg-[#FAF5F0]/50'
      }`}
    >
      <div className={`text-xs font-semibold truncate ${inZone ? 'text-[#1B5E20]' : 'text-gray-800'}`}>{title}</div>
      {meta && <div className={`text-[10px] mt-0.5 ${inZone ? 'text-[#2E7D32]/70' : 'text-gray-400'}`}>{meta}</div>}
      <div className={`text-xs font-bold mt-1 ${inZone ? 'text-[#2E7D32]' : 'text-gray-800'}`}>
        ₹{price.toLocaleString()}
        {inZone && <span className="ml-1 text-[9px] font-normal align-middle">this zone</span>}
      </div>
    </button>
  );
}

function AddTile({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl border border-dashed border-gray-300 text-gray-400 hover:border-[#D4A373] hover:text-[#C68A4C] hover:bg-[#FAF5F0]/40 transition-colors min-h-[64px]"
    >
      <Plus className="w-3.5 h-3.5" />
      <span className="text-[10px] font-semibold text-center">{label}</span>
    </button>
  );
}

// Green only once this zone has an explicit "available" row — a row that exists but is marked
// unavailable stays in the normal (not green) theme, with the status spelled out in its meta line
// instead, since "present but turned off" isn't the same as the "not added" case would be for it.
function SuiteTile({
  name,
  isAvailable,
  inZone,
  onClick,
}: {
  name: string;
  isAvailable: boolean;
  inZone: boolean;
  onClick: () => void;
}) {
  const highlighted = inZone && isAvailable;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left p-2.5 rounded-xl border transition-colors ${
        highlighted
          ? 'border-[#C8E6C9] bg-[#E8F5E9] hover:border-[#A5D6A7]'
          : 'border-gray-200 bg-white hover:border-[#D4A373] hover:bg-[#FAF5F0]/50'
      }`}
    >
      <div className={`text-xs font-semibold truncate ${highlighted ? 'text-[#1B5E20]' : 'text-gray-800'}`}>{name}</div>
      <div className={`text-[10px] mt-0.5 ${highlighted ? 'text-[#2E7D32]/70' : 'text-gray-400'}`}>
        {inZone ? (isAvailable ? 'Available in this zone' : 'Marked unavailable here') : 'Not set for this zone'}
      </div>
    </button>
  );
}

// Standalone popup (own backdrop, fixed max-height with internal scroll) wrapping an `embedded`
// DurationModal/PackModal/AddOnModal form (or, for Suite, the small form below), with one extra
// control this Zones-page flow needs that the base modals don't offer on their own: which
// zone(s) the price/availability just entered applies to.
function FormPopup({
  title,
  zoneName,
  applyScope,
  onApplyScopeChange,
  onClose,
  children,
}: {
  title: string;
  zoneName: string;
  applyScope: ApplyScope;
  onApplyScopeChange: (scope: ApplyScope) => void;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl relative border border-gray-100 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#1C1512] text-white flex items-center justify-center hover:bg-black transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-xl font-bold text-gray-900 mb-4">{title}</h3>

        <div className="mb-5">
          <label className="text-sm font-medium text-gray-700 mb-1.5 block">Apply to</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onApplyScopeChange('this')}
              className={`flex-1 text-xs font-semibold py-2 rounded-xl border transition-colors ${
                applyScope === 'this'
                  ? 'bg-[#1C1512] text-white border-[#1C1512]'
                  : 'bg-[#FAF5F0] text-gray-600 border-[#F2E5D9] hover:border-[#D4A373]'
              }`}
            >
              This zone <span className="opacity-70">({zoneName})</span>
            </button>
            <button
              type="button"
              onClick={() => onApplyScopeChange('all')}
              className={`flex-1 text-xs font-semibold py-2 rounded-xl border transition-colors ${
                applyScope === 'all'
                  ? 'bg-[#1C1512] text-white border-[#1C1512]'
                  : 'bg-[#FAF5F0] text-gray-600 border-[#F2E5D9] hover:border-[#D4A373]'
              }`}
            >
              All zones
            </button>
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}

// Suite's own "form" — just the one flag it has. Saves and closes itself (see handleSuiteSubmit)
// rather than delegating to an embedded DurationModal/PackModal/AddOnModal like the other three.
function SuiteAvailabilityForm({
  initialAvailable,
  saving,
  onCancel,
  onSave,
}: {
  initialAvailable: boolean;
  saving: boolean;
  onCancel: () => void;
  onSave: (isAvailable: boolean) => void;
}) {
  const [available, setAvailable] = useState(initialAvailable);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(available);
      }}
      className="space-y-4"
    >
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={available}
          onChange={(e) => setAvailable(e.target.checked)}
          className="w-4 h-4 accent-[#C68A4C]"
        />
        Available in this zone
      </label>
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
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
  );
}
