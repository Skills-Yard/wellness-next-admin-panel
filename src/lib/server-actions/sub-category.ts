'use server';

import axiosInstance from '../axios';
import { ServiceSubCategory } from '../../types/catalogue';
import { ActionResult, getAuthHeaders } from './category';
import { parseServerError } from '../errorParser';
import { fetchAllPaginated, PaginatedEnvelope } from './pagination';

function unwrap<T>(resData: any, fallback: T): T {
  if (resData && typeof resData === 'object' && 'data' in resData) return resData.data;
  return (resData ?? fallback) as T;
}

export async function getSubCategoriesServerAction(isActive?: boolean): Promise<ServiceSubCategory[]> {
  try {
    const headers = await getAuthHeaders();
    return await fetchAllPaginated<ServiceSubCategory>((page, limit) =>
      axiosInstance.get<PaginatedEnvelope<ServiceSubCategory>>('/admin/catalog/sub-categories', {
        headers,
        params: { ...(isActive === undefined ? {} : { isActive }), page, limit },
      })
    );
  } catch (error: any) {
    console.error('[getSubCategoriesServerAction]', error?.response?.data || error.message);
    return [];
  }
}

// Single-page counterpart to getSubCategoriesServerAction — one backend call, no
// fetchAllPaginated walk. Used by CategoriesView's own Section 2 (Sub-Categories) table/
// pagination. Suite/Gender are not real fields on GetSubCategoriesQueryDto or the
// ServiceSubCategory Prisma model (only ServiceItem carries suiteId/genderId) — CategoriesView's
// Suite/Gender dropdowns stay client-side filters over this action's (now much smaller, paged)
// result set rather than inventing backend params that don't exist.
export async function getSubCategoriesPagedServerAction(params: {
  page?: number;
  limit?: number;
  q?: string;
  categoryId?: string;
  isActive?: boolean;
}): Promise<PaginatedEnvelope<ServiceSubCategory>> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 10;
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.get<PaginatedEnvelope<ServiceSubCategory>>('/admin/catalog/sub-categories', {
      headers,
      params: {
        ...(params.categoryId ? { categoryId: params.categoryId } : {}),
        ...(params.isActive === undefined ? {} : { isActive: params.isActive }),
        ...(params.q ? { q: params.q } : {}),
        page,
        limit,
      },
    });
    return response.data;
  } catch (error: any) {
    console.error('[getSubCategoriesPagedServerAction]', error?.response?.data || error.message);
    return { data: [], pagination: { total: 0, page, limit, totalPages: 1 } };
  }
}

export async function getSubCategoryByIdServerAction(id: string): Promise<ServiceSubCategory | null> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.get(`/admin/catalog/sub-categories/${id}`, { headers });
    return unwrap<ServiceSubCategory | null>(response.data, null);
  } catch (error: any) {
    console.error('[getSubCategoryByIdServerAction]', error?.response?.data || error.message);
    return null;
  }
}

// Fields accepted by CreateSubCategoryDto/UpdateSubCategoryDto.
export interface SubCategoryPayload {
  categoryId: string;
  name: string;
  slug?: string;
  title: string;
  subtitle?: string;
  sectionHeading?: string;
  sectionSubheading?: string;
  iconKey?: string;
  homeBannerKey?: string;
  homeBannerType?: 'IMAGE' | 'VIDEO';
  displayOrder?: number;
  isActive?: boolean;
}

export async function saveSubCategoryServerAction(
  id: string | null,
  payload: SubCategoryPayload
): Promise<ActionResult<ServiceSubCategory>> {
  try {
    const headers = await getAuthHeaders();
    if (id) {
      const response = await axiosInstance.patch(`/admin/catalog/sub-categories/${id}`, payload, { headers });
      return { ok: true, data: unwrap(response.data, response.data) };
    } else {
      const response = await axiosInstance.post('/admin/catalog/sub-categories', payload, { headers });
      return { ok: true, data: unwrap(response.data, response.data) };
    }
  } catch (error: any) {
    console.error('[saveSubCategoryServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to save subcategory') };
  }
}

export async function updateSubCategoryStatusServerAction(
  id: string,
  isActive: boolean
): Promise<ActionResult<ServiceSubCategory>> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.patch(`/admin/catalog/sub-categories/${id}/status`, { isActive }, { headers });
    return { ok: true, data: unwrap(response.data, response.data) };
  } catch (error: any) {
    console.error('[updateSubCategoryStatusServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to update sub-category status') };
  }
}

export async function updateSubCategorySlugServerAction(
  id: string,
  slug: string
): Promise<ActionResult<ServiceSubCategory>> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.patch(`/admin/catalog/sub-categories/${id}/slug`, { slug }, { headers });
    return { ok: true, data: unwrap(response.data, response.data) };
  } catch (error: any) {
    console.error('[updateSubCategorySlugServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to update sub-category slug') };
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
