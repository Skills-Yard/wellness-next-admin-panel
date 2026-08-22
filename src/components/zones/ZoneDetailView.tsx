'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Edit3, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { useCatalogue } from '../../contexts/CatalogueContext';
import {
  ZoneServiceItemConfig,
  ZoneDurationConfig,
  ZonePackageConfig,
  ZoneAddOnConfig,
  ZoneSuiteConfig,
} from '../../types/catalogue';
import {
  getZoneServiceItemConfigsPagedServerAction,
  getZoneDurationConfigsPagedServerAction,
  getZonePackageConfigsPagedServerAction,
  getZoneAddOnConfigsPagedServerAction,
  getZoneSuiteConfigsPagedServerAction,
} from '../../lib/server-actions/zone';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { StatusToggle } from '../ui/status-toggle';
import { useConfirm } from '../ui/confirm-dialog';
import ZoneModal from './ZoneModal';
import ZoneConfigModal from './ZoneConfigModal';
import ServiceZoneCard, { PanelKind } from './ServiceZoneCard';
import Pagination from '../shared/Pagination';

type Tab = 'services' | 'durations' | 'packages' | 'addons' | 'suites';

const CONFIG_TYPE_FOR_TAB: Record<Tab, 'service' | 'duration' | 'package' | 'addon' | 'suite'> = {
  services: 'service',
  durations: 'duration',
  packages: 'package',
  addons: 'addon',
  suites: 'suite',
};

export default function ZoneDetailView() {
  const {
    selectedZone,
    setSelectedZone,
    categories,
    subCategories,
    serviceItems,
    suites,
    setSelectedServiceItem,
    deleteZoneServiceItemConfig,
    deleteZoneDurationConfig,
    deleteZonePackageConfig,
    deleteZoneAddOnConfig,
    deleteZoneSuiteConfig,
    updateZone,
  } = useCatalogue();
  const confirm = useConfirm();

  const [tab, setTab] = useState<Tab>('services');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);

  // Which service card's Duration/Package/Add-on panel is expanded - only one at a time (see
  // ServiceZoneCard's note: they all read off CatalogueContext's single-slot selectedServiceItem).
  const [openServiceId, setOpenServiceId] = useState<string | null>(null);
  const [openPanel, setOpenPanel] = useState<PanelKind | null>(null);

  // Each of the 5 zone-config tabs is now fetched directly, zoneId-scoped and paginated, instead
  // of pulling every zone's rows into CatalogueContext (getZoneServiceItemConfigsServerAction et
  // al. via fetchAllPaginated) and filtering client-side by selectedZone.id - that was the
  // multiplicative (zones x catalog items) full-table pull this screen used to trigger on every
  // load. CatalogueContext's own full 5 lists stay alive for the other consumers that still need
  // them (ZoneConfigModal's "already configured" checks + "apply to all zones" fan-out,
  // ServiceZoneCard's per-service duration/package/add-on zone-price theming) - see each state
  // slot's own fetcher below.
  const [servicesPage, setServicesPage] = useState(1);
  const [durationsPage, setDurationsPage] = useState(1);
  const [packagesPage, setPackagesPage] = useState(1);
  const [addonsPage, setAddonsPage] = useState(1);
  const [suitesPage, setSuitesPage] = useState(1);
  // Shared across all 5 tabs - changing it resets every tab's own page back to 1.
  const [tabPageSize, setTabPageSize] = useState(10);

  const [services, setServices] = useState<ZoneServiceItemConfig[]>([]);
  const [durations, setDurations] = useState<ZoneDurationConfig[]>([]);
  const [packages, setPackages] = useState<ZonePackageConfig[]>([]);
  const [addons, setAddons] = useState<ZoneAddOnConfig[]>([]);
  const [suiteConfigs, setSuiteConfigs] = useState<ZoneSuiteConfig[]>([]);

  const [tabPagination, setTabPagination] = useState({ total: 0, totalPages: 1 });
  const [tabLoading, setTabLoading] = useState(true);

  // Counts for all 5 tab labels at once (not just the active tab) - one cheap limit:1 request per
  // type instead of pulling every row just to count them.
  const [tabCounts, setTabCounts] = useState({ services: 0, durations: 0, packages: 0, addons: 0, suites: 0 });

  const zoneId = selectedZone?.id;

  const currentPage = tab === 'services' ? servicesPage
    : tab === 'durations' ? durationsPage
    : tab === 'packages' ? packagesPage
    : tab === 'addons' ? addonsPage
    : suitesPage;
  const setCurrentPage = tab === 'services' ? setServicesPage
    : tab === 'durations' ? setDurationsPage
    : tab === 'packages' ? setPackagesPage
    : tab === 'addons' ? setAddonsPage
    : setSuitesPage;

  const fetchTabCounts = useCallback(async () => {
    if (!zoneId) return;
    const [s, d, p, a, su] = await Promise.all([
      getZoneServiceItemConfigsPagedServerAction(zoneId, 1, 1),
      getZoneDurationConfigsPagedServerAction(zoneId, 1, 1),
      getZonePackageConfigsPagedServerAction(zoneId, 1, 1),
      getZoneAddOnConfigsPagedServerAction(zoneId, 1, 1),
      getZoneSuiteConfigsPagedServerAction(zoneId, 1, 1),
    ]);
    setTabCounts({
      services: s.pagination?.total ?? 0,
      durations: d.pagination?.total ?? 0,
      packages: p.pagination?.total ?? 0,
      addons: a.pagination?.total ?? 0,
      suites: su.pagination?.total ?? 0,
    });
  }, [zoneId]);

  const fetchActiveTab = useCallback(async () => {
    if (!zoneId) return;
    setTabLoading(true);
    try {
      if (tab === 'services') {
        const res = await getZoneServiceItemConfigsPagedServerAction(zoneId, servicesPage, tabPageSize);
        setServices(res.data ?? []);
        setTabPagination({ total: res.pagination?.total ?? 0, totalPages: res.pagination?.totalPages ?? 1 });
      } else if (tab === 'durations') {
        const res = await getZoneDurationConfigsPagedServerAction(zoneId, durationsPage, tabPageSize);
        setDurations(res.data ?? []);
        setTabPagination({ total: res.pagination?.total ?? 0, totalPages: res.pagination?.totalPages ?? 1 });
      } else if (tab === 'packages') {
        const res = await getZonePackageConfigsPagedServerAction(zoneId, packagesPage, tabPageSize);
        setPackages(res.data ?? []);
        setTabPagination({ total: res.pagination?.total ?? 0, totalPages: res.pagination?.totalPages ?? 1 });
      } else if (tab === 'addons') {
        const res = await getZoneAddOnConfigsPagedServerAction(zoneId, addonsPage, tabPageSize);
        setAddons(res.data ?? []);
        setTabPagination({ total: res.pagination?.total ?? 0, totalPages: res.pagination?.totalPages ?? 1 });
      } else {
        const res = await getZoneSuiteConfigsPagedServerAction(zoneId, suitesPage, tabPageSize);
        setSuiteConfigs(res.data ?? []);
        setTabPagination({ total: res.pagination?.total ?? 0, totalPages: res.pagination?.totalPages ?? 1 });
      }
    } finally {
      setTabLoading(false);
    }
  }, [zoneId, tab, servicesPage, durationsPage, packagesPage, addonsPage, suitesPage, tabPageSize]);

  // Reset every tab's own page back to 1 whenever the zone changes (switching zones shouldn't
  // carry over "page 3" from whatever zone was open before) and refetch the 5 tab counts.
  useEffect(() => {
    setServicesPage(1);
    setDurationsPage(1);
    setPackagesPage(1);
    setAddonsPage(1);
    setSuitesPage(1);
    fetchTabCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoneId]);

  useEffect(() => {
    fetchActiveTab();
  }, [fetchActiveTab]);

  // Called after any add/edit/delete that touches a zone-config row - refreshes both the active
  // tab's own page and every tab's count.
  const refreshAfterMutation = useCallback(async () => {
    await Promise.all([fetchActiveTab(), fetchTabCounts()]);
  }, [fetchActiveTab, fetchTabCounts]);

  const changePageSize = (size: number) => {
    setTabPageSize(size);
    setServicesPage(1);
    setDurationsPage(1);
    setPackagesPage(1);
    setAddonsPage(1);
    setSuitesPage(1);
  };

  const togglePanel = (serviceItemId: string, panel: PanelKind) => {
    if (openServiceId === serviceItemId && openPanel === panel) {
      setOpenServiceId(null);
      setOpenPanel(null);
      return;
    }
    setOpenServiceId(serviceItemId);
    setOpenPanel(panel);
    setSelectedServiceItem(serviceItems.find((s) => s.id === serviceItemId) ?? null);
  };

  if (!selectedZone) return null;

  // Duration/package/add-on rows only carry the sub-entity's own label ("90 mins", "4 Sessions")
  // - resolve the parent service item's name too so two services sharing a label aren't confused.
  const serviceNameFor = (serviceItemId?: string) =>
    serviceItems.find((s) => s.id === serviceItemId)?.name;

  // A service's suite (ServiceItem.suiteId) - resolved here so ServiceZoneCard's Suite button
  // doesn't need its own copy of `suites` just to look up one name.
  const suiteForServiceItem = (serviceItemId?: string) => {
    const svc = serviceItems.find((s) => s.id === serviceItemId);
    if (!svc) return undefined;
    return suites.find((s) => s.id === svc.suiteId);
  };

  // Group the Services tab's rows (this page only - grouping happens after pagination, so a
  // category header can repeat across pages) by category (same "category-wise <select>"
  // grouping as ZoneConfigModal) so the tab reads as a catalogue browse instead of a flat,
  // unordered list.
  const serviceCategoryGroups = categories
    .map((cat) => ({
      categoryName: cat.name,
      configs: services.filter((c) => {
        const svc = serviceItems.find((s) => s.id === c.serviceItemId);
        const subCat = svc && subCategories.find((sc) => sc.id === svc.subCategoryId);
        return subCat?.categoryId === cat.id;
      }),
    }))
    .filter((group) => group.configs.length > 0);
  const groupedConfigIds = new Set(serviceCategoryGroups.flatMap((g) => g.configs.map((c) => c.id)));
  const ungroupedConfigs = services.filter((c) => !groupedConfigIds.has(c.id));
  if (ungroupedConfigs.length > 0) {
    serviceCategoryGroups.push({ categoryName: 'Other', configs: ungroupedConfigs });
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'services', label: 'Services', count: tabCounts.services },
    { key: 'durations', label: 'Durations', count: tabCounts.durations },
    { key: 'packages', label: 'Packages', count: tabCounts.packages },
    { key: 'addons', label: 'Add-ons', count: tabCounts.addons },
    { key: 'suites', label: 'Suites', count: tabCounts.suites },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-300 w-full">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSelectedZone(null)}
          className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight truncate">{selectedZone.name}</h1>
          <p className="text-xs md:text-sm text-gray-500 mt-0.5">
            {selectedZone.city} &middot; {selectedZone.hexes?.length ?? 0} hex cells
          </p>
        </div>
        <StatusToggle
          isActive={selectedZone.isActive !== false}
          busy={togglingStatus}
          onToggle={async () => {
            const nextActive = !(selectedZone.isActive !== false);
            setTogglingStatus(true);
            try {
              const res = await updateZone(selectedZone.id, { isActive: nextActive });
              if (res.ok) toast.success(`Zone marked ${nextActive ? 'active' : 'inactive'}`);
              else toast.error(res.message || 'Failed to update status');
            } finally {
              setTogglingStatus(false);
            }
          }}
        />
        <Button variant="outline" size="icon" onClick={() => setEditModalOpen(true)} title="Edit Zone">
          <Edit3 className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-100 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              tab === t.key ? 'border-[#C68A4C] text-[#C68A4C]' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {t.label} <span className="text-xs text-gray-400">({t.count})</span>
          </button>
        ))}
      </div>

      <Card className="w-full">
        <div className="bg-[#FAF5F0] px-4 sm:px-6 py-4 border-b border-[#F2E5D9] flex items-center justify-between">
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
            {tabs.find((t) => t.key === tab)?.label}
          </span>
          <Button
            size="sm"
            onClick={() => setConfigModalOpen(true)}
            className="bg-[#1C1512] text-white hover:bg-black h-8 px-3"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </Button>
        </div>

        <div className="divide-y divide-gray-100">
          {tabLoading ? (
            <div className="p-6 text-center text-xs text-gray-400">Loading...</div>
          ) : (
            <>
              {tab === 'services' && (
                services.length === 0 ? (
                  <EmptyRow label="service availability overrides" />
                ) : (
                  <div className="p-4 sm:p-6 space-y-6">
                    {serviceCategoryGroups.map((group) => (
                      <div key={group.categoryName}>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                          {group.categoryName} <span className="text-gray-300">({group.configs.length})</span>
                        </h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                          {group.configs.map((c) => {
                            const suite = suiteForServiceItem(c.serviceItemId);
                            return (
                              <ServiceZoneCard
                                key={c.id}
                                config={c}
                                serviceName={c.serviceItem?.name || serviceNameFor(c.serviceItemId) || c.serviceItemId}
                                zoneId={selectedZone.id}
                                zoneName={selectedZone.name}
                                suiteId={suite?.id}
                                suiteName={suite?.name}
                                openPanel={openServiceId === c.serviceItemId ? openPanel : null}
                                onTogglePanel={(panel) => togglePanel(c.serviceItemId, panel)}
                                onDelete={async () => {
                                  const ok = await confirm({
                                    title: 'Remove this service from the zone?',
                                    description: `Availability, surge and every duration/package price override for "${c.serviceItem?.name || serviceNameFor(c.serviceItemId) || 'this service'}" in "${selectedZone.name}" will be removed. This can't be undone.`,
                                  });
                                  if (!ok) return;
                                  const res = await deleteZoneServiceItemConfig(c.id);
                                  if (res.ok) { toast.success('Removed'); await refreshAfterMutation(); }
                                  else toast.error(res.message || 'Failed to remove');
                                }}
                              />
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {tab === 'durations' && (
                durations.length === 0 ? (
                  <EmptyRow label="duration price overrides" />
                ) : (
                  durations.map((c) => (
                    <ConfigRow
                      key={c.id}
                      title={`${serviceNameFor(c.serviceDuration?.serviceItemId) || 'Unknown service'} - ${c.serviceDuration?.label || c.serviceDurationId}`}
                      subtitle={`₹${c.price.toLocaleString()}${c.discountedPrice ? ` (₹${c.discountedPrice.toLocaleString()} discounted)` : ''}`}
                      onDelete={async () => {
                        const res = await deleteZoneDurationConfig(c.id);
                        if (res.ok) { toast.success('Removed'); await refreshAfterMutation(); }
                        else toast.error(res.message || 'Failed to remove');
                      }}
                    />
                  ))
                )
              )}

              {tab === 'packages' && (
                packages.length === 0 ? (
                  <EmptyRow label="package price overrides" />
                ) : (
                  packages.map((c) => (
                    <ConfigRow
                      key={c.id}
                      title={`${serviceNameFor(c.servicePackage?.serviceItemId) || 'Unknown service'} - ${c.servicePackage?.label || c.servicePackageId}`}
                      subtitle={`₹${c.price.toLocaleString()}`}
                      onDelete={async () => {
                        const res = await deleteZonePackageConfig(c.id);
                        if (res.ok) { toast.success('Removed'); await refreshAfterMutation(); }
                        else toast.error(res.message || 'Failed to remove');
                      }}
                    />
                  ))
                )
              )}

              {tab === 'addons' && (
                addons.length === 0 ? (
                  <EmptyRow label="add-on price overrides" />
                ) : (
                  addons.map((c) => (
                    <ConfigRow
                      key={c.id}
                      title={c.serviceAddOn?.name || c.serviceAddOnId}
                      subtitle={`₹${c.price.toLocaleString()}`}
                      onDelete={async () => {
                        const res = await deleteZoneAddOnConfig(c.id);
                        if (res.ok) { toast.success('Removed'); await refreshAfterMutation(); }
                        else toast.error(res.message || 'Failed to remove');
                      }}
                    />
                  ))
                )
              )}

              {tab === 'suites' && (
                suiteConfigs.length === 0 ? (
                  <EmptyRow label="suite availability overrides" />
                ) : (
                  suiteConfigs.map((c) => (
                    <ConfigRow
                      key={c.id}
                      title={c.suite?.name || c.suiteId}
                      subtitle={c.isAvailable ? 'Available' : 'Unavailable'}
                      onDelete={async () => {
                        const res = await deleteZoneSuiteConfig(c.id);
                        if (res.ok) { toast.success('Removed'); await refreshAfterMutation(); }
                        else toast.error(res.message || 'Failed to remove');
                      }}
                    />
                  ))
                )
              )}
            </>
          )}
        </div>

        {!tabLoading && tabPagination.total > 0 && (
          <Pagination
            page={currentPage}
            totalPages={tabPagination.totalPages}
            onPageChange={setCurrentPage}
            pageSize={tabPageSize}
            onPageSizeChange={changePageSize}
            pageSizeOptions={[10, 20, 50]}
            totalItems={tabPagination.total}
            className="p-4 border-t border-gray-100"
          />
        )}
      </Card>

      <ZoneModal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} mode="edit" zone={selectedZone} />
      <ZoneConfigModal
        isOpen={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        zoneId={selectedZone.id}
        configType={CONFIG_TYPE_FOR_TAB[tab]}
        onSaved={refreshAfterMutation}
      />
    </div>
  );
}

function EmptyRow({ label }: { label: string }) {
  return (
    <div className="p-6 text-center text-xs text-gray-400">
      No {label} yet. Click &quot;+ Add&quot; to create one.
    </div>
  );
}

function ConfigRow({ title, subtitle, onDelete }: { title: string; subtitle: string; onDelete: () => void }) {
  const confirm = useConfirm();
  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Remove this override?',
      description: `"${title}" will be removed from this zone. This can't be undone.`,
    });
    if (ok) onDelete();
  };
  return (
    <div className="px-4 sm:px-6 py-4 flex items-center justify-between">
      <div className="min-w-0">
        <div className="text-sm font-medium text-gray-900 truncate">{title}</div>
        <div className="text-xs text-gray-400 mt-0.5">{subtitle}</div>
      </div>
      <Button
        variant="destructive"
        size="icon"
        onClick={handleDelete}
        className="w-7 h-7 bg-red-50 text-red-500 hover:bg-red-100 border-none flex-shrink-0"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}
