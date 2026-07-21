'use client';

import React, { useState } from 'react';
import { X, Plus, FileText, Search, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';

interface TextItemModalProps {
  isOpen: boolean;
  titleText: string;
  placeholderText?: string;
  initialValue?: string;
  onClose: () => void;
  onAdd: (text: string) => void;
}

export default function TextItemModal({
  isOpen,
  titleText,
  placeholderText = 'Enter feature',
  initialValue = '',
  onClose,
  onAdd,
}: TextItemModalProps) {
  // Tab state: 'create' | 'library'
  const [activeTab, setActiveTab] = useState<'create' | 'library'>('create');
  
  // Create mode state
  const [content, setContent] = useState(initialValue);
  const [saveToLibrary, setSaveToLibrary] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setContent(initialValue || '');
    }
  }, [isOpen, initialValue]);

  // Library mode state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All categories');
  const [selectedLibraryItem, setSelectedLibraryItem] = useState<string | null>(null);

  // Sample library items matching Figma
  const libraryItems = [
    { id: '1', text: 'Certified professional experts.', usedIn: '12 Services' },
    { id: '2', text: 'Personalized session available at your home.', usedIn: '11 Services' },
    { id: '3', text: 'Safe for all age groups.', usedIn: '14 Services' },
    { id: '4', text: 'Personalized session available at your home.', usedIn: '12 Services' },
    { id: '5', text: 'Certified professional experts.', usedIn: '16 Services' },
  ];

  if (!isOpen) return null;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    onAdd(content.trim());
    setContent('');
    setSaveToLibrary(false);
    onClose();
  };

  const handleLibrarySubmit = () => {
    if (!selectedLibraryItem) return;
    onAdd(selectedLibraryItem);
    setSelectedLibraryItem(null);
    onClose();
  };

  const filteredLibrary = libraryItems.filter(item =>
    item.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-xl p-6 sm:p-8 shadow-2xl relative border border-gray-100 max-h-[90vh] overflow-y-auto">
        
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

        {/* TOP 2 SELECTION CARDS */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Card 1: Create a section / feature */}
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
              Create a {titleText}
            </div>
            <div className="text-xs text-gray-500 leading-snug">
              Create a new {titleText.toLowerCase()} for this service.
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
              Select existing {titleText.toLowerCase()} from library.
            </div>
          </div>
        </div>

        {/* TAB 1 CONTENT: CREATE NEW SECTION */}
        {activeTab === 'create' && (
          <form onSubmit={handleCreateSubmit} className="space-y-6 animate-in fade-in duration-150">
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-2">Create {titleText}</h4>
              <div className="relative">
                <textarea
                  rows={4}
                  required
                  maxLength={100}
                  placeholder={placeholderText}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full p-4 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C] bg-white resize-none"
                />
                <span className="absolute bottom-3 right-4 text-xs text-gray-400 font-medium">
                  {content.length}/100
                </span>
              </div>
            </div>

            {/* Checkbox: Save on library */}
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={saveToLibrary}
                onChange={(e) => setSaveToLibrary(e.target.checked)}
                className="w-5 h-5 rounded-md border-gray-300 text-[#1C1512] focus:ring-0 cursor-pointer"
              />
              <span className="text-sm text-gray-700 font-medium group-hover:text-gray-900">
                Save this {titleText.toLowerCase()} on library
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
                  placeholder={`Search ${titleText.toLowerCase()}`}
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

            {/* Library Table */}
            <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAF5F0] text-gray-700 text-xs font-semibold uppercase tracking-wider border-b border-[#F2E5D9]">
                    <th className="py-3 px-4 sm:px-6">{titleText}</th>
                    <th className="py-3 px-4 sm:px-6 text-right">Used in</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-gray-700 bg-white">
                  {filteredLibrary.map((item) => {
                    const isSelected = selectedLibraryItem === item.text;
                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedLibraryItem(item.text)}
                        className={`hover:bg-[#FAF9F6] transition-colors cursor-pointer ${
                          isSelected ? 'bg-[#FAF5F0]/60' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4 sm:px-6">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="radio"
                              name="library-selection"
                              checked={isSelected}
                              onChange={() => setSelectedLibraryItem(item.text)}
                              className="w-4 h-4 text-[#1C1512] focus:ring-0 cursor-pointer"
                            />
                            <span className="font-medium text-gray-900 text-xs sm:text-sm">{item.text}</span>
                          </label>
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 text-right text-xs font-medium text-gray-500">
                          {item.usedIn}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer Pagination */}
            <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
              <span>Showing 1 to {filteredLibrary.length} of {libraryItems.length} services</span>
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
