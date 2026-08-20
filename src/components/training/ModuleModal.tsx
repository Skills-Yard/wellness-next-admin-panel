'use client';

import React, { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { TrainingModule } from '../../types/training';
import { TrainingModulePayload } from '../../lib/server-actions/training';

interface ModuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: TrainingModulePayload) => Promise<{ ok: boolean; message?: string }>;
  initialData?: TrainingModule | null;
  nextDisplayOrder: number;
}

export default function ModuleModal({ isOpen, onClose, onSave, initialData, nextDisplayOrder }: ModuleModalProps) {
  const [title, setTitle] = useState('');
  const [displayOrder, setDisplayOrder] = useState('1');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setTitle(initialData?.title ?? '');
    setDisplayOrder(String(initialData?.displayOrder ?? nextDisplayOrder));
    setSaving(false);
  }, [isOpen, initialData, nextDisplayOrder]);

  if (!isOpen) return null;

  const isEditing = !!initialData;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || saving) {
      if (!title.trim()) toast.error('Please enter a module title');
      return;
    }
    setSaving(true);
    try {
      const res = await onSave({ title: title.trim(), displayOrder: Number(displayOrder) || 1 });
      if (res.ok) {
        toast.success(`Module ${isEditing ? 'updated' : 'created'} successfully!`);
        onClose();
      } else {
        toast.error(res.message || `Failed to ${isEditing ? 'update' : 'create'} module`);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative border border-gray-100">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#1C1512] text-white flex items-center justify-center hover:bg-black transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-xl font-bold text-gray-900 mb-6">{isEditing ? 'Edit Module' : 'Add Module'}</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Title</label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Introduction"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C]"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Display Order</label>
            <input
              type="number"
              min={1}
              value={displayOrder}
              onChange={(e) => setDisplayOrder(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-[#221812] text-white text-sm font-medium hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 cursor-pointer"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {saving ? 'Saving...' : isEditing ? 'Update Module' : 'Add Module'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
