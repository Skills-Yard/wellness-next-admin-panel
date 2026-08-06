'use client';

import React, { useState } from 'react';
import { ArrowLeft, Edit3, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { useCatalogue } from '../../contexts/CatalogueContext';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import ZoneModal from './ZoneModal';
import ZoneConfigModal from './ZoneConfigModal';

type Tab = 'services' | 'durations' | 'packages' | 'addons';

const CONFIG_TYPE_FOR_TAB: Record<Tab, 'service' | 'duration' | 'package' | 'addon'> = {
  services: 'service',
  durations: 'duration',
  packages: 'package',
  addons: 'addon',
};

export default function ZoneDetailView() {
  const {
    selectedZone,
    setSelectedZone,
    serviceItems,
    zoneServiceItemConfigs,
    zoneDurationConfigs,
    zonePackageConfigs,
    zoneAddOnConfigs,
    deleteZoneServiceItemConfig,
    deleteZoneDurationConfig,
    deleteZonePackageConfig,
    deleteZoneAddOnConfig,
  } = useCatalogue();

  const [tab, setTab] = useState<Tab>('services');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [configModalOpen, setConfigModalOpen] = useState(false);

  if (!selectedZone) return null;

  const services = zoneServiceItemConfigs.filter((c) => c.zoneId === selectedZone.id);
  const durations = zoneDurationConfigs.filter((c) => c.zoneId === selectedZone.id);
  const packages = zonePackageConfigs.filter((c) => c.zoneId === selectedZone.id);
  const addons = zoneAddOnConfigs.filter((c) => c.zoneId === selectedZone.id);

  // Duration/package/add-on rows only carry the sub-entity's own label ("90 mins", "4 Sessions")
  // — resolve the parent service item's name too so two services sharing a label aren't confused.
  const serviceNameFor = (serviceItemId?: string) =>
    serviceItems.find((s) => s.id === serviceItemId)?.name;

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'services', label: 'Services', count: services.length },
    { key: 'durations', label: 'Durations', count: durations.length },
    { key: 'packages', label: 'Packages', count: packages.length },
    { key: 'addons', label: 'Add-ons', count: addons.length },
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
        <Badge variant={selectedZone.isActive !== false ? 'active' : 'inactive'}>
          {selectedZone.isActive !== false ? 'Active' : 'Inactive'}
        </Badge>
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
          {tab === 'services' && (
            services.length === 0 ? (
              <EmptyRow label="service availability overrides" />
            ) : (
              services.map((c) => (
                <ConfigRow
                  key={c.id}
                  title={c.serviceItem?.name || c.serviceItemId}
                  subtitle={`${c.isAvailable ? 'Available' : 'Unavailable'} · ${c.surgeMultiplier}x surge`}
                  onDelete={async () => {
                    const res = await deleteZoneServiceItemConfig(c.id);
                    if (res.ok) toast.success('Removed'); else toast.error(res.message || 'Failed to remove');
                  }}
                />
              ))
            )
          )}

          {tab === 'durations' && (
            durations.length === 0 ? (
              <EmptyRow label="duration price overrides" />
            ) : (
              durations.map((c) => (
                <ConfigRow
                  key={c.id}
                  title={`${serviceNameFor(c.serviceDuration?.serviceItemId) || 'Unknown service'} — ${c.serviceDuration?.label || c.serviceDurationId}`}
                  subtitle={`₹${c.price.toLocaleString()}${c.discountedPrice ? ` (₹${c.discountedPrice.toLocaleString()} discounted)` : ''}`}
                  onDelete={async () => {
                    const res = await deleteZoneDurationConfig(c.id);
                    if (res.ok) toast.success('Removed'); else toast.error(res.message || 'Failed to remove');
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
                  title={`${serviceNameFor(c.servicePackage?.serviceItemId) || 'Unknown service'} — ${c.servicePackage?.label || c.servicePackageId}`}
                  subtitle={`₹${c.price.toLocaleString()}`}
                  onDelete={async () => {
                    const res = await deleteZonePackageConfig(c.id);
                    if (res.ok) toast.success('Removed'); else toast.error(res.message || 'Failed to remove');
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
                  title={`${serviceNameFor(c.serviceAddOn?.serviceItemId) || 'Unknown service'} — ${c.serviceAddOn?.name || c.serviceAddOnId}`}
                  subtitle={`₹${c.price.toLocaleString()}`}
                  onDelete={async () => {
                    const res = await deleteZoneAddOnConfig(c.id);
                    if (res.ok) toast.success('Removed'); else toast.error(res.message || 'Failed to remove');
                  }}
                />
              ))
            )
          )}
        </div>
      </Card>

      <ZoneModal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} mode="edit" zone={selectedZone} />
      <ZoneConfigModal
        isOpen={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        zoneId={selectedZone.id}
        configType={CONFIG_TYPE_FOR_TAB[tab]}
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
  return (
    <div className="px-4 sm:px-6 py-4 flex items-center justify-between">
      <div className="min-w-0">
        <div className="text-sm font-medium text-gray-900 truncate">{title}</div>
        <div className="text-xs text-gray-400 mt-0.5">{subtitle}</div>
      </div>
      <Button
        variant="destructive"
        size="icon"
        onClick={onDelete}
        className="w-7 h-7 bg-red-50 text-red-500 hover:bg-red-100 border-none flex-shrink-0"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}
