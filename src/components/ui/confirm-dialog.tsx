'use client';

import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { AlertTriangle, HelpCircle, X } from 'lucide-react';

export interface ConfirmOptions {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  // 'danger' (red, for deletes) is the default — 'default' is for non-destructive confirmations
  // (e.g. "deactivate this user?") that still deserve a pause but shouldn't look like data loss.
  variant?: 'danger' | 'default';
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

// One themed confirmation modal shared by every delete (and other "are you sure?") action in the
// app, so callers don't each build their own modal + local open/pending state. Usage:
//
//   const confirm = useConfirm();
//   const ok = await confirm({ title: 'Delete Suite?', description: `"${suite.name}" and its zone
//     availability will be removed. This can't be undone.` });
//   if (!ok) return;
//   ...proceed with the delete...
export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm() must be used within <ConfirmProvider>');
  return ctx;
}

interface PendingConfirm {
  options: ConfirmOptions;
  resolve: (value: boolean) => void;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  // Guards against the resolve() firing twice (e.g. Escape + button click landing in the same
  // tick) — settle() below is the only thing allowed to close out a pending promise.
  const settled = useRef(false);

  const confirm = useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => {
      settled.current = false;
      setPending({ options, resolve });
    });
  }, []);

  const settle = (result: boolean) => {
    if (settled.current) return;
    settled.current = true;
    pending?.resolve(result);
    setPending(null);
  };

  const isDanger = (pending?.options.variant ?? 'danger') === 'danger';

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {pending && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          onClick={() => settle(false)}
          onKeyDown={(e) => e.key === 'Escape' && settle(false)}
          role="presentation"
        >
          <div
            className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative border border-gray-100"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
          >
            <button
              onClick={() => settle(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#1C1512] text-white flex items-center justify-center hover:bg-black transition-colors"
              aria-label="Cancel"
            >
              <X className="w-4 h-4" />
            </button>

            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
                isDanger ? 'bg-red-50 text-red-500' : 'bg-[#FAF5F0] text-[#C68A4C]'
              }`}
            >
              {isDanger ? <AlertTriangle className="w-6 h-6" /> : <HelpCircle className="w-6 h-6" />}
            </div>

            <h3 id="confirm-dialog-title" className="text-lg font-semibold text-gray-900 mb-1.5 pr-8">
              {pending.options.title || (isDanger ? 'Delete this?' : 'Are you sure?')}
            </h3>
            {pending.options.description && (
              <p className="text-sm text-gray-500 leading-relaxed mb-6">{pending.options.description}</p>
            )}

            <div className={`flex items-center justify-end gap-3 ${pending.options.description ? '' : 'pt-4'}`}>
              <button
                type="button"
                onClick={() => settle(false)}
                className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors"
              >
                {pending.options.cancelText || 'Cancel'}
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => settle(true)}
                className={`px-5 py-2.5 rounded-xl text-white font-medium text-sm shadow-md transition-colors ${
                  isDanger ? 'bg-red-500 hover:bg-red-600' : 'bg-[#1C1512] hover:bg-black'
                }`}
              >
                {pending.options.confirmText || (isDanger ? 'Delete' : 'Confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
