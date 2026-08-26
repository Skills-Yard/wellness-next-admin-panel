// Client- and server-safe helpers for reasoning about the admin access token without a network
// round-trip. The token is a JWT issued by the backend; we only ever decode its payload here to
// read the `exp` claim — we never verify the signature (that's the backend's job on every real
// request). This is strictly an optimistic check so the UI can redirect to /login immediately
// instead of waiting for an API call to come back 401.

interface DecodedTokenPayload {
  exp?: number;
  [key: string]: unknown;
}

function decodeBase64Url(segment: string): string {
  const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');

  if (typeof atob === 'function') {
    // Browser / Edge runtime.
    return decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    );
  }

  // Node.js runtime (Proxy defaults to Node.js in this Next.js version).
  return Buffer.from(padded, 'base64').toString('utf-8');
}

function decodeTokenPayload(token: string): DecodedTokenPayload | null {
  try {
    const segment = token.split('.')[1];
    if (!segment) return null;
    return JSON.parse(decodeBase64Url(segment));
  } catch {
    return null;
  }
}

/**
 * Returns the token's expiry as epoch milliseconds, or null if it can't be determined
 * (not a JWT, malformed, or missing an `exp` claim).
 */
export function getTokenExpiry(token: string): number | null {
  const payload = decodeTokenPayload(token);
  return typeof payload?.exp === 'number' ? payload.exp * 1000 : null;
}

/**
 * True when the token is missing, malformed, or past its `exp` claim.
 * A token we can't decode at all is treated as NOT expired here — we can't prove it's invalid,
 * so we fall back to letting the real API call 401 rather than logging out a possibly-valid
 * opaque token.
 */
export function isTokenExpired(token: string | undefined | null): boolean {
  if (!token) return true;
  const expiry = getTokenExpiry(token);
  if (expiry === null) return false;
  return Date.now() >= expiry;
}
