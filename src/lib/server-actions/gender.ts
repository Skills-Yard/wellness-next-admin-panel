'use server';

import axiosInstance from '../axios';
import { ServiceGender, ServiceGenderCode } from '../../types/catalogue';
import { ActionResult, getAuthHeaders } from './category';
import { parseServerError } from '../errorParser';

function unwrap<T>(resData: any, fallback: T): T {
  if (resData && typeof resData === 'object' && 'data' in resData) return resData.data;
  return (resData ?? fallback) as T;
}

export async function getServiceGendersServerAction(isActive?: boolean, categoryId?: string): Promise<ServiceGender[]> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.get('/admin/catalog/service-genders', {
      headers,
      params: {
        ...(isActive === undefined ? {} : { isActive }),
        ...(categoryId ? { categoryId } : {}),
      },
    });
    const data = unwrap<ServiceGender[]>(response.data, []);
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    console.error('[getServiceGendersServerAction]', error?.response?.data || error.message);
    return [];
  }
}

export async function getServiceGenderByIdServerAction(id: string): Promise<ServiceGender | null> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.get(`/admin/catalog/service-genders/${id}`, { headers });
    return unwrap<ServiceGender | null>(response.data, null);
  } catch (error: any) {
    console.error('[getServiceGenderByIdServerAction]', error?.response?.data || error.message);
    return null;
  }
}

// Fields accepted by CreateServiceGenderDto/UpdateServiceGenderDto — keep in sync with
// wellness-backend/src/modules/catalog/dtos/service-gender/create-service-gender.dto.ts.
export interface ServiceGenderPayload {
  code?: ServiceGenderCode; // required on create; the backend accepts it on update too, but the
  // admin UI treats it as immutable after creation (see CategoryModal) since MALE/FEMALE flips
  // would silently re-tag every ServiceItem assigned to that row.
  name: string;
  slug?: string;
  title: string;
  subtitle?: string;
  sectionHeading?: string;
  sectionSubheading?: string;
  displayOrder?: number;
  iconKey?: string;
  homeBannerKey?: string;
  homeBannerType?: 'IMAGE' | 'VIDEO';
}

export async function saveServiceGenderServerAction(
  id: string | null,
  payload: ServiceGenderPayload
): Promise<ActionResult<ServiceGender>> {
  try {
    const headers = await getAuthHeaders();
    if (id) {
      const response = await axiosInstance.patch(`/admin/catalog/service-genders/${id}`, payload, { headers });
      return { ok: true, data: unwrap(response.data, response.data) };
    } else {
      const response = await axiosInstance.post('/admin/catalog/service-genders', payload, { headers });
      return { ok: true, data: unwrap(response.data, response.data) };
    }
  } catch (error: any) {
    console.error('[saveServiceGenderServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to save gender') };
  }
}

export async function updateServiceGenderStatusServerAction(
  id: string,
  isActive: boolean
): Promise<ActionResult<ServiceGender>> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.patch(`/admin/catalog/service-genders/${id}/status`, { isActive }, { headers });
    return { ok: true, data: unwrap(response.data, response.data) };
  } catch (error: any) {
    console.error('[updateServiceGenderStatusServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to update gender status') };
  }
}

export async function updateServiceGenderSlugServerAction(
  id: string,
  slug: string
): Promise<ActionResult<ServiceGender>> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.patch(`/admin/catalog/service-genders/${id}/slug`, { slug }, { headers });
    return { ok: true, data: unwrap(response.data, response.data) };
  } catch (error: any) {
    console.error('[updateServiceGenderSlugServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to update gender slug') };
  }
}

export async function deleteServiceGenderServerAction(id: string): Promise<ActionResult<void>> {
  try {
    const headers = await getAuthHeaders();
    await axiosInstance.delete(`/admin/catalog/service-genders/${id}`, { headers });
    return { ok: true, data: undefined };
  } catch (error: any) {
    console.error('[deleteServiceGenderServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to delete gender') };
  }
}
