import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// The backend decrypts `phone` as countryCode+digits concatenated with no separator (see
// eezit-backend's auth.service.ts OTP verify/registration flow, which encrypts
// `${countryCode}${phone}` as a single payload) — so a decrypted `phone` already carries the
// country code prefix. These helpers split them back apart for display/editing instead of
// re-prepending `countryCode` a second time (which used to produce e.g. "+91++918689898989").

/** Strips a leading countryCode off an already-prefixed phone, for editable text inputs that
 *  pair with their own country-code selector. Falls back to the raw value when it doesn't
 *  start with the given code (unknown/legacy data) rather than guessing. */
export function stripCountryCode(phone?: string | null, countryCode?: string | null): string {
  if (!phone) return '';
  const code = countryCode || '+91';
  return phone.startsWith(code) ? phone.slice(code.length).trim() : phone;
}

/** Formats a decrypted phone for display, e.g. "+91 8689898989". Returns '—' when absent. */
export function formatPhone(phone?: string | null, countryCode?: string | null): string {
  if (!phone) return '—';
  const code = countryCode || '+91';
  const local = stripCountryCode(phone, countryCode);
  return local && local !== phone ? `${code} ${local}` : phone;
}
