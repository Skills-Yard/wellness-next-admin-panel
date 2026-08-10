'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, Upload, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { uploadFileToR2 } from '../../lib/uploadToR2';
import { toast } from 'react-toastify';
import { ServiceAddOn } from '../../types/catalogue';

interface AddOnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (addon: Omit<ServiceAddOn, 'id' | 'serviceItemId'>) => void;
  initialData?: ServiceAddOn | null;
  // Cross-service add-ons to pick from as a starting point (create mode only).
  existingOptions?: ServiceAddOn[];
  existingLoading?: boolean;
}

export default function AddOnModal({
  isOpen,
  onClose,
  onAdd,
  initialData,
  existingOptions = [],
  existingLoading = false,
}: AddOnModalProps) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [extraMinutes, setExtraMinutes] = useState('0');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pickedId, setPickedId] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(initialData?.name ?? '');
      setPrice(initialData ? String(initialData.price) : '');
      setDescription(initialData?.description ?? '');
      setExtraMinutes(initialData ? String(initialData.extraMinutes ?? 0) : '0');
      setImageUrl(initialData?.imageKey ?? null);
      setPickedId('');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const isEditing = !!initialData;

  const handlePick = (id: string) => {
    setPickedId(id);
    const picked = existingOptions.find((a) => a.id === id);
    if (picked) {
      setName(picked.name);
      setPrice(String(picked.price));
      setDescription(picked.description ?? '');
      setExtraMinutes(String(picked.extraMinutes ?? 0));
      setImageUrl(picked.imageKey ?? null);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size cannot exceed 5MB');
      return;
    }

    setUploading(true);
    try {
      const result = await uploadFileToR2(file, 'addons', name || 'addon');
      setImageUrl(result.url);
    } catch (err: any) {
      toast.error(`Upload error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setName('');
    setPrice('');
    setDescription('');
    setExtraMinutes('0');
    setImageUrl(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (!imageUrl) {
      toast.error('Please upload an add-on image');
      return;
    }
    onAdd({
      name: name.trim(),
      price: Number(price) || 0,
      description: description.trim() || undefined,
      extraMinutes: Number(extraMinutes) || 0,
      imageKey: imageUrl,
      isActive: initialData?.isActive ?? true,
    });
    reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl relative border border-gray-100 max-h-[90vh] overflow-y-auto">

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-9 h-9 rounded-full bg-[#1C1512] text-white flex items-center justify-center hover:bg-black transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
          {isEditing ? 'Edit Add-On' : 'Add-On'}
        </h3>

        {!isEditing && (
          <div className="mb-5">
            <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
              Pick from an existing add-on (optional)
            </label>
            <select
              value={pickedId}
              onChange={(e) => handlePick(e.target.value)}
              disabled={existingLoading}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C] disabled:opacity-60"
            >
              <option value="">
                {existingLoading ? 'Loading existing add-ons...' : 'None — enter manually below'}
              </option>
              {existingOptions.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} · ₹{a.price}{a.serviceItem ? ` · ${a.serviceItem.name}` : ''}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              Selecting one fills the fields below — you can still edit them before saving.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Image Upload */}
          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
              Image<span className="text-red-500">*</span>
            </label>
            <div
              className="h-32 bg-[#FAF5F0] rounded-2xl border border-[#F2E5D9] flex flex-col items-center justify-center text-center p-3 cursor-pointer hover:border-[#D4A373] transition-colors relative overflow-hidden group"
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <div className="flex flex-col items-center justify-center text-[#D4A373] gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-xs font-semibold">Uploading...</span>
                </div>
              ) : imageUrl ? (
                <div className="w-full h-full relative flex items-center justify-center">
                  <img src={imageUrl} alt="Add-on preview" className="max-h-24 object-contain" />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-xl">
                    <span className="text-xs text-white bg-black/60 px-2.5 py-1 rounded-md">Change Image</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#D4A373] mb-1 shadow-xs">
                    <Upload className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-gray-800">Upload Image</span>
                  <span className="text-[10px] text-gray-400">PNG, JPG up to 5MB</span>
                </>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Name<span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              placeholder="e.g. Meditation Session"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Price (₹)<span className="text-red-500">*</span></label>
              <input
                type="number"
                required
                placeholder="299"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Extra Minutes</label>
              <input
                type="number"
                placeholder="0"
                value={extraMinutes}
                onChange={(e) => setExtraMinutes(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Description</label>
            <textarea
              rows={2}
              placeholder="Optional description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C]"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl px-6">
              Cancel
            </Button>
            <Button type="submit" className="rounded-xl px-6 bg-[#221812] text-white hover:bg-black">
              {isEditing ? 'Update Add-on' : 'Save'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
