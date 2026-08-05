'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/button';
import { FaqItem } from '../../types/catalogue';

interface FaqModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (faq: FaqItem) => void;
}

export default function FaqModal({ isOpen, onClose, onAdd }: FaqModalProps) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) return;
    onAdd({ question: question.trim(), answer: answer.trim() });
    setQuestion('');
    setAnswer('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl relative border border-gray-100">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-9 h-9 rounded-full bg-[#1C1512] text-white flex items-center justify-center hover:bg-black transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Add FAQ</h3>

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

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl px-6">
              Cancel
            </Button>
            <Button type="submit" className="rounded-xl px-6 bg-[#221812] text-white hover:bg-black">
              Add FAQ
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
