'use server';

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
