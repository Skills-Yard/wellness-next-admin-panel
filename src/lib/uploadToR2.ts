import { getUploadUrlServerAction } from './server-actions/media';

export interface UploadResult {
  url: string;
  r2Key?: string;
}

/**
 * Uploads a file directly to Cloudflare R2 using a short-lived presigned URL:
 * 1. Ask the backend for a signed PUT URL scoped to this module/slug (POST /media/upload-url).
 * 2. PUT the file straight to R2 from the browser, bypassing our backend for the file bytes.
 *
 * The Content-Type and Cache-Control headers below must match what the backend signed
 * (R2StorageService.getUploadUrl sets both on the command before signing) — sending different
 * values here makes R2 reject the request with a signature mismatch.
 *
 * Throws on failure rather than silently falling back to a local blob/data URL: a swallowed
 * failure here previously looked like a successful save while nothing actually persisted.
 */
export async function uploadFileToR2(
  file: File,
  module: 'categories' | 'subcategories' | 'services' | 'addons' | 'professional-banners' | 'app-content' | 'campaigns',
  slug?: string
): Promise<UploadResult> {
  const signed = await getUploadUrlServerAction({
    fileName: file.name,
    contentType: file.type,
    module,
    slug,
  });

  if (!signed.ok) {
    throw new Error(signed.message || 'Could not get an upload URL');
  }

  const { uploadUrl, cdnUrl, r2Key } = signed.data;
  const CACHE_CONTROL = 'public, max-age=31536000, immutable';

  const putResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type,
      'Cache-Control': CACHE_CONTROL,
    },
    body: file,
  });

  if (!putResponse.ok) {
    throw new Error(`Upload to storage failed (HTTP ${putResponse.status})`);
  }

  return { url: cdnUrl, r2Key };
}
