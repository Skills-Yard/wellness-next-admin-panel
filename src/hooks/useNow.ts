'use client';

import { useEffect, useState } from 'react';

/**
 * Ticks every `intervalMs` and returns the current time (ms since epoch).
 *
 * Use it to keep relative-time UI (e.g. "5 minutes ago") live without
 * requiring a page refresh — pass the returned value into a `timeAgo`-style
 * formatter instead of having that formatter call `Date.now()` itself, since
 * a bare `Date.now()` call only re-evaluates when something else happens to
 * re-render the component.
 */
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
