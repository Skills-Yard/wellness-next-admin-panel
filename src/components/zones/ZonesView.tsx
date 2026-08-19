'use client';

import React, { useState } from 'react';
import { Plus, Edit3, Trash2, ChevronRight, MapPinned, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import { useCatalogue } from '../../contexts/CatalogueContext';
import { OperationalZone } from '../../types/catalogue';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { SkeletonTableRows } from '../ui/skeleton';
import { StatusToggle } from '../ui/status-toggle';
import { useConfirm } from '../ui/confirm-dialog';
import ZoneModal from './ZoneModal';

export default function ZonesView() {
  const { loading, zones, setSelectedZone, deleteZone, updateZone } = useCatalogue();
  const confirm = useConfirm();

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingZone, setEditingZone] = useState<OperationalZone | null>(null);
  const [togglingZoneId, setTogglingZoneId] = useState<string | null>(null);

  const filteredZones = zones.filter((z) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return z.name.toLowerCase().includes(q) || z.city.toLowerCase().includes(q);
  });

  const openCreate = () => {
    setModalMode('create');
    setEditingZone(null);
    setModalOpen(true);
  };

  const openEdit = (zone: OperationalZone) => {
    setModalMode('edit');
    setEditingZone(zone);
    setModalOpen(true);
  };

  const handleDelete = async (zone: OperationalZone) => {
    const ok = await confirm({
      title: 'Delete this zone?',
      description: `"${zone.name}" and every service/duration/package/add-on/suite availability and price override configured for it will be removed. This can't be undone.`,
    });
    if (!ok) return;
    const res = await deleteZone(zone.id);
    if (res.ok) {
      toast.success('Zone deleted successfully!');
    } else {
      toast.error(`Failed to delete zone: ${res.message || 'Server error'}`);
    }
  };

  const handleToggleStatus = async (zone: OperationalZone, nextActive: boolean) => {
    setTogglingZoneId(zone.id);
    try {
      const res = await updateZone(zone.id, { isActive: nextActive });
      if (res.ok) toast.success(`Zone marked ${nextActive ? 'active' : 'inactive'}`);
      else toast.error(res.message || 'Failed to update status');
    } finally {
      setTogglingZoneId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Zones</h1>
          <p className="text-xs md:text-sm text-gray-500 mt-0.5">Manage operational service areas and per-zone pricing</p>
        </div>
        <Button
          onClick={openCreate}
          className="self-start sm:self-auto bg-[#1C1512] hover:bg-black text-white rounded-xl shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Create Zone</span>
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search by name or city..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C] bg-white"
        />
      </div>

      <Card className="w-full">
        {loading ? (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-[#FAF5F0] text-gray-700 text-xs font-semibold uppercase tracking-wider border-b border-[#F2E5D9]">
                  <th className="py-4 px-4 sm:px-6">Zone</th>
                  <th className="py-4 px-4 sm:px-6 text-center">Coverage</th>
                  <th className="py-4 px-4 sm:px-6 text-center">Status</th>
                  <th className="py-4 px-4 sm:px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <SkeletonTableRows rows={4} columns={1} withAvatar={false} />
              </tbody>
            </table>
          </div>
        ) : filteredZones.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#FAF5F0] text-[#C68A4C] flex items-center justify-center">
              <MapPinned className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-gray-800">
              {zones.length === 0 ? 'No Zones Yet' : 'No zones match your search'}
            </h3>
            <p className="text-xs text-gray-500 max-w-sm">
              {zones.length === 0
                ? 'Create your first operational zone by drawing its service boundary.'
                : 'Try a different name or city.'}
            </p>
            {zones.length === 0 && (
              <Button onClick={openCreate} size="sm" className="mt-2 bg-[#1C1512] text-white">
                + Create Zone
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-[#FAF5F0] text-gray-700 text-xs font-semibold uppercase tracking-wider border-b border-[#F2E5D9]">
                  <th className="py-4 px-4 sm:px-6">Zone</th>
                  <th className="py-4 px-4 sm:px-6 text-center">Coverage</th>
                  <th className="py-4 px-4 sm:px-6 text-center">Status</th>
                  <th className="py-4 px-4 sm:px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {filteredZones.map((zone) => (
                  <tr
                    key={zone.id}
                    className="hover:bg-[#FAF9F6]/80 transition-colors cursor-pointer"
                    onClick={() => setSelectedZone(zone)}
                  >
                    <td className="py-4 px-4 sm:px-6">
                      <div className="font-semibold text-gray-900">{zone.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{zone.city}</div>
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-center font-medium text-gray-600">
                      {zone.hexes?.length ?? 0} hexes
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-center" onClick={(e) => e.stopPropagation()}>
                      <StatusToggle
                        isActive={zone.isActive !== false}
                        busy={togglingZoneId === zone.id}
                        onToggle={() => handleToggleStatus(zone, !(zone.isActive !== false))}
                      />
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="icon" onClick={() => openEdit(zone)} title="Edit Zone">
                          <Edit3 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDelete(zone)}
                          className="bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 border-none"
                          title="Delete Zone"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => setSelectedZone(zone)} title="Manage pricing">
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ZoneModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        mode={modalMode}
        zone={editingZone}
      />
    </div>
  );
}
