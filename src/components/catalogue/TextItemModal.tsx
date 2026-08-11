'use client';

import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';

interface TextItemModalProps {
  isOpen: boolean;
  titleText: string;
  placeholderText?: string;
  initialValue?: string;
  // Cosmetic — every saved item is already reusable across services via the Library (which
  // aggregates directly off saved service data, see useLibrarySections), so there's no separate
  // "private" state to gate on. Shown to match the Create screen design; hide it for edit forms.
  showLibraryCheckbox?: boolean;
  // Renders just the form (no backdrop/card/close button/title) for use inside AddSectionModal's
  // "Create" tab. Standalone (non-embedded) use — the Edit flow — is unaffected.
  embedded?: boolean;
  onClose: () => void;
  onAdd: (text: string) => void | Promise<void>;
}

export default function TextItemModal({
  isOpen,
  titleText,
  placeholderText = 'Enter feature',
  initialValue = '',
  showLibraryCheckbox = true,
  embedded = false,
  onClose,
  onAdd,
}: TextItemModalProps) {
  const [content, setContent] = useState(initialValue);
  const [saveToLibrary, setSaveToLibrary] = useState(true);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setContent(initialValue || '');
      setSaveToLibrary(true);
      setSaving(false);
    }
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || saving) return;
    setSaving(true);
    try {
      await onAdd(content.trim());
      setContent('');
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const form = (
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

      {showLibraryCheckbox && (
        <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
          <input
            type="checkbox"
            checked={saveToLibrary}
            onChange={(e) => setSaveToLibrary(e.target.checked)}
            className="w-4 h-4 rounded border-gray-400 text-[#25180F] focus:ring-[#C68A4C]/30"
          />
          <span className="text-xs text-gray-700">Save this on library</span>
        </label>
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
          disabled={saving}
          className="rounded-xl px-6 bg-[#221812] text-white hover:bg-black inline-flex items-center gap-2"
        >
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </form>
  );

  if (embedded) return form;

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

        {form}
      </div>
    </div>
  );
}
