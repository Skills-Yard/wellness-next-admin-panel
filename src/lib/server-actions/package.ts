'use server';

import axiosInstance from '../axios';
import { ServicePackage } from '../../types/catalogue';
import { ActionResult, getAuthHeaders } from './category';
import { parseServerError } from '../errorParser';
import { fetchAllPaginated, PaginatedEnvelope } from './pagination';

function unwrap<T>(resData: any, fallback: T): T {
  if (resData && typeof resData === 'object' && 'data' in resData) return resData.data;
  return (resData ?? fallback) as T;
}

// serviceItemId is required by the backend when fetching packages for a specific service.
export async function getServicePackagesServerAction(serviceItemId: string): Promise<ServicePackage[]> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.get('/admin/catalog/service-packages', {
      headers,
      params: { serviceItemId },
    });
    const data = unwrap<ServicePackage[]>(response.data, []);
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    console.error('[getServicePackagesServerAction]', error?.response?.data || error.message);
    return [];
  }
}

// Admin-only "get all" — omits serviceItemId so the backend returns every package across
// every service (each row includes a `serviceItem` ref). Powers the cross-service picker in
// PackModal; NOT used for the per-service list (see getServicePackagesServerAction above).
export async function getAllServicePackagesServerAction(): Promise<ServicePackage[]> {
  try {
    const headers = await getAuthHeaders();
    return await fetchAllPaginated<ServicePackage>((page, limit) =>
      axiosInstance.get<PaginatedEnvelope<ServicePackage>>('/admin/catalog/service-packages', {
        headers,
        params: { page, limit },
      })
    );
  } catch (error: any) {
    console.error('[getAllServicePackagesServerAction]', error?.response?.data || error.message);
    return [];
  }
}

// Matches CreateServicePackageDto/UpdateServicePackageDto. Per instruction, the admin panel only
// sends sessions + savingsPercent (the "discount %" applied to sessions x a duration's price) —
// price/pricePerSession/originalPrice/savings/badgeText/isPopular/displayOrder are intentionally
// NOT sent; the backend derives/defaults them.
export interface ServicePackagePayload {
  serviceItemId: string;
  label: string;
  sessions: number;
  savingsPercent?: number;
}

export async function saveServicePackageServerAction(
  id: string | null,
  payload: ServicePackagePayload
): Promise<ActionResult<ServicePackage>> {
  try {
    const headers = await getAuthHeaders();
    if (id) {
      const response = await axiosInstance.patch(`/admin/catalog/service-packages/${id}`, payload, { headers });
      return { ok: true, data: unwrap(response.data, response.data) };
    } else {
      const response = await axiosInstance.post('/admin/catalog/service-packages', payload, { headers });
      return { ok: true, data: unwrap(response.data, response.data) };
    }
  } catch (error: any) {
    console.error('[saveServicePackageServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to save service package') };
  }
}

export async function deleteServicePackageServerAction(id: string): Promise<ActionResult<void>> {
  try {
    const headers = await getAuthHeaders();
    await axiosInstance.delete(`/admin/catalog/service-packages/${id}`, { headers });
    return { ok: true, data: undefined };
  } catch (error: any) {
    console.error('[deleteServicePackageServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to delete service package') };
  }
}
