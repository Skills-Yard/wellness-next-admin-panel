'use server';

import axiosInstance from '../axios';
import { ServiceAddOn } from '../../types/catalogue';
import { ActionResult, getAuthHeaders } from './category';
import { parseServerError } from '../errorParser';

function unwrap<T>(resData: any, fallback: T): T {
  if (resData && typeof resData === 'object' && 'data' in resData) return resData.data;
  return (resData ?? fallback) as T;
}

// serviceItemId is required by the backend when fetching add-ons for a specific service.
export async function getServiceAddOnsServerAction(serviceItemId: string): Promise<ServiceAddOn[]> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.get('/admin/catalog/service-add-ons', {
      headers,
      params: { serviceItemId },
    });
    const data = unwrap<ServiceAddOn[]>(response.data, []);
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    console.error('[getServiceAddOnsServerAction]', error?.response?.data || error.message);
    return [];
  }
}

// Admin-only "get all" — omits serviceItemId so the backend returns every add-on across
// every service (each row includes a `serviceItem` ref). Powers the cross-service picker in
// AddOnModal; NOT used for the per-service list (see getServiceAddOnsServerAction above).
export async function getAllServiceAddOnsServerAction(): Promise<ServiceAddOn[]> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.get('/admin/catalog/service-add-ons', { headers });
    const data = unwrap<ServiceAddOn[]>(response.data, []);
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    console.error('[getAllServiceAddOnsServerAction]', error?.response?.data || error.message);
    return [];
  }
}

// Matches CreateServiceAddOnDto/UpdateServiceAddOnDto. All fields besides serviceItemIds are
// only truly required when creating (id === null) — the backend's update DTO is a PartialType,
// so a link/unlink-only PATCH can send just serviceItemIds and leave everything else alone.
// serviceItemIds is the FULL set of service items this add-on should be linked to after the
// call — the backend does a full replace (`set`), not a merge — so callers must include every
// id that should stay linked, not just the one being added/removed. Required on create
// (ArrayNotEmpty); omit it entirely on an update that isn't touching links so the existing
// links are left untouched (see UpdateServiceAddOnDto being a PartialType).
export interface ServiceAddOnPayload {
  serviceItemIds?: string[];
  name?: string;
  description?: string;
  price?: number;
  imageKey?: string;
  extraMinutes?: number;
  isActive?: boolean;
  displayOrder?: number;
}

export async function saveServiceAddOnServerAction(
  id: string | null,
  payload: ServiceAddOnPayload
): Promise<ActionResult<ServiceAddOn>> {
  try {
    const headers = await getAuthHeaders();
    if (id) {
      const response = await axiosInstance.patch(`/admin/catalog/service-add-ons/${id}`, payload, { headers });
      return { ok: true, data: unwrap(response.data, response.data) };
    } else {
      const response = await axiosInstance.post('/admin/catalog/service-add-ons', payload, { headers });
      return { ok: true, data: unwrap(response.data, response.data) };
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
