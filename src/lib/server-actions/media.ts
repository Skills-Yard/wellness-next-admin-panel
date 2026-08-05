'use server';

import axiosInstance from '../axios';
import { parseServerError } from '../errorParser';
import { getAuthHeaders } from './category';

export interface GetUploadUrlPayload {
  fileName: string;
  contentType: string;
  module: 'categories' | 'subcategories' | 'services' | 'addons' | 'professional-banners' | 'app-content' | 'campaigns';
  version?: number;
  slug?: string;
  zoneSlug?: string;
}

export interface UploadUrlResponse {
  uploadUrl: string;
  r2Key: string;
  cdnUrl: string;
  mediaType: string;
}

// The old multipart POST /admin/catalog/media/upload endpoint has been removed from the
// backend (see git history on upload-media.controller.ts) in favor of this presigned-URL flow:
// call this to get a signed R2 PUT URL, then PUT the file directly to R2 from the browser
// (see uploadFileToR2 in ../uploadToR2.ts).
export async function getUploadUrlServerAction(
  payload: GetUploadUrlPayload
): Promise<{ ok: true; data: UploadUrlResponse } | { ok: false; message: string }> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.post('/admin/catalog/media/upload-url', {
      version: 1,
      ...payload,
    }, { headers });
    const body = response.data?.data ?? response.data;
    return { ok: true, data: body };
  } catch (error: any) {
    console.error('[getUploadUrlServerAction]', error?.response?.data || error.message);
    return {
      ok: false,
      message: parseServerError(error, 'Failed to get upload URL'),
    };
  }
}
