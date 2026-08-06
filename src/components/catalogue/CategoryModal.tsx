'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, ChevronRight, Leaf, Loader2 } from 'lucide-react';
import { useCatalogue } from '../../contexts/CatalogueContext';
import { uploadFileToR2 } from '../../lib/uploadToR2';
import { toast } from 'react-toastify';

// Matches the backend's slug regex for categories: lowercase alphanumeric, hyphen-separated.
function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

type ImageField = 'iconKey' | 'homeBannerKey';

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
  const [slugTouched, setSlugTouched] = useState(false);
  const [subtitle, setSubtitle] = useState('');
  const [displayOrder, setDisplayOrder] = useState('1');
  const [status, setStatus] = useState('Active');
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [bannerType, setBannerType] = useState<'IMAGE' | 'VIDEO'>('IMAGE');
  const [uploadingField, setUploadingField] = useState<ImageField | null>(null);
  const [saving, setSaving] = useState(false);

  const iconInputRef = useRef<HTMLInputElement | null>(null);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (modalEditData) {
      setName(modalEditData.name || '');
      setSlug(modalEditData.slug || '');
      setSlugTouched(true);
      setSubtitle(modalEditData.subtitle || '');
      setDisplayOrder(String(modalEditData.displayOrder ?? 1));
      setStatus(modalEditData.isActive !== false ? 'Active' : 'Inactive');
      setIconUrl(modalEditData.iconKey || null);
      setBannerUrl(modalEditData.homeBannerKey || null);
      setBannerType(modalEditData.homeBannerType || 'IMAGE');
    } else {
      setName('');
      setSlug('');
      setSlugTouched(false);
      setSubtitle('');
      setDisplayOrder('1');
      setStatus('Active');
      setIconUrl(null);
      setBannerUrl(null);
      setBannerType('IMAGE');
    }
  }, [modalEditData, categoryModalOpen]);

  if (!categoryModalOpen) return null;

  const isSubCategory = categoryModalMode === 'subcategory';
  const modalTitle = isSubCategory ? 'Spa Services' : 'Eezit Services';
  const moduleType = isSubCategory ? 'subcategories' : 'categories';

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  };

  const handleFileChange = async (field: ImageField, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size cannot exceed 5MB');
      return;
    }

    setUploadingField(field);
    try {
      const result = await uploadFileToR2(file, moduleType, slug || 'item');
      if (field === 'iconKey') {
        setIconUrl(result.url);
      } else {
        setBannerUrl(result.url);
        setBannerType(file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE');
      }
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      setUploadingField(null);
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
      slug: slugify(slug || name),
      title: name,
      subtitle,
      displayOrder: Number(displayOrder) || 1,
      isActive: status === 'Active',
      iconKey: iconUrl || undefined,
      homeBannerKey: bannerUrl || undefined,
      homeBannerType: bannerType,
    };

    setSaving(true);
    try {
      const res = isSubCategory ? await saveSubCategory(payload) : await saveCategory(payload);
      if (res.ok) {
        toast.success(`${isSubCategory ? 'Sub-category' : 'Category'} saved successfully!`);
        setCategoryModalOpen(false);
      } else {
        toast.error(`Failed to save ${isSubCategory ? 'sub-category' : 'category'}: ${res.message || 'Server error'}`);
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message || 'Operation failed'}`);
    } finally {
      setSaving(false);
    }
  };

  const renderUploadBox = (
    field: ImageField,
    label: string,
    hint: string,
    value: string | null,
    inputRef: React.RefObject<HTMLInputElement | null>,
    accept: string
  ) => {
    const uploading = uploadingField === field;
    return (
      <div className="flex flex-col">
        <label className="text-sm font-medium text-gray-700 mb-2">{label}</label>
        <input
          type="file"
          ref={inputRef}
          accept={accept}
          className="hidden"
          onChange={(e) => handleFileChange(field, e)}
        />
        <div
          className="h-40 bg-[#FAF5F0] rounded-2xl border border-[#F2E5D9] flex flex-col items-center justify-center text-center p-4 cursor-pointer hover:border-[#D4A373] transition-colors relative overflow-hidden group"
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? (
            <div className="flex flex-col items-center justify-center text-[#D4A373] gap-2">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-xs font-semibold">Uploading...</span>
            </div>
          ) : value ? (
            <div className="w-full h-full relative flex items-center justify-center">
              {field === 'homeBannerKey' && bannerType === 'VIDEO' ? (
                <video src={value} className="max-h-28 object-contain" muted />
              ) : (
                <img src={value} alt={label} className="max-h-28 object-contain" />
              )}
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-xl">
                <span className="text-xs text-white bg-black/60 px-3 py-1.5 rounded-md">Change</span>
              </div>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#D4A373] mb-2 shadow-xs">
                <Upload className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-gray-800 mb-0.5">Upload {label}</span>
              <span className="text-[11px] text-gray-400">{hint}</span>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-2xl p-8 shadow-2xl relative border border-gray-100 max-h-[90vh] overflow-y-auto">

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
          {/* Two Image Upload Boxes: Logo (iconKey) & Banner (homeBannerKey) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {renderUploadBox('iconKey', 'Logo', 'PNG, JPG up to 5MB', iconUrl, iconInputRef, 'image/*')}
            {renderUploadBox('homeBannerKey', 'Banner Image', 'PNG, JPG, MP4 up to 5MB', bannerUrl, bannerInputRef, 'image/*,video/*')}
          </div>

          {/* Name & Slug */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Name<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Enter service name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C] bg-white transition-all placeholder:text-gray-300"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Slug
              </label>
              <input
                type="text"
                placeholder="auto-generated-from-name"
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
                onBlur={() => setSlug(slugify(slug || name))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C] bg-white transition-all placeholder:text-gray-300"
              />
            </div>
          </div>

          {/* Subtitle Textarea */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Subtitle
            </label>
            <div className="relative">
              <textarea
                rows={4}
                maxLength={150}
                placeholder="Enter a short subtitle"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C] bg-white transition-all placeholder:text-gray-300 resize-none"
              />
              <span className="absolute bottom-3 right-4 text-xs text-gray-400 font-medium">
                {subtitle.length}/150
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
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-[#221812] text-white font-medium text-sm hover:bg-black transition-colors shadow-md disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
