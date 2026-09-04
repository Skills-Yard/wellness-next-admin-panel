import axiosInstance from '../axios';
import { getAuthHeaders, ActionResult } from './category';
import { parseServerError } from '../errorParser';
import { Admin } from '../../types/admin';

// Fields accepted by PATCH /admin/{id} — all optional since it's a partial update; password is
// only meaningful when the caller actually wants to change it (see ProfilePage, which omits it
// entirely from the payload when the "New Password" field is left blank).
export interface UpdateAdminPayload {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
  // R2 bucket key from getAdminProfilePhotoUploadUrlServerAction, submitted back
  // once the file has been PUT to R2. The backend re-verifies the object before
  // persisting it (see AdminService.update -> verifyUploadedObject).
  profilePhotoKey?: string;
}

// Self-service payload for PATCH /admin/me — deliberately omits `role` (an admin
// must not be able to change their own role from the profile page).
export type UpdateMyAdminPayload = Omit<UpdateAdminPayload, 'role'>;

export interface AdminUploadUrlResponse {
  uploadUrl: string;
  r2Key: string;
  cdnUrl: string;
}

// The backend wraps responses as { success, data, meta } like every other endpoint here, but
// unlike the catalog/partner ones, a single-admin payload may itself be nested under an `admin`
// key (mirrors the tolerant `body?.admin ?? body?.user` parsing AuthContext.login already does
// for the same /admin/login response shape) — try both. For a list response `body` is already
// the array, and `[].admin` is undefined, so the `?? body` fallback resolves to the array as-is.
function unwrap(resData: any): any {
  const body = resData && typeof resData === 'object' && 'data' in resData ? resData.data : resData;
  return body?.admin ?? body;
}

// Doesn't catch-and-return-[] on failure — the Admins list page needs to tell "genuinely no
// admins" apart from "the request failed" (same convention as getPartnersServerAction).
export async function getAdminsServerAction(): Promise<Admin[]> {
  const headers = await getAuthHeaders();
  const response = await axiosInstance.get('/admin', { headers });
  const data = unwrap(response.data);
  return Array.isArray(data) ? data : [];
}

// The logged-in admin's own record (id from the access token, server-side).
// Returns the full row incl. lastLoginAt / isActive / profilePhotoKey — the
// login response carries none of that, so this is how the session gets hydrated.
export async function getMyAdminServerAction(): Promise<ActionResult<Admin>> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.get('/admin/me', { headers });
    return { ok: true, data: unwrap(response.data) };
  } catch (error: any) {
    console.error('[getMyAdminServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to load profile') };
  }
}

export async function updateAdminServerAction(
  id: string,
  payload: UpdateAdminPayload
): Promise<ActionResult<Admin>> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.patch(`/admin/${id}`, payload, { headers });
    return { ok: true, data: unwrap(response.data) };
  } catch (error: any) {
    console.error('[updateAdminServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to update profile') };
  }
}

// Self-service profile update for the logged-in admin. Hits PATCH /admin/me
// (scope: ADMIN, no `*` permission needed) instead of PATCH /admin/{id}, so it
// works for every admin role — and the id doesn't have to be known/trusted
// client-side. Used by the profile page for name/email/password/photo edits.
export async function updateMyAdminServerAction(
  payload: UpdateMyAdminPayload
): Promise<ActionResult<Admin>> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.patch('/admin/me', payload, { headers });
    return { ok: true, data: unwrap(response.data) };
  } catch (error: any) {
    console.error('[updateMyAdminServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to update profile') };
  }
}

// Step 1 of the avatar upload: ask the backend for a short-lived presigned R2
// PUT URL scoped to this admin's own namespace. Step 2 (PUT the bytes) + step 3
// (submit r2Key back via updateMyAdminServerAction) live in ../uploadAdminAvatar.
export async function getAdminProfilePhotoUploadUrlServerAction(payload: {
  fileName: string;
  contentType: string;
  fileSize?: number;
}): Promise<ActionResult<AdminUploadUrlResponse>> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.post(
      '/admin/me/profile-photo/upload-url',
      payload,
      { headers }
    );
    const body = response.data?.data ?? response.data;
    return { ok: true, data: body };
  } catch (error: any) {
    console.error(
      '[getAdminProfilePhotoUploadUrlServerAction]',
      error?.response?.data || error.message
    );
    return { ok: false, message: parseServerError(error, 'Failed to get an upload URL') };
  }
}

export async function deleteAdminServerAction(id: string): Promise<ActionResult<void>> {
  try {
    const headers = await getAuthHeaders();
    await axiosInstance.delete(`/admin/${id}`, { headers });
    return { ok: true, data: undefined };
  } catch (error: any) {
    console.error('[deleteAdminServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to delete admin') };
  }
}
