'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

// Clickable stand-in for the plain <Badge variant="active|inactive"> used across every list table
// — flips a row's isActive status directly from the list ("from the outside"), without opening
// its edit modal. Callers own the actual PATCH + optimistic/refetch state; this just renders the
// pill and a busy spinner while `busy` is true.
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
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={busy || disabled}
      title={disabled ? undefined : isActive ? `Click to mark ${inactiveLabel.toLowerCase()}` : `Click to mark ${activeLabel.toLowerCase()}`}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
        isActive
          ? 'bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9] hover:bg-[#D5EAD6]'
          : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
      } ${disabled ? '' : 'cursor-pointer'}`}
    >
      {busy ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-[#2E7D32]' : 'bg-gray-400'}`} />
      )}
      {isActive ? activeLabel : inactiveLabel}
    </button>
  );
}
