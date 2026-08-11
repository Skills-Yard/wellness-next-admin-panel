'use client';

import React, { useState } from 'react';
import { X, Loader2, UserPlus } from 'lucide-react';
import axiosInstance from '../../../lib/axios';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';

interface AddPartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddPartnerModal({ isOpen, onClose, onSuccess }: AddPartnerModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    type: 'INDIVIDUAL',
    city: 'New Delhi',
    serviceRadiusKm: 10,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await axiosInstance.post('/admin/partners', formData);
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || 'Failed to create partner.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#1C1512] flex items-center justify-center text-[#D4A373]">
              <UserPlus className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base text-gray-900">Add New Partner</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && <div className="p-3 bg-red-50 text-red-700 rounded-xl font-medium">{error}</div>}

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Full Name</label>
            <Input required placeholder="Partner name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="h-9 text-xs" />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Phone Number</label>
            <Input required placeholder="+91 9876543210" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="h-9 text-xs" />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Email Address</label>
            <Input type="email" placeholder="partner@gmail.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="h-9 text-xs" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Type</label>
              <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full h-9 px-3 border border-gray-200 rounded-xl bg-white text-xs">
                <option value="INDIVIDUAL">Individual</option>
                <option value="BUSINESS">Business</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">City</label>
              <Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="h-9 text-xs" />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" type="button" onClick={onClose}>Cancel</Button>
            <Button size="sm" type="submit" disabled={loading}>
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />} Create Partner
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
