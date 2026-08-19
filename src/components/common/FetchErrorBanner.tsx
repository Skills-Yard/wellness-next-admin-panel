'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface FetchErrorBannerProps {
  message?: string;
  onRetry: () => void;
}

// Shown when a background/foreground refetch genuinely fails (network error, backend
// unreachable, etc.) — makes that failure visible instead of letting the page quietly render
// whatever's cached (or an empty list) as if it were a real, current answer.
export default function FetchErrorBanner({ message, onRetry }: FetchErrorBannerProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
      <div className="flex items-center gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
        <span>{message || "Couldn't reach the server — showing the last data that loaded successfully."}</span>
      </div>
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 font-semibold text-amber-900 hover:text-amber-950 cursor-pointer flex-shrink-0"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Retry
      </button>
    </div>
  );
}
