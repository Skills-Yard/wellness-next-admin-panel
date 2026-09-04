import { getAdminProfilePhotoUploadUrlServerAction } from './server-actions/admin';

export interface AdminAvatarUploadResult {
  r2Key: string;
  cdnUrl: string;
}

/**
 * Uploads the logged-in admin's profile photo directly to Cloudflare R2 via a
 * short-lived presigned PUT URL (same pattern as ../uploadToR2.ts, but against
 * the admin self endpoint):
 *   1. POST /admin/me/profile-photo/upload-url  -> signed PUT URL + r2Key
 *   2. PUT the file straight to R2 from the browser
 *
 * The caller then submits `r2Key` back via updateMyAdminServerAction({ profilePhotoKey }).
 *
 * Only `Content-Type` is sent on the PUT — it's the one header the backend signs
 * into the URL when no exact byte size is supplied (see R2StorageService.getUploadUrl).
 * Throws on failure rather than swallowing it, so a failed upload never looks
 * like a successful save.
 */
export async function uploadAdminAvatar(file: File): Promise<AdminAvatarUploadResult> {
  const signed = await getAdminProfilePhotoUploadUrlServerAction({
    fileName: file.name,
    contentType: file.type,
  });

  if (!signed.ok) {
    throw new Error(signed.message || 'Could not get an upload URL');
  }

  const { uploadUrl, cdnUrl, r2Key } = signed.data;

  const putResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });

  if (!putResponse.ok) {
    throw new Error(`Upload to storage failed (HTTP ${putResponse.status})`);
  }

  return { r2Key, cdnUrl };
}
