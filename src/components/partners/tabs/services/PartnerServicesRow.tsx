'use client';

import React, { useState } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { PartnerServiceItem } from '../../../../types/partner';
import { Badge } from '../../../ui/badge';
import { Button } from '../../../ui/button';
import { Input } from '../../../ui/input';

interface PartnerServicesRowProps {
  service: PartnerServiceItem;
  onUpdateService?: (serviceItemId: string, payload: { customPrice?: number; isActive?: boolean }) => Promise<void>;
  onRemoveService?: (serviceItemId: string) => Promise<void>;
}

export default function PartnerServicesRow({
  service: s,
  onUpdateService,
  onRemoveService,
}: PartnerServicesRowProps) {
  const name = s.serviceItem?.name || s.serviceItem?.cardTitle || 'Service';
  const currentPricePaise = s.customPrice ?? s.serviceItem?.durations?.[0]?.price ?? 0;

  const [editingPrice, setEditingPrice] = useState(false);
  const [newPrice, setNewPrice] = useState(String(currentPricePaise / 100));

  const handleSavePrice = async () => {
    if (!onUpdateService) return;
    const pricePaise = Math.round(parseFloat(newPrice) * 100);
    if (!isNaN(pricePaise) && pricePaise >= 0) {
      await onUpdateService(s.serviceItemId, { customPrice: pricePaise });
      setEditingPrice(false);
    }
  };

  const handleToggleActive = async () => {
    if (!onUpdateService) return;
    await onUpdateService(s.serviceItemId, { isActive: !s.isActive });
  };

  return (
    <tr className="hover:bg-gray-50/60 transition-colors">
      <td className="py-3.5 px-5">
        <p className="font-semibold text-gray-900">{name}</p>
        <p className="text-[11px] text-gray-400">ID: {s.serviceItemId.slice(-6)}</p>
      </td>
      <td className="py-3.5 px-4 font-bold text-gray-900">
        {editingPrice ? (
          <div className="flex items-center gap-1">
            <Input type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} className="w-20 h-7 text-xs px-2" />
            <Button size="sm" onClick={handleSavePrice} className="h-7 px-2 text-[11px]">Save</Button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <span>₹{(currentPricePaise / 100).toLocaleString()}</span>
            <button onClick={() => setEditingPrice(true)} className="text-gray-400 hover:text-gray-700 cursor-pointer">
              <Edit2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </td>
      <td className="py-3.5 px-4">
        <button onClick={handleToggleActive} className="cursor-pointer">
          <Badge variant={s.isActive ? 'active' : 'inactive'}>
            {s.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </button>
      </td>
      <td className="py-3.5 px-5 text-right">
        {onRemoveService && (
          <button onClick={() => onRemoveService(s.serviceItemId)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </td>
    </tr>
  );
}
