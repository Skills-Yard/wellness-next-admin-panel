'use client';

import React, { useState } from 'react';
import { Plus, ShoppingBag } from 'lucide-react';
import { Partner, PartnerServiceItem } from '../../../../types/partner';
import AddServiceModal from './AddServiceModal';
import PartnerServicesRow from './PartnerServicesRow';
import { Card } from '../../../ui/card';
import { Button } from '../../../ui/button';

interface PartnerServicesTabProps {
  partner: Partner;
  services: PartnerServiceItem[];
  onUpdateService?: (serviceItemId: string, payload: { customPrice?: number; isActive?: boolean }) => Promise<void>;
  onRemoveService?: (serviceItemId: string) => Promise<void>;
  onSetServices?: (serviceItemIds: string[]) => Promise<void>;
}

export default function PartnerServicesTab({
  partner,
  services,
  onUpdateService,
  onRemoveService,
  onSetServices,
}: PartnerServicesTabProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <Card className="p-6 shadow-xs space-y-5 bg-white border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-base text-gray-900">Services Offered ({services.length})</h3>
          <p className="text-xs text-gray-500 mt-0.5">Manage services and pricing assigned to this partner</p>
        </div>

        <Button size="sm" onClick={() => setIsAddModalOpen(true)} className="h-9">
          <Plus className="w-4 h-4" />
          <span>Add</span>
        </Button>
      </div>

      <div className="overflow-x-auto border border-gray-100 rounded-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/70 border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              <th className="py-3 px-5">Service Name</th>
              <th className="py-3 px-4">Price</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
            {services.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-12 text-center text-gray-400">
                  <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="font-semibold text-sm text-gray-700">No services assigned to this partner yet</p>
                </td>
              </tr>
            ) : (
              services.map((s) => (
                <PartnerServicesRow
                  key={s.serviceItemId}
                  service={s}
                  onUpdateService={onUpdateService}
                  onRemoveService={onRemoveService}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {isAddModalOpen && (
        <AddServiceModal
          isOpen={isAddModalOpen}
          partnerId={partner.id}
          existingServices={services}
          onClose={() => setIsAddModalOpen(false)}
          // onSetServices (called by the modal itself) already patches `services` state from its
          // own response — no separate refresh needed here.
          onSuccess={() => setIsAddModalOpen(false)}
          onSetServices={onSetServices}
        />
      )}
    </Card>
  );
}
