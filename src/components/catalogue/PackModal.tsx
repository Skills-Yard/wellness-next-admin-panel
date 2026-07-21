'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { ServicePackage } from '../../types/catalogue';

interface PackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (pkg: Omit<ServicePackage, 'id'>) => void;
}

export default function PackModal({ isOpen, onClose, onAdd }: PackModalProps) {
  const [sessions, setSessions] = useState('4');
  const [price, setPrice] = useState('4319');
  const [originalPrice, setOriginalPrice] = useState('4319');
  const [savings, setSavings] = useState('480');
  const [savingsPercent, setSavingsPercent] = useState('10');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      sessions: Number(sessions) || 1,
      price: Number(price) || 0,
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      savings: savings ? Number(savings) : undefined,
      savingsPercent: savingsPercent ? Number(savingsPercent) : undefined,
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

        <h3 className="text-xl font-bold text-gray-900 mb-6">Add Session Pack</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Sessions Count</label>
            <input
              type="number"
              required
              placeholder="e.g. 4"
              value={sessions}
              onChange={(e) => setSessions(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C]"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Price (₹)</label>
            <input
              type="number"
              required
              placeholder="4319"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Original Price (₹)</label>
              <input
                type="number"
                placeholder="4319"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C]"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Savings (₹)</label>
              <input
                type="number"
                placeholder="480"
                value={savings}
                onChange={(e) => setSavings(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C]"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Savings (%)</label>
            <input
              type="number"
              placeholder="10"
              value={savingsPercent}
              onChange={(e) => setSavingsPercent(e.target.value)}
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
              Add Pack
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
