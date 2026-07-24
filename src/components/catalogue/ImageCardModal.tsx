'use client';

import React, { useState, useRef } from 'react';
import { X, Plus, FileText, Upload, Loader2, Search, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'create' | 'library'>('create');

  // Create mode state
  const [title, setTitle] = useState(initialData?.title || '');
  const [subtitle, setSubtitle] = useState(initialData?.subtitle || '');
  const [imageUrl, setImageUrl] = useState<string | null>(initialData?.image || null);
  const [uploading, setUploading] = useState(false);
  const [saveToLibrary, setSaveToLibrary] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setTitle(initialData?.title || '');
      setSubtitle(initialData?.subtitle || '');
      setImageUrl(initialData?.image || null);
    }
  }, [isOpen, initialData]);

  // Library mode state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All categories');
  const [selectedLibraryItem, setSelectedLibraryItem] = useState<{ title: string; subtitle?: string; image: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sample library items
  const libraryItems = [
    { id: '1', title: 'Skin Preparation', subtitle: 'Buff away dead skin for a smoother look', image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=300&q=80', usedIn: '10 Services' },
    { id: '2', title: 'Exfoliation Therapy', subtitle: 'Deep exfoliating treatment', image: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=300&q=80', usedIn: '14 Services' },
    { id: '3', title: 'Scrub Application', subtitle: 'Nourishing care to revive radiance', image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=300&q=80', usedIn: '12 Services' },
    { id: '4', title: 'Moisture & Relief', subtitle: 'Hydrating soothing lotion', image: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=300&q=80', usedIn: '16 Services' },
  ];

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

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAdd({
      title,
      subtitle,
      description: subtitle,
      image: imageUrl || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=300&q=80',
    });

    setTitle('');
    setSubtitle('');
    setImageUrl(null);
    setSaveToLibrary(false);
    onClose();
  };

  const handleLibrarySubmit = () => {
    if (!selectedLibraryItem) return;
    onAdd({
      title: selectedLibraryItem.title,
      subtitle: selectedLibraryItem.subtitle,
      image: selectedLibraryItem.image,
    });
    setSelectedLibraryItem(null);
    onClose();
  };

  const filteredLibrary = libraryItems.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          {activeTab === 'library' ? `${titleText} Library` : titleText}
        </h3>

        {/* TOP 2 SELECTION CARDS (Matching Figma Screenshot Exactly) */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Card 1: Create Item */}
          <div
            onClick={() => setActiveTab('create')}
            className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center justify-center text-center space-y-2 ${
              activeTab === 'create'
                ? 'bg-[#FAF5F0] border-[#F2E5D9] shadow-xs'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              activeTab === 'create' ? 'bg-white text-[#C68A4C] border border-[#F2E5D9]' : 'bg-gray-100 text-gray-400'
            }`}>
              <Plus className="w-5 h-5" />
            </div>
            <div className="font-bold text-sm text-gray-900">
              Create {titleText}
            </div>
            <div className="text-xs text-gray-500 leading-snug">
              Create a new item for this service.
            </div>
          </div>

          {/* Card 2: Choose from Library */}
          <div
            onClick={() => setActiveTab('library')}
            className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center justify-center text-center space-y-2 ${
              activeTab === 'library'
                ? 'bg-[#FAF5F0] border-[#F2E5D9] shadow-xs'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              activeTab === 'library' ? 'bg-white text-[#C68A4C] border border-[#F2E5D9]' : 'bg-gray-100 text-gray-400'
            }`}>
              <FileText className="w-5 h-5" />
            </div>
            <div className="font-bold text-sm text-gray-900">
              Choose from Library
            </div>
            <div className="text-xs text-gray-500 leading-snug">
              Select existing item from library.
            </div>
          </div>
        </div>

        {/* TAB 1 CONTENT: CREATE ITEM */}
        {activeTab === 'create' && (
          <form onSubmit={handleCreateSubmit} className="space-y-4 animate-in fade-in duration-150">
            {/* Image Upload Area */}
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Image</label>
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

            {/* Checkbox: Save on library */}
            <label className="flex items-center gap-3 cursor-pointer group pt-1">
              <input
                type="checkbox"
                checked={saveToLibrary}
                onChange={(e) => setSaveToLibrary(e.target.checked)}
                className="w-5 h-5 rounded-md border-gray-300 text-[#1C1512] focus:ring-0 cursor-pointer"
              />
              <span className="text-sm text-gray-700 font-medium group-hover:text-gray-900">
                Save this item on library
              </span>
            </label>

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
        )}

        {/* TAB 2 CONTENT: CHOOSE FROM LIBRARY */}
        {activeTab === 'library' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Search & Category Filter Row */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search item"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C]"
                />
              </div>

              <div className="relative w-full sm:w-48">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C] bg-white cursor-pointer pr-10"
                >
                  <option value="All categories">All categories</option>
                  <option value="Spa">Spa</option>
                  <option value="Home Cleaning">Home Cleaning</option>
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Library Grid / Table */}
            <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-2xs divide-y divide-gray-100 bg-white">
              {filteredLibrary.map((item) => {
                const isSelected = selectedLibraryItem?.title === item.title;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedLibraryItem(item)}
                    className={`p-3 sm:p-4 flex items-center justify-between hover:bg-[#FAF9F6] transition-colors cursor-pointer ${
                      isSelected ? 'bg-[#FAF5F0]/60' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="image-card-selection"
                        checked={isSelected}
                        onChange={() => setSelectedLibraryItem(item)}
                        className="w-4 h-4 text-[#1C1512] focus:ring-0 cursor-pointer"
                      />
                      <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 text-xs sm:text-sm">{item.title}</div>
                        {item.subtitle && (
                          <div className="text-[11px] text-gray-400">{item.subtitle}</div>
                        )}
                      </div>
                    </div>

                    <div className="text-xs font-medium text-gray-500">{item.usedIn}</div>
                  </div>
                );
              })}
            </div>

            {/* Footer Pagination */}
            <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
              <span>Showing 1 to {filteredLibrary.length} of {libraryItems.length} items</span>
              <div className="flex items-center gap-2">
                <button className="w-7 h-7 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center cursor-not-allowed">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button className="w-7 h-7 rounded-full bg-[#1C1512] text-white flex items-center justify-center shadow-xs">
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

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
                type="button"
                onClick={handleLibrarySubmit}
                disabled={!selectedLibraryItem}
                className="rounded-xl px-6 bg-[#221812] text-white hover:bg-black disabled:opacity-50"
              >
                Save Selected Session
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
