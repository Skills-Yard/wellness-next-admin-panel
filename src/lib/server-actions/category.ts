'use server';

import { cookies } from 'next/headers';
import axiosInstance from '../axios';
import { ServiceCategory } from '../../types/catalogue';
import { parseServerError } from '../errorParser';

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string };

export async function getAuthHeaders() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('wellness_admin_token')?.value;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch (e) {
    return {};
  }
}

// The backend wraps every response as { success, data, meta }. Every admin
// catalog GET/POST/PATCH below returns the payload straight from that `data` key.
function unwrap<T>(resData: any, fallback: T): T {
  if (resData && typeof resData === 'object' && 'data' in resData) return resData.data;
  return (resData ?? fallback) as T;
}

export async function getCategoriesServerAction(isActive?: boolean): Promise<ServiceCategory[]> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.get('/admin/catalog/categories', {
      headers,
      params: isActive === undefined ? undefined : { isActive },
    });
    const data = unwrap<ServiceCategory[]>(response.data, []);
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    console.error('[getCategoriesServerAction]', error?.response?.data || error.message);
    return [];
  }
}

export async function getCategoryByIdServerAction(id: string): Promise<ServiceCategory | null> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.get(`/admin/catalog/categories/${id}`, { headers });
    return unwrap<ServiceCategory | null>(response.data, null);
  } catch (error: any) {
    console.error('[getCategoryByIdServerAction]', error?.response?.data || error.message);
    return null;
  }
}

// Fields accepted by CreateCategoryDto/UpdateCategoryDto — this is the complete list.
// The backend runs ValidationPipe with `whitelist: true`, so ANY property not declared on
// the DTO is silently stripped from the request rather than rejected — keep this in sync
// with wellness-backend/src/modules/catalog/dtos/category/create-category.dto.ts.
export interface CategoryPayload {
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

export async function saveCategoryServerAction(
  id: string | null,
  payload: CategoryPayload
): Promise<ActionResult<ServiceCategory>> {
  try {
    const headers = await getAuthHeaders();
    if (id) {
      const response = await axiosInstance.patch(`/admin/catalog/categories/${id}`, payload, { headers });
      return { ok: true, data: unwrap(response.data, response.data) };
    } else {
      const response = await axiosInstance.post('/admin/catalog/categories', payload, { headers });
      return { ok: true, data: unwrap(response.data, response.data) };
    }
  } catch (error: any) {
    console.error('[saveCategoryServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to save category') };
  }
}

export async function updateCategoryStatusServerAction(
  id: string,
  isActive: boolean
): Promise<ActionResult<ServiceCategory>> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.patch(`/admin/catalog/categories/${id}/status`, { isActive }, { headers });
    return { ok: true, data: unwrap(response.data, response.data) };
  } catch (error: any) {
    console.error('[updateCategoryStatusServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to update category status') };
  }
}

export async function updateCategorySlugServerAction(
  id: string,
  slug: string
): Promise<ActionResult<ServiceCategory>> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.patch(`/admin/catalog/categories/${id}/slug`, { slug }, { headers });
    return { ok: true, data: unwrap(response.data, response.data) };
  } catch (error: any) {
    console.error('[updateCategorySlugServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to update category slug') };
  }
}

export async function deleteCategoryServerAction(id: string): Promise<ActionResult<void>> {
  try {
    const headers = await getAuthHeaders();
    await axiosInstance.delete(`/admin/catalog/categories/${id}`, { headers });
    return { ok: true, data: undefined };
  } catch (error: any) {
    console.error('[deleteCategoryServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to delete category') };
  }
}
