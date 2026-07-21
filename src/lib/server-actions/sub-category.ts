'use server';

import axiosInstance from '../axios';
import { ServiceSubCategory } from '../../types/catalogue';
import { ActionResult } from './category';

export async function getSubCategoriesServerAction(): Promise<ServiceSubCategory[]> {
  try {
    const response = await axiosInstance.get('/admin/catalog/sub-categories');
    const resData = response.data;
    if (Array.isArray(resData)) {
      return resData;
    }
    if (resData && Array.isArray(resData.data)) {
      return resData.data;
    }
    if (resData && Array.isArray(resData.subCategories)) {
      return resData.subCategories;
    }
    return [];
  } catch (error: any) {
    console.error('[getSubCategoriesServerAction]', error?.response?.data || error.message);
    return [];
  }
}

export async function getSubCategoryByIdServerAction(id: string): Promise<ServiceSubCategory | null> {
  try {
    const response = await axiosInstance.get(`/admin/catalog/sub-categories/${id}`);
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
    if (id) {
      const response = await axiosInstance.patch(`/admin/catalog/sub-categories/${id}`, payload);
      return { ok: true, data: response.data?.data || response.data };
    } else {
      const response = await axiosInstance.post('/admin/catalog/sub-categories', payload);
      return { ok: true, data: response.data?.data || response.data };
    }
  } catch (error: any) {
    console.error('[saveSubCategoryServerAction]', error?.response?.data || error.message);
    return { ok: false, message: error?.response?.data?.message || error.message };
  }
}

export async function deleteSubCategoryServerAction(id: string): Promise<ActionResult<void>> {
  try {
    await axiosInstance.delete(`/admin/catalog/sub-categories/${id}`);
    return { ok: true, data: undefined };
  } catch (error: any) {
    console.error('[deleteSubCategoryServerAction]', error?.response?.data || error.message);
    return { ok: false, message: error?.response?.data?.message || error.message };
  }
}
