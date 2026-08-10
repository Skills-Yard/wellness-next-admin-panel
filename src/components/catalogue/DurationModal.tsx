'use client';

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { ServiceDuration } from '../../types/catalogue';

interface DurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (duration: Omit<ServiceDuration, 'id'>) => void;
  initialData?: ServiceDuration | null;
  // Cross-service durations to pick from as a starting point (create mode only).
  existingOptions?: ServiceDuration[];
  existingLoading?: boolean;
}

export default function DurationModal({
  isOpen,
  onClose,
  onAdd,
  initialData,
  existingOptions = [],
  existingLoading = false,
}: DurationModalProps) {
  const [label, setLabel] = useState('90 mins');
  const [minutes, setMinutes] = useState('90');
  const [price, setPrice] = useState('1199');
  const [pickedId, setPickedId] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLabel(initialData?.label ?? '90 mins');
      setMinutes(initialData ? String(initialData.durationMinutes) : '90');
      setPrice(initialData ? String(initialData.price) : '1199');
      setPickedId('');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const isEditing = !!initialData;

  const handlePick = (id: string) => {
    setPickedId(id);
    const picked = existingOptions.find((d) => d.id === id);
    if (picked) {
      setLabel(picked.label);
      setMinutes(String(picked.durationMinutes));
      setPrice(String(picked.price));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      label,
      durationMinutes: Number(minutes) || 90,
      price: Number(price) || 1199,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative border border-gray-100">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#1C1512] text-white flex items-center justify-center hover:bg-black transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-xl font-bold text-gray-900 mb-6">
          {isEditing ? 'Edit Duration (Timeslot)' : 'Add Duration (Timeslot)'}
        </h3>

        {!isEditing && (
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Pick from an existing duration (optional)
            </label>
            <select
              value={pickedId}
              onChange={(e) => handlePick(e.target.value)}
              disabled={existingLoading}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C] disabled:opacity-60"
            >
              <option value="">
                {existingLoading ? 'Loading existing durations...' : 'None — enter manually below'}
              </option>
              {existingOptions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label} · ₹{d.price}{d.serviceItem ? ` · ${d.serviceItem.name}` : ''}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              Selecting one fills the fields below — you can still edit them before saving.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Label</label>
            <input
              type="text"
              required
              placeholder="e.g. 90 mins"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C]"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Duration (Minutes)</label>
            <input
              type="number"
              required
              placeholder="90"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C]"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Price (₹)</label>
            <input
              type="number"
              required
              placeholder="1199"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#221812] text-white text-sm font-medium hover:bg-black"
            >
              {isEditing ? 'Update Duration' : 'Add Duration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
