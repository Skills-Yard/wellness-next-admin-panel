'use server';

import axiosInstance from '../axios';
import { ServiceDuration } from '../../types/catalogue';
import { ActionResult } from './category';
import { parseServerError } from '../errorParser';

export async function getServiceDurationsServerAction(serviceItemId?: string): Promise<ServiceDuration[]> {
  try {
    const response = await axiosInstance.get('/admin/catalog/service-durations', {
      params: serviceItemId ? { serviceItemId } : undefined,
    });
    return response.data || [];
  } catch (error: any) {
    console.error('[getServiceDurationsServerAction]', error?.response?.data || error.message);
    return [];
  }
}

export async function saveServiceDurationServerAction(
  id: string | null,
  payload: { serviceItemId: string; label: string; durationMinutes: number; price: number; displayOrder?: number }
): Promise<ActionResult<ServiceDuration>> {
  try {
    if (id) {
      const response = await axiosInstance.patch(`/admin/catalog/service-durations/${id}`, payload);
      return { ok: true, data: response.data };
    } else {
      const response = await axiosInstance.post('/admin/catalog/service-durations', payload);
      return { ok: true, data: response.data };
    }
  } catch (error: any) {
    console.error('[saveServiceDurationServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to save service duration') };
  }
}

export async function deleteServiceDurationServerAction(id: string): Promise<ActionResult<void>> {
  try {
    await axiosInstance.delete(`/admin/catalog/service-durations/${id}`);
    return { ok: true, data: undefined };
  } catch (error: any) {
    console.error('[deleteServiceDurationServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to delete service duration') };
  }
}
