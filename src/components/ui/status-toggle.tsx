'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

// Inline on/off switch used across every list table — flips a row's isActive
// status straight from the list ("from the outside", without opening the edit
// modal). Green when on, red when off. Callers own the actual PATCH +
// optimistic/refetch state; this just renders the switch and shows a spinner
// while `busy` is true.
export function StatusToggle({
  isActive,
  onToggle,
  busy = false,
  disabled = false,
  activeLabel = 'Active',
  inactiveLabel = 'Inactive',
}: {
  isActive: boolean;
  onToggle: () => void;
  busy?: boolean;
  disabled?: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}) {
  const label = isActive ? activeLabel : inactiveLabel;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isActive}
      aria-label={label}
      title={disabled ? label : `${label} — click to turn ${isActive ? 'off' : 'on'}`}
      disabled={busy || disabled}
      onClick={onToggle}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-black/5 transition-colors disabled:cursor-not-allowed ${
        busy || disabled ? 'opacity-60' : 'cursor-pointer'
      } ${isActive ? 'bg-[#2E7D32]' : 'bg-red-500'}`}
    >
      {busy ? (
        <Loader2 className="mx-auto h-3 w-3 animate-spin text-white" />
      ) : (
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
            isActive ? 'translate-x-4.5' : 'translate-x-0.5'
          }`}
        />
      )}
    </button>
  );
}
