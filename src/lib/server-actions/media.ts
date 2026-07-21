'use server';

import axiosInstance from '../axios';

export interface GetUploadUrlPayload {
  fileName: string;
  contentType: string;
  module: 'categories' | 'subcategories' | 'services' | 'addons' | 'professional-banners' | 'app-content';
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

export async function getUploadUrlServerAction(
  payload: GetUploadUrlPayload
): Promise<{ ok: true; data: UploadUrlResponse } | { ok: false; message: string }> {
  try {
    const response = await axiosInstance.post('/admin/catalog/media/upload-url', {
      version: 1,
      ...payload,
    });
    return { ok: true, data: response.data };
  } catch (error: any) {
    console.error('[getUploadUrlServerAction]', error?.response?.data || error.message);
    return {
      ok: false,
      message: error?.response?.data?.message || error.message || 'Failed to get upload URL',
    };
  }
}
