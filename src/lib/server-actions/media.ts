'use server';

import axiosInstance from '../axios';
import { parseServerError } from '../errorParser';

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
    return { ok: true, data: response.data?.data || response.data };
  } catch (error: any) {
    console.error('[getUploadUrlServerAction]', error?.response?.data || error.message);
    return {
      ok: false,
      message: parseServerError(error, 'Failed to get upload URL'),
    };
  }
}

export async function uploadFileServerAction(
  formData: FormData
): Promise<{ ok: true; data: any } | { ok: false; message: string }> {
  try {
    const response = await axiosInstance.post('/admin/catalog/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return { ok: true, data: response.data?.data || response.data };
  } catch (error: any) {
    console.error('[uploadFileServerAction]', error?.response?.data || error.message);
    return {
      ok: false,
      message: parseServerError(error, 'Failed to upload file'),
    };
  }
}
