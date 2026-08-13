'use server';

import axiosInstance from '../axios';
import { ServiceSuite } from '../../types/catalogue';
import { ActionResult, getAuthHeaders } from './category';
import { parseServerError } from '../errorParser';

function unwrap<T>(resData: any, fallback: T): T {
  if (resData && typeof resData === 'object' && 'data' in resData) return resData.data;
  return (resData ?? fallback) as T;
}

export async function getServiceSuitesServerAction(isActive?: boolean, categoryId?: string): Promise<ServiceSuite[]> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.get('/admin/catalog/service-suites', {
      headers,
      params: {
        ...(isActive === undefined ? {} : { isActive }),
        ...(categoryId ? { categoryId } : {}),
      },
    });
    const data = unwrap<ServiceSuite[]>(response.data, []);
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    console.error('[getServiceSuitesServerAction]', error?.response?.data || error.message);
    return [];
  }
}

export async function getServiceSuiteByIdServerAction(id: string): Promise<ServiceSuite | null> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.get(`/admin/catalog/service-suites/${id}`, { headers });
    return unwrap<ServiceSuite | null>(response.data, null);
  } catch (error: any) {
    console.error('[getServiceSuiteByIdServerAction]', error?.response?.data || error.message);
    return null;
  }
}

// Fields accepted by CreateServiceSuiteDto/UpdateServiceSuiteDto — keep in sync with
// wellness-backend/src/modules/catalog/dtos/service-suite/create-service-suite.dto.ts.
export interface ServiceSuitePayload {
  categoryId: string;
  name: string;
  slug?: string;
  title: string;
  subtitle?: string;
  displayOrder?: number;
  iconKey?: string;
  homeBannerKey?: string;
  homeBannerType?: 'IMAGE' | 'VIDEO';
  isActive?: boolean;
}

export async function saveServiceSuiteServerAction(
  id: string | null,
  payload: ServiceSuitePayload
): Promise<ActionResult<ServiceSuite>> {
  try {
    const headers = await getAuthHeaders();
    if (id) {
      const response = await axiosInstance.patch(`/admin/catalog/service-suites/${id}`, payload, { headers });
      return { ok: true, data: unwrap(response.data, response.data) };
    } else {
      const response = await axiosInstance.post('/admin/catalog/service-suites', payload, { headers });
      return { ok: true, data: unwrap(response.data, response.data) };
    }
  } catch (error: any) {
    console.error('[saveServiceSuiteServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to save suite') };
  }
}

export async function updateServiceSuiteStatusServerAction(
  id: string,
  isActive: boolean
): Promise<ActionResult<ServiceSuite>> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.patch(`/admin/catalog/service-suites/${id}/status`, { isActive }, { headers });
    return { ok: true, data: unwrap(response.data, response.data) };
  } catch (error: any) {
    console.error('[updateServiceSuiteStatusServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to update suite status') };
  }
}

export async function updateServiceSuiteSlugServerAction(
  id: string,
  slug: string
): Promise<ActionResult<ServiceSuite>> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.patch(`/admin/catalog/service-suites/${id}/slug`, { slug }, { headers });
    return { ok: true, data: unwrap(response.data, response.data) };
  } catch (error: any) {
    console.error('[updateServiceSuiteSlugServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to update suite slug') };
  }
}

export async function deleteServiceSuiteServerAction(id: string): Promise<ActionResult<void>> {
  try {
    const headers = await getAuthHeaders();
    await axiosInstance.delete(`/admin/catalog/service-suites/${id}`, { headers });
    return { ok: true, data: undefined };
  } catch (error: any) {
    console.error('[deleteServiceSuiteServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to delete suite') };
  }
}
