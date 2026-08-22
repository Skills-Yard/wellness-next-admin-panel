'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit3, Trash2, ChevronRight, MapPinned, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import { useCatalogue } from '../../contexts/CatalogueContext';
import { OperationalZone } from '../../types/catalogue';
import { getZonesPagedServerAction } from '../../lib/server-actions/zone';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { SkeletonTableRows } from '../ui/skeleton';
import { StatusToggle } from '../ui/status-toggle';
import { useConfirm } from '../ui/confirm-dialog';
import ZoneModal from './ZoneModal';
import Pagination from '../shared/Pagination';

export default function ZonesView() {
  const { setSelectedZone, deleteZone, updateZone } = useCatalogue();
  const confirm = useConfirm();

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingZone, setEditingZone] = useState<OperationalZone | null>(null);
  const [togglingZoneId, setTogglingZoneId] = useState<string | null>(null);

  const [zones, setZones] = useState<OperationalZone[]>([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Debounce the search input ~350ms before it turns into a backend request.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchZones = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getZonesPagedServerAction({ page, limit: pageSize, q: search || undefined });
      setZones(res.data ?? []);
      setPagination({
        total: res.pagination?.total ?? 0,
        totalPages: res.pagination?.totalPages ?? 1,
      });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

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
      await fetchZones();
    } else {
      toast.error(`Failed to delete zone: ${res.message || 'Server error'}`);
    }
  };

  const handleToggleStatus = async (zone: OperationalZone, nextActive: boolean) => {
    setTogglingZoneId(zone.id);
    try {
      const res = await updateZone(zone.id, { isActive: nextActive });
      if (res.ok) {
        toast.success(`Zone marked ${nextActive ? 'active' : 'inactive'}`);
        setZones((prev) => prev.map((z) => (z.id === zone.id ? { ...z, isActive: nextActive } : z)));
      } else {
        toast.error(res.message || 'Failed to update status');
      }
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
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
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
        ) : zones.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#FAF5F0] text-[#C68A4C] flex items-center justify-center">
              <MapPinned className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-gray-800">
              {search ? 'No zones match your search' : 'No Zones Yet'}
            </h3>
            <p className="text-xs text-gray-500 max-w-sm">
              {search
                ? 'Try a different name or city.'
                : 'Create your first operational zone by drawing its service boundary.'}
            </p>
            {!search && (
              <Button onClick={openCreate} size="sm" className="mt-2 bg-[#1C1512] text-white">
                + Create Zone
              </Button>
            )}
          </div>
        ) : (
          <>
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
                  {zones.map((zone) => (
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

            <Pagination
              page={page}
              totalPages={pagination.totalPages}
              onPageChange={setPage}
              pageSize={pageSize}
              onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
              totalItems={pagination.total}
              itemLabel="zones"
              className="p-4 border-t border-gray-100"
            />
          </>
        )}
      </Card>

      <ZoneModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        mode={modalMode}
        zone={editingZone}
        onSaved={fetchZones}
      />
    </div>
  );
}
