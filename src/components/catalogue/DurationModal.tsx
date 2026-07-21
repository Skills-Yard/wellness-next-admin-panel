'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { ServiceDuration } from '../../types/catalogue';

interface DurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (duration: Omit<ServiceDuration, 'id'>) => void;
}

export default function DurationModal({ isOpen, onClose, onAdd }: DurationModalProps) {
  const [label, setLabel] = useState('90 mins');
  const [minutes, setMinutes] = useState('90');
  const [price, setPrice] = useState('1199');

  if (!isOpen) return null;

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

        <h3 className="text-xl font-bold text-gray-900 mb-6">Add Duration (Timeslot)</h3>

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
              Add Duration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
