'use client';

import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { FaqItem } from '../../types/catalogue';

interface FaqModalProps {
  isOpen: boolean;
  titleText?: string;
  initialData?: FaqItem | null;
  showLibraryCheckbox?: boolean;
  // Renders just the form (no backdrop/card/close button/title) for use inside AddSectionModal's
  // "Create" tab. Standalone (non-embedded) use — the Edit flow — is unaffected.
  embedded?: boolean;
  onClose: () => void;
  onAdd: (faq: FaqItem) => void | Promise<void>;
}

export default function FaqModal({
  isOpen,
  titleText = 'Add FAQ',
  initialData,
  showLibraryCheckbox = true,
  embedded = false,
  onClose,
  onAdd,
}: FaqModalProps) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [saveToLibrary, setSaveToLibrary] = useState(true);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setQuestion(initialData?.question || '');
      setAnswer(initialData?.answer || '');
      setSaveToLibrary(true);
      setSaving(false);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim() || saving) return;
    setSaving(true);
    try {
      await onAdd({ question: question.trim(), answer: answer.trim() });
      setQuestion('');
      setAnswer('');
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const form = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
          Question<span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          placeholder="e.g. How long does the session take?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C]"
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
          Answer<span className="text-red-500">*</span>
        </label>
        <textarea
          required
          rows={4}
          placeholder="Enter the answer..."
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#C68A4C]/30 focus:border-[#C68A4C]"
        />
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

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
        <Button type="button" variant="outline" onClick={onClose} className="rounded-xl px-6">
          Cancel
        </Button>
        <Button type="submit" disabled={saving} className="rounded-xl px-6 bg-[#221812] text-white hover:bg-black inline-flex items-center gap-2">
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {saving ? 'Saving...' : initialData ? 'Update FAQ' : 'Add FAQ'}
        </Button>
      </div>
    </form>
  );

  if (embedded) return form;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl relative border border-gray-100">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-9 h-9 rounded-full bg-[#1C1512] text-white flex items-center justify-center hover:bg-black transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">{titleText}</h3>

        {form}
      </div>
    </div>
  );
}
