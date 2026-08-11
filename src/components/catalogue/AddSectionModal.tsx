'use client';

import React, { useState } from 'react';
import { X, PlusCircle, Library } from 'lucide-react';

type AddSectionTab = 'create' | 'library';

interface AddSectionModalProps {
  isOpen: boolean;
  // e.g. "Duration" -> renders "Add Duration" title and "Create Duration" / "Choose from
  // Library" options.
  label: string;
  onClose: () => void;
  // Rendered lazily (only once its tab is active) so each embedded form mounts fresh and its own
  // "reset on open" effect fires correctly every time a tab is (re-)selected.
  renderCreate: () => React.ReactNode;
  renderLibrary: () => React.ReactNode;
}

// Single popup for the whole Add flow. Starts compact — two big option buttons, nothing else.
// Clicking one morphs those same buttons into a browser-tab strip and smoothly extends a panel
// below them; switching tabs afterward just swaps the panel in place, no closing/reopening.
export default function AddSectionModal({ isOpen, label, onClose, renderCreate, renderLibrary }: AddSectionModalProps) {
  const [activeTab, setActiveTab] = useState<AddSectionTab | null>(null);

  // Reset synchronously during render on the closed->open transition, not in a useEffect — an
  // effect-based reset still paints one frame of the PREVIOUS session's expanded tab before
  // snapping back to compact, which is exactly the open-glitch this replaces.
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) setActiveTab(null);
  }

  if (!isOpen) return null;

  const selected = activeTab !== null;
  const tabs: { key: AddSectionTab; text: string; icon: typeof PlusCircle }[] = [
    { key: 'create', text: `Create ${label}`, icon: PlusCircle },
    { key: 'library', text: 'Choose from Library', icon: Library },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-gray-100 max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 sm:px-8 pt-6 sm:pt-7 pb-1 flex-shrink-0">
          <h3 className="text-xl font-bold text-gray-900">Add {label}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#1C1512] text-white flex items-center justify-center hover:bg-black transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div
          className={`grid grid-cols-2 flex-shrink-0 transition-[gap,padding] duration-300 ease-out ${
            selected ? 'gap-1.5 px-6 sm:px-8 pt-4' : 'gap-4 sm:gap-5 px-6 sm:px-8 pt-6 pb-8'
          }`}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`cursor-pointer border transition-all duration-300 ease-out ${
                  !selected
                    ? 'flex flex-col items-center justify-center gap-3 py-8 sm:py-9 px-4 bg-[#FAF5F0] border-black/8 rounded-2xl hover:border-[#D38516]/50 hover:bg-[#F5EBDF]'
                    : isActive
                    ? 'flex items-center justify-center gap-2 py-2.5 px-4 text-xs sm:text-sm font-medium rounded-t-xl border-gray-200 border-b-0 -mb-px bg-white text-[#25180F]'
                    : 'flex items-center justify-center gap-2 py-2.5 px-4 text-xs sm:text-sm font-medium rounded-t-xl border-transparent -mb-px bg-[#FAF5F0] text-gray-500 hover:text-[#25180F]'
                }`}
              >
                {!selected && (
                  <span className="w-11 h-11 rounded-full bg-white flex items-center justify-center shadow-xs text-[#D38516] flex-shrink-0">
                    <Icon className="w-5 h-5" />
                  </span>
                )}
                <span className={!selected ? 'text-sm font-medium text-[#25180F]' : ''}>{tab.text}</span>
              </button>
            );
          })}
        </div>

        {/* Smooth grid-row expand — no key-remount, no separate entrance animation, so there's
            only ever one motion happening (the height) instead of several stacking on top of
            each other. */}
        <div
          className={`grid transition-[grid-template-rows] duration-300 ease-out flex-1 min-h-0 ${
            selected ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          }`}
        >
          <div className="overflow-hidden min-h-0">
            <div className="h-full overflow-y-auto px-6 sm:px-8 py-5 border-t border-gray-100">
              {activeTab === 'create' ? renderCreate() : activeTab === 'library' ? renderLibrary() : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
