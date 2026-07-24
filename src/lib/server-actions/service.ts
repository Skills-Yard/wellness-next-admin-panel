'use server';

import axiosInstance from '../axios';
import { ServiceItem } from '../../types/catalogue';
import { ActionResult } from './category';
import { parseServerError } from '../errorParser';

export async function getServiceItemsServerAction(subCategoryId?: string): Promise<ServiceItem[]> {
  try {
    const response = await axiosInstance.get('/admin/catalog/service-items', {
      params: subCategoryId ? { subCategoryId } : undefined,
    });
    const resData = response.data;
    if (Array.isArray(resData)) {
      return resData;
    }
    if (resData && Array.isArray(resData.data)) {
      return resData.data;
    }
    if (resData && Array.isArray(resData.serviceItems)) {
      return resData.serviceItems;
    }
    return [];
  } catch (error: any) {
    console.error('[getServiceItemsServerAction]', error?.response?.data || error.message);
    return [];
  }
}

export async function getServiceItemByIdServerAction(id: string): Promise<ServiceItem | null> {
  try {
    const response = await axiosInstance.get(`/admin/catalog/service-items/${id}`);
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
    if (id) {
      const response = await axiosInstance.patch(`/admin/catalog/service-items/${id}`, payload);
      return { ok: true, data: response.data?.data || response.data };
    } else {
      const response = await axiosInstance.post('/admin/catalog/service-items', payload);
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
    const response = await axiosInstance.patch(`/admin/catalog/service-items/${id}/publish-status`, {
      isPublished,
    });
    return { ok: true, data: response.data?.data || response.data };
  } catch (error: any) {
    console.error('[updateServiceItemPublishStatusServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to update service item publish status') };
  }
}

export async function deleteServiceItemServerAction(id: string): Promise<ActionResult<void>> {
  try {
    await axiosInstance.delete(`/admin/catalog/service-items/${id}`);
    return { ok: true, data: undefined };
  } catch (error: any) {
    console.error('[deleteServiceItemServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to delete service item') };
  }
}
