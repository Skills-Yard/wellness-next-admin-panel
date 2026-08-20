'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, Loader2, Upload, Video } from 'lucide-react';
import { toast } from 'react-toastify';
import { TrainingLesson } from '../../types/training';
import { TrainingLessonPayload } from '../../lib/server-actions/training';
import { uploadFileToR2 } from '../../lib/uploadToR2';

interface LessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: TrainingLessonPayload) => Promise<{ ok: boolean; message?: string }>;
  initialData?: TrainingLesson | null;
  nextDisplayOrder: number;
}

function slugify(input: string): string {
  return input.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'lesson';
}

export default function LessonModal({ isOpen, onClose, onSave, initialData, nextDisplayOrder }: LessonModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [videoDurationSec, setVideoDurationSec] = useState('');
  const [displayOrder, setDisplayOrder] = useState('1');
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setTitle(initialData?.title ?? '');
    setContent(initialData?.content ?? '');
    setVideoUrl(initialData?.videoKey ?? null);
    setVideoDurationSec(initialData?.videoDurationSec != null ? String(initialData.videoDurationSec) : '');
    setDisplayOrder(String(initialData?.displayOrder ?? nextDisplayOrder));
    setSaving(false);
  }, [isOpen, initialData, nextDisplayOrder]);

  if (!isOpen) return null;

  const isEditing = !!initialData;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 200 * 1024 * 1024) {
      toast.error('File size cannot exceed 200MB');
      return;
    }
    setUploading(true);
    try {
      // The backend's module enum has no 'training' value yet — reusing 'app-content' as a
      // stand-in until it does (see the comment on GetUploadUrlPayload in server-actions/media.ts).
      const result = await uploadFileToR2(file, 'app-content', slugify(title));
      setVideoUrl(result.url);
      // Best-effort auto-fill — falls back to leaving whatever's already typed if the browser
      // can't read the video's metadata (e.g. an unsupported codec preview).
      const probe = document.createElement('video');
      probe.preload = 'metadata';
      probe.onloadedmetadata = () => {
        if (Number.isFinite(probe.duration)) setVideoDurationSec(String(Math.round(probe.duration)));
        URL.revokeObjectURL(probe.src);
      };
      probe.src = URL.createObjectURL(file);
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || saving) {
      if (!title.trim()) toast.error('Please enter a lesson title');
      return;
    }
    setSaving(true);
    try {
      const res = await onSave({
        title: title.trim(),
        content: content.trim() || undefined,
        videoKey: videoUrl || undefined,
        videoDurationSec: videoDurationSec.trim() !== '' ? Number(videoDurationSec) : undefined,
        displayOrder: Number(displayOrder) || 1,
      });
      if (res.ok) {
        toast.success(`Lesson ${isEditing ? 'updated' : 'created'} successfully!`);
        onClose();
      } else {
        toast.error(res.message || `Failed to ${isEditing ? 'update' : 'create'} lesson`);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl relative border border-gray-100 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#1C1512] text-white flex items-center justify-center hover:bg-black transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-xl font-bold text-gray-900 mb-6">{isEditing ? 'Edit Lesson' : 'Add Lesson'}</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Title</label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Introduction to Hair Styling"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C]"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Content</label>
            <textarea
              rows={3}
              placeholder="Lesson notes / description"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C] resize-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Video</label>
            <input type="file" ref={fileInputRef} accept="video/*" className="hidden" onChange={handleFileChange} />
            <div
              className="h-24 bg-[#FAF5F0] rounded-2xl border border-[#F2E5D9] flex items-center gap-3 px-4 cursor-pointer hover:border-[#D4A373] transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <div className="flex items-center gap-2 text-[#D4A373]">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-xs font-semibold">Uploading...</span>
                </div>
              ) : videoUrl ? (
                <>
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#D4A373] shadow-xs flex-shrink-0">
                    <Video className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-800">Video attached</p>
                    <p className="text-[11px] text-gray-400 truncate">Click to replace</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#D4A373] shadow-xs flex-shrink-0">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-800">Upload lesson video</p>
                    <p className="text-[11px] text-gray-400">MP4 up to 200MB</p>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Video Length (sec)</label>
              <input
                type="number"
                min={0}
                placeholder="900"
                value={videoDurationSec}
                onChange={(e) => setVideoDurationSec(e.target.value)}
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
              {saving ? 'Saving...' : isEditing ? 'Update Lesson' : 'Add Lesson'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
