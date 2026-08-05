'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
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
  const [content, setContent] = useState(initialValue);

  React.useEffect(() => {
    if (isOpen) {
      setContent(initialValue || '');
    }
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    onAdd(content.trim());
    setContent('');
    onClose();
  };

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
          {titleText}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-150">
          <div>
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
