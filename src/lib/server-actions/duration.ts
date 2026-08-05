'use server';

import axiosInstance from '../axios';
import { ServiceDuration } from '../../types/catalogue';
import { ActionResult, getAuthHeaders } from './category';
import { parseServerError } from '../errorParser';

function unwrap<T>(resData: any, fallback: T): T {
  if (resData && typeof resData === 'object' && 'data' in resData) return resData.data;
  return (resData ?? fallback) as T;
}

// serviceItemId is required by the backend when fetching durations for a specific service.
export async function getServiceDurationsServerAction(serviceItemId: string): Promise<ServiceDuration[]> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.get('/admin/catalog/service-durations', {
      headers,
      params: { serviceItemId },
    });
    const data = unwrap<ServiceDuration[]>(response.data, []);
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    console.error('[getServiceDurationsServerAction]', error?.response?.data || error.message);
    return [];
  }
}

// Matches CreateServiceDurationDto/UpdateServiceDurationDto.
export interface ServiceDurationPayload {
  serviceItemId: string;
  label: string;
  durationMinutes: number;
  price: number;
  discountedPrice?: number;
  isDefault?: boolean;
  displayOrder?: number;
}

export async function saveServiceDurationServerAction(
  id: string | null,
  payload: ServiceDurationPayload
): Promise<ActionResult<ServiceDuration>> {
  try {
    const headers = await getAuthHeaders();
    if (id) {
      const response = await axiosInstance.patch(`/admin/catalog/service-durations/${id}`, payload, { headers });
      return { ok: true, data: unwrap(response.data, response.data) };
    } else {
      const response = await axiosInstance.post('/admin/catalog/service-durations', payload, { headers });
      return { ok: true, data: unwrap(response.data, response.data) };
    }
  } catch (error: any) {
    console.error('[saveServiceDurationServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to save service duration') };
  }
}

export async function deleteServiceDurationServerAction(id: string): Promise<ActionResult<void>> {
  try {
    const headers = await getAuthHeaders();
    await axiosInstance.delete(`/admin/catalog/service-durations/${id}`, { headers });
    return { ok: true, data: undefined };
  } catch (error: any) {
    console.error('[deleteServiceDurationServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to delete service duration') };
  }
}
