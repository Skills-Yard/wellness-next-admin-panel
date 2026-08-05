'use server';

import axiosInstance from '../axios';
import { ServiceSubCategory } from '../../types/catalogue';
import { ActionResult, getAuthHeaders } from './category';
import { parseServerError } from '../errorParser';

export async function getSubCategoriesServerAction(): Promise<ServiceSubCategory[]> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.get('/admin/catalog/sub-categories', { headers });
    const resData = response.data;
    if (Array.isArray(resData)) return resData;
    if (resData && Array.isArray(resData.data)) return resData.data;
    if (resData && Array.isArray(resData.subCategories)) return resData.subCategories;
    return [];
  } catch (error: any) {
    console.warn('[getSubCategoriesServerAction] Admin call failed, trying public endpoint...', error?.message);
    try {
      const response = await axiosInstance.get('/catalog/sub-categories');
      const resData = response.data;
      if (Array.isArray(resData)) return resData;
      if (resData && Array.isArray(resData.data)) return resData.data;
    } catch (fallbackErr: any) {
      console.error('[getSubCategoriesServerAction] Public fallback error:', fallbackErr?.message);
    }
    return [];
  }
}

export async function getSubCategoryByIdServerAction(id: string): Promise<ServiceSubCategory | null> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.get(`/admin/catalog/sub-categories/${id}`, { headers });
    const resData = response.data;
    return resData?.data || resData || null;
  } catch (error: any) {
    console.error('[getSubCategoryByIdServerAction]', error?.response?.data || error.message);
    return null;
  }
}

export async function saveSubCategoryServerAction(
  id: string | null,
  payload: Partial<ServiceSubCategory>
): Promise<ActionResult<ServiceSubCategory>> {
  try {
    const headers = await getAuthHeaders();
    if (id) {
      const response = await axiosInstance.patch(`/admin/catalog/sub-categories/${id}`, payload, { headers });
      return { ok: true, data: response.data?.data || response.data };
    } else {
      const response = await axiosInstance.post('/admin/catalog/sub-categories', payload, { headers });
      return { ok: true, data: response.data?.data || response.data };
    }
  } catch (error: any) {
    console.error('[saveSubCategoryServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to save subcategory') };
  }
}

export async function deleteSubCategoryServerAction(id: string): Promise<ActionResult<void>> {
  try {
    const headers = await getAuthHeaders();
    await axiosInstance.delete(`/admin/catalog/sub-categories/${id}`, { headers });
    return { ok: true, data: undefined };
  } catch (error: any) {
    console.error('[deleteSubCategoryServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to delete subcategory') };
  }
}
