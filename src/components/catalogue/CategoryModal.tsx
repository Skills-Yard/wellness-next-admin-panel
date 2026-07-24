'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, ChevronRight, Leaf, Loader2 } from 'lucide-react';
import { useCatalogue } from '../../contexts/CatalogueContext';
import { uploadFileToR2 } from '../../lib/uploadToR2';
import { toast } from 'react-toastify';

export default function CategoryModal() {
  const { 
    categoryModalOpen, 
    setCategoryModalOpen, 
    categoryModalMode, 
    modalEditData, 
    saveCategory, 
    saveSubCategory 
  } = useCatalogue();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [displayOrder, setDisplayOrder] = useState('1');
  const [status, setStatus] = useState('Active');
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (modalEditData) {
      setName(modalEditData.name || '');
      setSlug(modalEditData.slug || '');
      setShortDescription(modalEditData.shortDescription || modalEditData.subtitle || '');
      setDisplayOrder(String(modalEditData.displayOrder || 1));
      setStatus(modalEditData.isActive ? 'Active' : 'Inactive');
      setIconUrl(modalEditData.iconKey || (modalEditData as any).homeBannerKey || null);
    } else {
      setName('');
      setSlug('');
      setShortDescription('');
      setDisplayOrder('');
      setStatus('Active');
      setIconUrl(null);
    }
  }, [modalEditData, categoryModalOpen]);

  if (!categoryModalOpen) return null;

  const isSubCategory = categoryModalMode === 'subcategory';
  const modalTitle = isSubCategory ? 'Spa Services' : 'Vellora Services';

  // Handle file upload to R2
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size cannot exceed 5MB');
      return;
    }

    setUploading(true);
    try {
      const moduleType = isSubCategory ? 'subcategories' : 'categories';
      const result = await uploadFileToR2(file, moduleType, slug || 'item');
      setIconUrl(result.url);
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Please enter a name');
      return;
    }

    const payload = {
      name,
      slug,
      subtitle: shortDescription,
      shortDescription,
      displayOrder: Number(displayOrder) || 1,
      isActive: status === 'Active',
      iconKey: iconUrl || undefined,
    };

    try {
      if (isSubCategory) {
        const res = await saveSubCategory(payload);
        if (res.ok) {
          toast.success('Sub-category saved successfully!');
          setCategoryModalOpen(false);
        } else {
          toast.error(`Failed to save sub-category: ${res.message || 'Server error'}`);
        }
      } else {
        const res = await saveCategory(payload);
        if (res.ok) {
          toast.success('Category saved successfully!');
          setCategoryModalOpen(false);
        } else {
          toast.error(`Failed to save category: ${res.message || 'Server error'}`);
        }
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message || 'Operation failed'}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-2xl p-8 shadow-2xl relative border border-gray-100">
        
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*,video/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Close Button */}
        <button
          onClick={() => setCategoryModalOpen(false)}
          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-[#1C1512] text-white flex items-center justify-center hover:bg-black transition-transform active:scale-95 shadow-md"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-2 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">
            {modalTitle}
          </h2>
          {isSubCategory && (
            <span className="text-[#C68A4C]">
              <Leaf className="w-5 h-5 fill-current" />
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Top Row: Icon Upload Box & Name / Slug */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Left Image / Icon Upload Area */}
            <div className="md:col-span-4 flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-2">Icon</label>
              <div 
                className="h-44 bg-[#FAF5F0] rounded-2xl border border-[#F2E5D9] flex flex-col items-center justify-center text-center p-4 cursor-pointer hover:border-[#D4A373] transition-colors relative overflow-hidden group"
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? (
                  <div className="flex flex-col items-center justify-center text-[#D4A373] gap-2">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-xs font-semibold">Uploading...</span>
                  </div>
                ) : iconUrl ? (
                  <div className="w-full h-full relative flex items-center justify-center">
                    <img src={iconUrl} alt="Icon Preview" className="max-h-32 object-contain" />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-xl">
                      <span className="text-xs text-white bg-black/60 px-3 py-1.5 rounded-md">Change Icon</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[#D4A373] mb-2 shadow-xs">
                      <Upload className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold text-gray-800 mb-1">Upload Icon</span>
                    <span className="text-[11px] text-gray-400">PNG, JPG up to 5MB</span>
                  </>
                )}
              </div>
            </div>

            {/* Right Form Fields: Name & Slug */}
            <div className="md:col-span-8 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Name<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter service name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C] bg-white transition-all placeholder:text-gray-300"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Slug<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter slug (e.g. spa)"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C] bg-white transition-all placeholder:text-gray-300"
                />
              </div>
            </div>
          </div>

          {/* Short Description Textarea */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Short Description
            </label>
            <div className="relative">
              <textarea
                rows={4}
                maxLength={150}
                placeholder="Enter short discription"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C] bg-white transition-all placeholder:text-gray-300 resize-none"
              />
              <span className="absolute bottom-3 right-4 text-xs text-gray-400 font-medium">
                {shortDescription.length}/150
              </span>
            </div>
          </div>

          {/* Bottom Row: Display Order & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Display Order
              </label>
              <input
                type="number"
                placeholder="Enter order"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C] bg-white transition-all placeholder:text-gray-300"
              />
              <p className="text-xs text-gray-400 mt-1.5">Lower numbers appear first</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Status
              </label>
              <div className="relative">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C] bg-white transition-all text-gray-700 cursor-pointer"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
                <ChevronRight className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setCategoryModalOpen(false)}
              className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#221812] text-white font-medium text-sm hover:bg-black transition-colors shadow-md"
            >
              Save Service
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
