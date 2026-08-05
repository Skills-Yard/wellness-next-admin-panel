'use server';

import axiosInstance from '../axios';
import { ActionResult, getAuthHeaders } from './category';
import { parseServerError } from '../errorParser';

export interface ServiceAddOnItem {
  id: string;
  serviceItemId: string;
  name: string;
  description?: string;
  price: number;
  extraMinutes?: number;
  imageKey?: string;
  isActive?: boolean;
}

export async function getServiceAddOnsServerAction(serviceItemId?: string): Promise<ServiceAddOnItem[]> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.get('/admin/catalog/service-add-ons', {
      headers,
      params: serviceItemId ? { serviceItemId } : undefined,
    });
    const resData = response.data;
    if (Array.isArray(resData)) return resData;
    if (resData && Array.isArray(resData.data)) return resData.data;
    return [];
  } catch (error: any) {
    console.error('[getServiceAddOnsServerAction]', error?.response?.data || error.message);
    return [];
  }
}

export async function saveServiceAddOnServerAction(
  id: string | null,
  payload: Partial<ServiceAddOnItem>
): Promise<ActionResult<ServiceAddOnItem>> {
  try {
    const headers = await getAuthHeaders();
    if (id) {
      const response = await axiosInstance.patch(`/admin/catalog/service-add-ons/${id}`, payload, { headers });
      return { ok: true, data: response.data?.data || response.data };
    } else {
      const response = await axiosInstance.post('/admin/catalog/service-add-ons', payload, { headers });
      return { ok: true, data: response.data?.data || response.data };
    }
  } catch (error: any) {
    console.error('[saveServiceAddOnServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to save addon') };
  }
}

export async function deleteServiceAddOnServerAction(id: string): Promise<ActionResult<void>> {
  try {
    const headers = await getAuthHeaders();
    await axiosInstance.delete(`/admin/catalog/service-add-ons/${id}`, { headers });
    return { ok: true, data: undefined };
  } catch (error: any) {
    console.error('[deleteServiceAddOnServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to delete addon') };
  }
}
