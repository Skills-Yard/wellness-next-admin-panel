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

export async function getCategoriesServerAction(): Promise<ServiceCategory[]> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.get('/admin/catalog/categories', { headers });
    const resData = response.data;
    if (Array.isArray(resData)) return resData;
    if (resData && Array.isArray(resData.data)) return resData.data;
    if (resData && Array.isArray(resData.categories)) return resData.categories;
    return [];
  } catch (error: any) {
    console.warn('[getCategoriesServerAction] Admin call failed, trying public endpoint...', error?.message);
    try {
      const response = await axiosInstance.get('/catalog/categories');
      const resData = response.data;
      if (Array.isArray(resData)) return resData;
      if (resData && Array.isArray(resData.data)) return resData.data;
    } catch (fallbackErr: any) {
      console.error('[getCategoriesServerAction] Public fallback error:', fallbackErr?.message);
    }
    return [];
  }
}


export async function getCategoryByIdServerAction(id: string): Promise<ServiceCategory | null> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.get(`/admin/catalog/categories/${id}`, { headers });
    const resData = response.data;
    return resData?.data || resData || null;
  } catch (error: any) {
    console.error('[getCategoryByIdServerAction]', error?.response?.data || error.message);
    return null;
  }
}

export async function saveCategoryServerAction(
  id: string | null,
  payload: Partial<ServiceCategory>
): Promise<ActionResult<ServiceCategory>> {
  try {
    const headers = await getAuthHeaders();
    if (id) {
      const response = await axiosInstance.patch(`/admin/catalog/categories/${id}`, payload, { headers });
      return { ok: true, data: response.data?.data || response.data };
    } else {
      const response = await axiosInstance.post('/admin/catalog/categories', payload, { headers });
      return { ok: true, data: response.data?.data || response.data };
    }
  } catch (error: any) {
    console.error('[saveCategoryServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to save category') };
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
