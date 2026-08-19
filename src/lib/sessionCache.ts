// Tiny in-memory, tab-lifetime cache for client-fetched lists (Partners, Bookings, Users,
// Dashboard's combined fetch, etc). Lives in module scope, so it survives client-side route
// changes — Next's App Router unmounts a page's component (and its useState) on every
// navigation, but this module isn't re-evaluated, only a real page reload clears it.
//
// Goal: revisiting a page you already loaded this session shows what you already had
// immediately instead of a skeleton, while a background refetch quietly keeps it fresh — and if
// that background refetch fails (network blip, backend cold-starting, etc.), the page still has
// the last known-good data to show instead of collapsing to an empty/zeroed state.
const store = new Map<string, unknown>();

export function getCached<T>(key: string): T | undefined {
  return store.get(key) as T | undefined;
}

export function setCached<T>(key: string, value: T): void {
  store.set(key, value);
}
