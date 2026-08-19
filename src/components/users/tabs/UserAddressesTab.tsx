'use client';

import React, { useState } from 'react';
import { Plus, Edit2, Trash2, MapPin, X } from 'lucide-react';
import { User, UserAddress } from '../../../types/user';
import { Card } from '../../ui/card';
import { useConfirm } from '../../ui/confirm-dialog';

interface UserAddressesTabProps {
  user: User;
  onAddAddress?: (dto: any) => Promise<void>;
  onUpdateAddress?: (addressId: string, dto: any) => Promise<void>;
  onDeleteAddress?: (addressId: string) => Promise<void>;
}

export default function UserAddressesTab({
  user,
  onAddAddress,
  onUpdateAddress,
  onDeleteAddress,
}: UserAddressesTabProps) {
  const confirm = useConfirm();
  const defaultAddresses: UserAddress[] = [
    {
      id: 'addr-1',
      userId: user.id,
      label: 'HOME',
      isDefault: true,
      line1: 'D-45, Green Park Extension',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110016',
      latitude: 28.5562,
      longitude: 77.2035,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'addr-2',
      userId: user.id,
      label: 'WORK',
      isDefault: false,
      line1: 'B-12, Connaught Place',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110001',
      latitude: 28.6315,
      longitude: 77.2167,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const addresses = user.addresses && user.addresses.length > 0 ? user.addresses : defaultAddresses;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);

  const [formData, setFormData] = useState({
    label: 'HOME',
    line1: '',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110016',
    isDefault: false,
  });

  const handleOpenAdd = () => {
    setEditingAddress(null);
    setFormData({ label: 'HOME', line1: '', city: 'New Delhi', state: 'Delhi', pincode: '110016', isDefault: false });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (addr: UserAddress) => {
    setEditingAddress(addr);
    setFormData({
      label: addr.label || 'HOME',
      line1: addr.line1,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      isDefault: addr.isDefault,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAddress) {
      if (onUpdateAddress) await onUpdateAddress(editingAddress.id, formData);
    } else {
      if (onAddAddress) await onAddAddress({ ...formData, latitude: 28.5562, longitude: 77.2035 });
    }
    setIsModalOpen(false);
  };

  return (
    <Card className="p-6 bg-white border-gray-100 shadow-xs space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900">Saved Addresses</h3>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#1C1512] rounded-xl hover:bg-[#2D221C] transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Address</span>
        </button>
      </div>

      <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
        {addresses.map((addr) => (
          <div
            key={addr.id}
            className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors"
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs text-gray-900">
                  {addr.customLabel || addr.label || 'Home'}
                </span>
                {addr.isDefault && (
                  <span className="px-2 py-0.5 text-[10px] font-semibold text-gray-700 bg-gray-100 rounded-md border border-gray-200">
                    Default
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-600">
                {addr.line1}
                {addr.line2 ? `, ${addr.line2}` : ''}
                {addr.landmark ? `, ${addr.landmark}` : ''}
                , {addr.city}, {addr.state} {addr.pincode}, India
              </p>
            </div>

            <div className="flex items-center gap-8 justify-between md:justify-end">
              <div className="text-left md:text-right">
                <p className="text-[11px] text-gray-400 font-medium">Zone ID</p>
                <p className="text-xs font-bold text-gray-900 mt-0.5">{addr.zoneId || '—'}</p>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 rounded-full border border-emerald-200/50">
                  Active
                </span>
                <button
                  onClick={() => handleOpenEdit(addr)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                  title="Edit address"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={async () => {
                    if (!onDeleteAddress) return;
                    const ok = await confirm({
                      title: 'Delete this address?',
                      description: `The "${addr.label}" address (${addr.line1}) will be removed. This can't be undone.`,
                    });
                    if (ok) await onDeleteAddress(addr.id);
                  }}
                  className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="Delete address"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 relative space-y-4">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-gray-900">
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Label</label>
                <select
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none"
                >
                  <option value="HOME">Home</option>
                  <option value="WORK">Work</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Address Line *</label>
                <input
                  type="text"
                  required
                  value={formData.line1}
                  onChange={(e) => setFormData({ ...formData, line1: e.target.value })}
                  placeholder="D-45, Green Park Extension"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isDefaultAddr"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <label htmlFor="isDefaultAddr" className="text-xs text-gray-700 font-medium cursor-pointer">
                  Set as default address
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#1C1512] rounded-xl hover:bg-[#2D221C]"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Card>
  );
}
