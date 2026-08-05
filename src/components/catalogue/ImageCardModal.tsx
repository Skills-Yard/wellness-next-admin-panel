'use client';

import React, { useState, useRef } from 'react';
import { X, Upload, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { uploadFileToR2 } from '../../lib/uploadToR2';
import { toast } from 'react-toastify';

interface ImageCardModalProps {
  isOpen: boolean;
  titleText: string;
  hasSubtitle?: boolean;
  initialData?: { title: string; subtitle?: string; image?: string };
  onClose: () => void;
  onAdd: (item: { title: string; subtitle?: string; description?: string; image: string }) => void;
}

export default function ImageCardModal({
  isOpen,
  titleText,
  hasSubtitle = false,
  initialData,
  onClose,
  onAdd,
}: ImageCardModalProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [subtitle, setSubtitle] = useState(initialData?.subtitle || '');
  const [imageUrl, setImageUrl] = useState<string | null>(initialData?.image || null);
  const [uploading, setUploading] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setTitle(initialData?.title || '');
      setSubtitle(initialData?.subtitle || '');
      setImageUrl(initialData?.image || null);
    }
  }, [isOpen, initialData]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size cannot exceed 5MB');
      return;
    }

    setUploading(true);
    try {
      const res = await uploadFileToR2(file, 'services', title || 'card-image');
      setImageUrl(res.url);
    } catch (err: any) {
      toast.error(`Upload error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (!imageUrl) {
      toast.error('Please upload an image');
      return;
    }

    onAdd({
      title,
      subtitle,
      description: subtitle,
      image: imageUrl,
    });

    setTitle('');
    setSubtitle('');
    setImageUrl(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-xl p-6 sm:p-8 shadow-2xl relative border border-gray-100 max-h-[90vh] overflow-y-auto">

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

        {/* Modal Title */}
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
          {titleText}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-150">
          {/* Image Upload Area */}
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
                  <img src={imageUrl} alt="Card Preview" className="max-h-24 object-contain" />
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
            <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Title<span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              placeholder="Enter title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C]"
            />
          </div>

          {hasSubtitle && (
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Subtitle / Description</label>
              <textarea
                rows={2}
                placeholder="Enter description"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C] resize-none"
              />
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl px-6"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="rounded-xl px-6 bg-[#221812] text-white hover:bg-black"
            >
              Save
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
