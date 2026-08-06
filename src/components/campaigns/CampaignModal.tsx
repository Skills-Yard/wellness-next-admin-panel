'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { useCampaign } from '../../contexts/CampaignContext';
import { useCatalogue } from '../../contexts/CatalogueContext';
import { uploadFileToR2 } from '../../lib/uploadToR2';
import { CampaignType, CampaignTargetType, MediaType } from '../../types/catalogue';

const CAMPAIGN_TYPES: CampaignType[] = ['SPOTLIGHT', 'HIGHLIGHT_VIDEO', 'HIGHLIGHT_BANNER', 'CAROUSEL'];
const TARGET_TYPES: CampaignTargetType[] = ['GLOBAL', 'CATEGORY', 'SUBCATEGORY'];

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// datetime-local inputs need "YYYY-MM-DDTHH:mm"; the backend returns/expects full ISO strings.
function toDateTimeLocal(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function CampaignModal() {
  const { modalOpen, editingCampaign, closeModal, saveCampaign } = useCampaign();
  const { categories, subCategories, serviceItems, zones } = useCatalogue();

  const [type, setType] = useState<CampaignType>('SPOTLIGHT');
  const [targetType, setTargetType] = useState<CampaignTargetType>('GLOBAL');
  const [categoryId, setCategoryId] = useState('');
  const [subCategoryId, setSubCategoryId] = useState('');
  const [serviceItemId, setServiceItemId] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [ctaText, setCtaText] = useState('');
  const [ctaDeeplink, setCtaDeeplink] = useState('');
  const [displayOrder, setDisplayOrder] = useState('0');
  const [isActive, setIsActive] = useState(true);
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');

  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaKey, setMediaKey] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<MediaType>('IMAGE');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isEditing = !!editingCampaign;

  useEffect(() => {
    if (editingCampaign) {
      setType(editingCampaign.type);
      setTargetType(editingCampaign.targetType);
      setCategoryId(editingCampaign.categoryId || '');
      setSubCategoryId(editingCampaign.subCategoryId || '');
      setServiceItemId(editingCampaign.serviceItemId || '');
      setZoneId(editingCampaign.zoneId || '');
      setTitle(editingCampaign.title || '');
      setSubtitle(editingCampaign.subtitle || '');
      setCtaText(editingCampaign.ctaText || '');
      setCtaDeeplink(editingCampaign.ctaDeeplink || '');
      setDisplayOrder(String(editingCampaign.displayOrder ?? 0));
      setIsActive(editingCampaign.isActive);
      setStartsAt(toDateTimeLocal(editingCampaign.startsAt));
      setEndsAt(toDateTimeLocal(editingCampaign.endsAt));
      setMediaUrl(editingCampaign.cdnUrl || null);
      setMediaKey(editingCampaign.s3Key || null);
      setMediaType(editingCampaign.mediaType);
    } else {
      setType('SPOTLIGHT');
      setTargetType('GLOBAL');
      setCategoryId('');
      setSubCategoryId('');
      setServiceItemId('');
      setZoneId('');
      setTitle('');
      setSubtitle('');
      setCtaText('');
      setCtaDeeplink('');
      setDisplayOrder('0');
      setIsActive(true);
      setStartsAt('');
      setEndsAt('');
      setMediaUrl(null);
      setMediaKey(null);
      setMediaType('IMAGE');
    }
  }, [editingCampaign, modalOpen]);

  if (!modalOpen) return null;

  // Sub-categories under the picked category; service items narrowed by whichever of
  // category/sub-category is selected (service item targeting is independent of targetType).
  const subCategoryOptions = subCategories.filter(s => s.categoryId === categoryId);
  const serviceItemOptions = subCategoryId
    ? serviceItems.filter(s => s.subCategoryId === subCategoryId)
    : categoryId
    ? serviceItems.filter(s => subCategories.find(sc => sc.id === s.subCategoryId)?.categoryId === categoryId)
    : serviceItems;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size cannot exceed 5MB');
      return;
    }

    setUploading(true);
    try {
      const result = await uploadFileToR2(file, 'campaigns', slugify(title) || 'campaign');
      setMediaUrl(result.url);
      setMediaKey(result.r2Key || result.url);
      setMediaType(file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE');
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (targetType === 'CATEGORY' && !categoryId) {
      toast.error('Please select a category');
      return;
    }
    if (targetType === 'SUBCATEGORY' && !subCategoryId) {
      toast.error('Please select a sub-category');
      return;
    }
    if (!mediaKey) {
      toast.error('Please upload campaign media');
      return;
    }

    setSaving(true);
    try {
      const res = await saveCampaign(editingCampaign?.id || null, {
        type,
        targetType,
        // Explicit null (not undefined) so clearing one of these on an existing campaign
        // actually clears it — Prisma's update() ignores omitted keys instead of nulling them.
        categoryId: categoryId || null,
        subCategoryId: subCategoryId || null,
        serviceItemId: serviceItemId || null,
        zoneId: zoneId || null,
        title: title || null,
        subtitle: subtitle || null,
        mediaType,
        s3Key: mediaKey,
        cdnUrl: mediaUrl || null,
        ctaText: ctaText || null,
        ctaDeeplink: ctaDeeplink || null,
        displayOrder: Number(displayOrder) || 0,
        isActive,
        // Left as `undefined` (not null) deliberately: the backend applies @Type(() => Date) to
        // these two, and class-transformer's Date coercion has inconsistent handling of a literal
        // null across versions (some produce `new Date(null)` = 1970-01-01 instead of clearing
        // it) — worse than the original bug. Clearing a schedule date isn't fixed by this pass.
        startsAt: startsAt ? new Date(startsAt).toISOString() : undefined,
        endsAt: endsAt ? new Date(endsAt).toISOString() : undefined,
      });

      if (res.ok) {
        toast.success(`Campaign ${isEditing ? 'updated' : 'created'} successfully!`);
        closeModal();
      } else {
        toast.error(`Failed to save campaign: ${res.message || 'Server error'}`);
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message || 'Operation failed'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-2xl p-8 shadow-2xl relative border border-gray-100 max-h-[90vh] overflow-y-auto">
        <button
          onClick={closeModal}
          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-[#1C1512] text-white flex items-center justify-center hover:bg-black transition-transform active:scale-95 shadow-md"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-semibold text-gray-900 tracking-tight mb-8">
          {isEditing ? 'Edit Campaign' : 'New Campaign'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Media Upload */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Campaign Media<span className="text-red-500">*</span></label>
            <input type="file" ref={fileInputRef} accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
            <div
              className="h-40 bg-[#FAF5F0] rounded-2xl border border-[#F2E5D9] flex flex-col items-center justify-center text-center p-4 cursor-pointer hover:border-[#D4A373] transition-colors relative overflow-hidden group"
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <div className="flex flex-col items-center justify-center text-[#D4A373] gap-2">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="text-xs font-semibold">Uploading...</span>
                </div>
              ) : mediaUrl ? (
                <div className="w-full h-full relative flex items-center justify-center">
                  {mediaType === 'VIDEO' ? (
                    <video src={mediaUrl} className="max-h-28 object-contain" muted />
                  ) : (
                    <img src={mediaUrl} alt="Campaign" className="max-h-28 object-contain" />
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
                  <span className="text-xs font-semibold text-gray-800 mb-0.5">Upload Media</span>
                  <span className="text-[11px] text-gray-400">PNG, JPG, MP4 up to 5MB</span>
                </>
              )}
            </div>
          </div>

          {/* Type & Target Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Campaign Type<span className="text-red-500">*</span></label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as CampaignType)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C] bg-white"
              >
                {CAMPAIGN_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Target Audience</label>
              <select
                value={targetType}
                onChange={(e) => setTargetType(e.target.value as CampaignTargetType)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C] bg-white"
              >
                {TARGET_TYPES.map(t => <option key={t} value={t}>{t === 'GLOBAL' ? 'Global (all categories)' : t === 'CATEGORY' ? 'Category' : 'Sub-Category'}</option>)}
              </select>
            </div>
          </div>

          {/* Category / Sub-Category — optional and independent of targetType, same as Service
              Item/Zone below (schema has categoryId/subCategoryId as nullable regardless of
              targetType). Required only when targetType demands them. */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Category {targetType === 'CATEGORY' || targetType === 'SUBCATEGORY' ? <span className="text-red-500">*</span> : <span className="text-gray-400 font-normal">(optional)</span>}
              </label>
              <select
                value={categoryId}
                onChange={(e) => { setCategoryId(e.target.value); setSubCategoryId(''); }}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C] bg-white"
              >
                <option value="">{targetType === 'GLOBAL' ? 'None' : 'Select category...'}</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Sub-Category {targetType === 'SUBCATEGORY' ? <span className="text-red-500">*</span> : <span className="text-gray-400 font-normal">(optional)</span>}
              </label>
              <select
                value={subCategoryId}
                onChange={(e) => setSubCategoryId(e.target.value)}
                disabled={!categoryId}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C] bg-white disabled:opacity-50"
              >
                <option value="">{categoryId ? 'None' : 'Select category first'}</option>
                {subCategoryOptions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          {/* Service Item (optional, independent of targetType) & Zone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Service Item <span className="text-gray-400 font-normal">(optional)</span></label>
              <select
                value={serviceItemId}
                onChange={(e) => setServiceItemId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C] bg-white"
              >
                <option value="">None</option>
                {serviceItemOptions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Zone <span className="text-gray-400 font-normal">(optional)</span></label>
              <select
                value={zoneId}
                onChange={(e) => setZoneId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C] bg-white"
              >
                <option value="">All zones</option>
                {zones.map(z => <option key={z.id} value={z.id}>{z.name} ({z.city})</option>)}
              </select>
            </div>
          </div>

          {/* Title & Subtitle */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Title</label>
              <input
                type="text"
                placeholder="Campaign title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C]"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Subtitle</label>
              <input
                type="text"
                placeholder="Campaign subtitle"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C]"
              />
            </div>
          </div>

          {/* CTA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">CTA Text</label>
              <input
                type="text"
                placeholder="e.g. Book Now"
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C]"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">CTA Deeplink</label>
              <input
                type="text"
                placeholder="e.g. /category/spa"
                value={ctaDeeplink}
                onChange={(e) => setCtaDeeplink(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C]"
              />
            </div>
          </div>

          {/* Display Order & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Display Order</label>
              <input
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C]"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Status</label>
              <select
                value={isActive ? 'Active' : 'Inactive'}
                onChange={(e) => setIsActive(e.target.value === 'Active')}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C] bg-white"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Schedule */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Starts At <span className="text-gray-400 font-normal">(optional)</span></label>
              <input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C]"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Ends At <span className="text-gray-400 font-normal">(optional)</span></label>
              <input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={closeModal}
              className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-[#221812] text-white font-medium text-sm hover:bg-black transition-colors shadow-md disabled:opacity-60"
            >
              {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
