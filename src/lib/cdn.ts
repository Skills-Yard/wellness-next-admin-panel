// The backend stores image references as R2 bucket keys (e.g.
// `admins/<id>/images/photo_v1.jpg`), not full URLs — see Admin.profilePhotoKey
// and User.profilePhotoKey. This composes the public CDN URL for display.
//
// NEXT_PUBLIC_CLOUDFLARE_CDN_DOMAIN is inlined at build time (see .env); a direct
// `process.env.X` reference is required for that substitution to happen.
const CDN_DOMAIN = (process.env.NEXT_PUBLIC_CLOUDFLARE_CDN_DOMAIN || '').replace(/\/+$/, '');

/**
 * Turns a stored R2 key into a displayable URL.
 * - empty / nullish  -> undefined (so <img src> / <Avatar src> fall back cleanly)
 * - already absolute  -> returned unchanged (tolerates rows that stored a full URL)
 * - a bare key        -> `${CDN_DOMAIN}/${key}`
 */
export function cdnUrl(key?: string | null): string | undefined {
  if (!key) return undefined;
  if (/^(https?:)?\/\//i.test(key) || key.startsWith('data:') || key.startsWith('blob:')) {
    return key;
  }
  const cleanKey = key.replace(/^\/+/, '');
  return CDN_DOMAIN ? `${CDN_DOMAIN}/${cleanKey}` : `/${cleanKey}`;
}
