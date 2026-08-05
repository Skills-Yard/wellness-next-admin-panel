'use server';

import axiosInstance from '../axios';
import { ServiceItem } from '../../types/catalogue';
import { ActionResult, getAuthHeaders } from './category';
import { parseServerError } from '../errorParser';

export async function getServiceItemsServerAction(subCategoryId?: string): Promise<ServiceItem[]> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.get('/admin/catalog/service-items', {
      headers,
      params: subCategoryId ? { subCategoryId } : undefined,
    });
    const resData = response.data;
    if (Array.isArray(resData)) return resData;
    if (resData && Array.isArray(resData.data)) return resData.data;
    if (resData && Array.isArray(resData.serviceItems)) return resData.serviceItems;
    return [];
  } catch (error: any) {
    console.warn('[getServiceItemsServerAction] Admin call failed, trying public endpoint...', error?.message);
    try {
      const response = await axiosInstance.get('/catalog/service-items', {
        params: subCategoryId ? { subCategoryId } : undefined,
      });
      const resData = response.data;
      if (Array.isArray(resData)) return resData;
      if (resData && Array.isArray(resData.data)) return resData.data;
    } catch (fallbackErr: any) {
      console.error('[getServiceItemsServerAction] Public fallback error:', fallbackErr?.message);
    }
    return [];
  }
}

export async function getServiceItemByIdServerAction(id: string): Promise<ServiceItem | null> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.get(`/admin/catalog/service-items/${id}`, { headers });
    const resData = response.data;
    return resData?.data || resData || null;
  } catch (error: any) {
    console.error('[getServiceItemByIdServerAction]', error?.response?.data || error.message);
    return null;
  }
}

export async function saveServiceItemServerAction(
  id: string | null,
  payload: Partial<ServiceItem>
): Promise<ActionResult<ServiceItem>> {
  try {
    const headers = await getAuthHeaders();
    if (id) {
      const response = await axiosInstance.patch(`/admin/catalog/service-items/${id}`, payload, { headers });
      return { ok: true, data: response.data?.data || response.data };
    } else {
      const response = await axiosInstance.post('/admin/catalog/service-items', payload, { headers });
      return { ok: true, data: response.data?.data || response.data };
    }
  } catch (error: any) {
    console.error('[saveServiceItemServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to save service item') };
  }
}

export async function updateServiceItemPublishStatusServerAction(
  id: string,
  isPublished: boolean
): Promise<ActionResult<ServiceItem>> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.patch(`/admin/catalog/service-items/${id}/publish-status`, {
      isPublished,
    }, { headers });
    return { ok: true, data: response.data?.data || response.data };
  } catch (error: any) {
    console.error('[updateServiceItemPublishStatusServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to update service item publish status') };
  }
}

export async function deleteServiceItemServerAction(id: string): Promise<ActionResult<void>> {
  try {
    const headers = await getAuthHeaders();
    await axiosInstance.delete(`/admin/catalog/service-items/${id}`, { headers });
    return { ok: true, data: undefined };
  } catch (error: any) {
    console.error('[deleteServiceItemServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to delete service item') };
  }
}
