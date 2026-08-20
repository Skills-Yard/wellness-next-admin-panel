'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, Upload, Loader2, Search, Check } from 'lucide-react';
import { toast } from 'react-toastify';
import { TrainingCourse } from '../../types/training';
import { TrainingCoursePayload } from '../../lib/server-actions/training';
import { uploadFileToR2 } from '../../lib/uploadToR2';
import { useCatalogue } from '../../contexts/CatalogueContext';

interface CourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: TrainingCoursePayload) => Promise<{ ok: boolean; message?: string }>;
  initialData?: TrainingCourse | null;
}

// Lightweight slug-free identifier for the upload path — courses have no slug column, so this
// just keys the R2 folder off the course id (or "new" for one that doesn't exist yet).
function slugify(input: string): string {
  return input.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'course';
}

export default function CourseModal({ isOpen, onClose, onSave, initialData }: CourseModalProps) {
  const { serviceItems } = useCatalogue();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isMandatory, setIsMandatory] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [passingScore, setPassingScore] = useState('80');
  const [estimatedMinutes, setEstimatedMinutes] = useState('60');
  const [displayOrder, setDisplayOrder] = useState('1');
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(new Set());
  const [serviceSearch, setServiceSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setTitle(initialData?.title ?? '');
    setDescription(initialData?.description ?? '');
    setThumbnailUrl(initialData?.thumbnailKey ?? null);
    setIsMandatory(initialData?.isMandatory ?? true);
    setIsActive(initialData?.isActive ?? true);
    setPassingScore(initialData?.passingScore != null ? String(initialData.passingScore) : '80');
    setEstimatedMinutes(initialData?.estimatedMinutes != null ? String(initialData.estimatedMinutes) : '60');
    setDisplayOrder(String(initialData?.displayOrder ?? 1));
    setSelectedServiceIds(new Set(initialData?.serviceIds ?? []));
    setServiceSearch('');
    setSaving(false);
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const isEditing = !!initialData;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size cannot exceed 10MB');
      return;
    }
    setUploading(true);
    try {
      // The backend's module enum has no 'training' value yet — reusing 'app-content' as a
      // stand-in until it does (see the comment on GetUploadUrlPayload in server-actions/media.ts).
      const result = await uploadFileToR2(file, 'app-content', slugify(title));
      setThumbnailUrl(result.url);
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const toggleService = (id: string) => {
    setSelectedServiceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredServices = serviceItems.filter((s) =>
    s.name.toLowerCase().includes(serviceSearch.trim().toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || saving) {
      if (!title.trim()) toast.error('Please enter a course title');
      return;
    }
    setSaving(true);
    try {
      const res = await onSave({
        title: title.trim(),
        description: description.trim() || undefined,
        thumbnailKey: thumbnailUrl || undefined,
        isMandatory,
        isActive,
        serviceIds: Array.from(selectedServiceIds),
        passingScore: passingScore.trim() !== '' ? Number(passingScore) : undefined,
        estimatedMinutes: estimatedMinutes.trim() !== '' ? Number(estimatedMinutes) : undefined,
        displayOrder: Number(displayOrder) || 1,
      });
      if (res.ok) {
        toast.success(`Course ${isEditing ? 'updated' : 'created'} successfully!`);
        onClose();
      } else {
        toast.error(res.message || `Failed to ${isEditing ? 'update' : 'create'} course`);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-2xl p-6 sm:p-8 shadow-2xl relative border border-gray-100 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#1C1512] text-white flex items-center justify-center hover:bg-black transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-xl font-bold text-gray-900 mb-6">
          {isEditing ? 'Edit Course' : 'Create Course'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-4">
            {/* Thumbnail */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-2">Thumbnail</label>
              <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleFileChange} />
              <div
                className="h-28 w-full sm:w-40 bg-[#FAF5F0] rounded-2xl border border-[#F2E5D9] flex flex-col items-center justify-center text-center p-3 cursor-pointer hover:border-[#D4A373] transition-colors relative overflow-hidden group"
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? (
                  <div className="flex flex-col items-center justify-center text-[#D4A373] gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-[11px] font-semibold">Uploading...</span>
                  </div>
                ) : thumbnailUrl ? (
                  <div className="w-full h-full relative flex items-center justify-center">
                    <img src={thumbnailUrl} alt="Thumbnail" className="max-h-20 object-contain" />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-xl">
                      <span className="text-[11px] text-white bg-black/60 px-2.5 py-1 rounded-md">Change</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#D4A373] mb-1.5 shadow-xs">
                      <Upload className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[11px] font-semibold text-gray-800">Upload</span>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Advanced Hair Styling"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C]"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
                <textarea
                  rows={2}
                  placeholder="What this course covers"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C] resize-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Passing Score (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={passingScore}
                onChange={(e) => setPassingScore(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C]"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Est. Minutes</label>
              <input
                type="number"
                min={0}
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(e.target.value)}
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
          </div>

          <div className="flex flex-wrap items-center gap-5">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isMandatory}
                onChange={(e) => setIsMandatory(e.target.checked)}
                className="w-4 h-4 rounded border-gray-400 text-[#25180F] focus:ring-[#C68A4C]/30"
              />
              <span className="text-sm text-gray-700">Mandatory for partners</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded border-gray-400 text-[#25180F] focus:ring-[#C68A4C]/30"
              />
              <span className="text-sm text-gray-700">Active</span>
            </label>
          </div>

          {/* Linked Services */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Applies to Services <span className="text-gray-400 font-normal">({selectedServiceIds.size} selected)</span>
            </label>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="relative border-b border-gray-100">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search services..."
                  value={serviceSearch}
                  onChange={(e) => setServiceSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs focus:outline-none"
                />
              </div>
              <div className="max-h-40 overflow-y-auto divide-y divide-gray-50">
                {filteredServices.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">No services found</p>
                ) : (
                  filteredServices.map((service) => {
                    const checked = selectedServiceIds.has(service.id);
                    return (
                      <label
                        key={service.id}
                        className="flex items-center justify-between gap-2 px-3.5 py-2 text-xs cursor-pointer hover:bg-[#FAF5F0]"
                      >
                        <span className="text-gray-700">{service.name}</span>
                        <span
                          className={`w-4 h-4 rounded flex items-center justify-center border flex-shrink-0 ${
                            checked ? 'bg-[#1C1512] border-[#1C1512] text-white' : 'border-gray-300'
                          }`}
                        >
                          {checked && <Check className="w-3 h-3" />}
                        </span>
                        <input type="checkbox" checked={checked} onChange={() => toggleService(service.id)} className="hidden" />
                      </label>
                    );
                  })
                )}
              </div>
            </div>
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
              disabled={saving || uploading}
              className="px-5 py-2 rounded-xl bg-[#221812] text-white text-sm font-medium hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 cursor-pointer"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {saving ? 'Saving...' : isEditing ? 'Update Course' : 'Create Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
