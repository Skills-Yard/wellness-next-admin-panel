'use client';

import React, { useState, useEffect } from 'react';
import { X, Search, Check, Loader2, Sparkles } from 'lucide-react';
import { getServiceItemsServerAction } from '../../../../lib/server-actions/service';
import { ServiceItem } from '../../../../types/catalogue';
import { PartnerServiceItem } from '../../../../types/partner';
import { Input } from '../../../ui/input';
import { Button } from '../../../ui/button';
import { Badge } from '../../../ui/badge';

interface AddServiceModalProps {
  isOpen: boolean;
  partnerId: string;
  existingServices: PartnerServiceItem[];
  onClose: () => void;
  onSuccess: () => void;
  onSetServices?: (serviceItemIds: string[]) => Promise<void>;
}

export default function AddServiceModal({
  isOpen,
  existingServices,
  onClose,
  onSuccess,
  onSetServices,
}: AddServiceModalProps) {
  const [catalogItems, setCatalogItems] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const existingIds = existingServices.map((s) => s.serviceItemId);

  useEffect(() => {
    if (isOpen) {
      loadCatalog();
      setSelectedIds(existingIds);
    }
  }, [isOpen]);

  const loadCatalog = async () => {
    setLoading(true);
    try {
      const items = await getServiceItemsServerAction();
      setCatalogItems(items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const filteredItems = catalogItems.filter((item) =>
    (item.name || item.cardTitle || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async () => {
    if (!onSetServices) return;
    setSaving(true);
    try {
      await onSetServices(selectedIds);
      onSuccess();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden border border-gray-100 flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#1C1512] flex items-center justify-center text-[#D4A373]">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base text-gray-900">Add Service from Catalog</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search catalog services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </div>

        <div className="p-4 overflow-y-auto flex-1 space-y-2 text-xs">
          {loading ? (
            <div className="py-12 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#D4A373]" />
              <span>Loading service catalog...</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-8 text-center text-gray-400">No matching services found in catalog</div>
          ) : (
            filteredItems.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              const name = item.name || item.cardTitle || 'Service';
              const pricePaise = item.durations?.[0]?.price || 0;
              return (
                <div
                  key={item.id}
                  onClick={() => toggleSelect(item.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected ? 'border-[#D4A373] bg-amber-50/40' : 'border-gray-100 hover:bg-gray-50'
                  }`}
                >
                  <div>
                    <p className="font-semibold text-gray-900">{name}</p>
                    <p className="text-[11px] text-gray-400">Base Price: ₹{(pricePaise / 100).toLocaleString()}</p>
                  </div>
                  <Badge variant={isSelected ? 'active' : 'inactive'}>
                    {isSelected && <Check className="w-3 h-3 mr-1" />}
                    {isSelected ? 'Selected' : 'Select'}
                  </Badge>
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <span className="text-xs text-gray-500 font-medium">{selectedIds.length} services selected</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />} Save Services
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
