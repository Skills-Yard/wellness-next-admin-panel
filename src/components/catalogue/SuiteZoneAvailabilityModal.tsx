'use client';

import React, { useState } from 'react';
import { X, Plus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { useCatalogue } from '../../contexts/CatalogueContext';
import { ServiceSuite } from '../../types/catalogue';

interface SuiteZoneAvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  suite: ServiceSuite | null;
}

// Per-suite counterpart to ZoneOverrideModal (which is keyed off a ServiceItem) — suites only
// carry ZoneSuiteConfig.isAvailable (no pricing/surge, see ZoneSuiteConfig in catalogue.ts), so
// toggling is done inline in the row instead of needing a nested edit modal.
export default function SuiteZoneAvailabilityModal({ isOpen, onClose, suite }: SuiteZoneAvailabilityModalProps) {
  const { zones, zoneSuiteConfigs, saveZoneSuiteConfig, deleteZoneSuiteConfig } = useCatalogue();

  const [zonePickerId, setZonePickerId] = useState('');
  const [addingZone, setAddingZone] = useState(false);
  const [busyRowId, setBusyRowId] = useState<string | null>(null);

  if (!isOpen || !suite) return null;

  const suiteConfigs = zoneSuiteConfigs.filter((c) => c.suiteId === suite.id);
  const configuredZoneIds = new Set(suiteConfigs.map((c) => c.zoneId));
  const availableZones = zones.filter((z) => !configuredZoneIds.has(z.id));

  const handleAddZone = async () => {
    if (!zonePickerId) return;
    setAddingZone(true);
    const res = await saveZoneSuiteConfig(null, { zoneId: zonePickerId, suiteId: suite.id, isAvailable: true });
    setAddingZone(false);
    if (res.ok) {
      toast.success('Zone added');
      setZonePickerId('');
    } else {
      toast.error(res.message || 'Failed to add zone');
    }
  };

  const handleToggle = async (configId: string, zoneId: string, next: boolean) => {
    setBusyRowId(configId);
    const res = await saveZoneSuiteConfig(configId, { zoneId, suiteId: suite.id, isAvailable: next });
    setBusyRowId(null);
    if (res.ok) toast.success(next ? 'Marked available' : 'Marked unavailable');
    else toast.error(res.message || 'Failed to update availability');
  };

  const handleRemove = async (configId: string) => {
    setBusyRowId(configId);
    const res = await deleteZoneSuiteConfig(configId);
    setBusyRowId(null);
    if (res.ok) toast.success('Zone override removed');
    else toast.error(res.message || 'Failed to remove zone override');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl relative border border-gray-100 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#1C1512] text-white flex items-center justify-center hover:bg-black transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-xl font-bold text-gray-900 mb-1">{suite.name}</h3>
        <p className="text-xs text-gray-400 mb-6">
          Zone Availability — controls whether this suite shows up in a zone&apos;s category browse flow. No pricing here.
        </p>

        <div className="flex items-center gap-2 mb-4">
          <select
            value={zonePickerId}
            onChange={(e) => setZonePickerId(e.target.value)}
            disabled={availableZones.length === 0}
            className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C] bg-white disabled:opacity-50"
          >
            <option value="">
              {availableZones.length === 0 ? 'Every zone already configured' : 'Select a zone...'}
            </option>
            {availableZones.map((z) => (
              <option key={z.id} value={z.id}>{z.name} ({z.city})</option>
            ))}
          </select>
          <button
            onClick={handleAddZone}
            disabled={!zonePickerId || addingZone}
            className="h-9 px-3 rounded-xl bg-[#1C1512] text-white text-xs font-medium flex items-center gap-1.5 hover:bg-black disabled:opacity-50 flex-shrink-0"
          >
            {addingZone ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            <span>Add Zone</span>
          </button>
        </div>

        <div className="border border-gray-100 rounded-2xl overflow-hidden">
          {suiteConfigs.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400 px-4">
              No zone overrides yet. Add a zone above to control whether this suite is available there.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {suiteConfigs.map((cfg) => {
                const z = zones.find((zone) => zone.id === cfg.zoneId);
                if (!z) return null;
                const busy = busyRowId === cfg.id;
                return (
                  <div key={cfg.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{z.name}</div>
                      <div className="text-xs text-gray-400">{z.city}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleToggle(cfg.id, cfg.zoneId, !cfg.isAvailable)}
                        disabled={busy}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold disabled:opacity-50 ${
                          cfg.isAvailable ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                        title="Click to toggle"
                      >
                        {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : cfg.isAvailable ? 'Available' : 'Unavailable'}
                      </button>
                      <button
                        onClick={() => handleRemove(cfg.id)}
                        disabled={busy}
                        className="w-7 h-7 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center disabled:opacity-50"
                        title="Remove override"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-5 mt-2">
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
