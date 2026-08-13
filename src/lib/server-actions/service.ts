'use server';

import axiosInstance from '../axios';
import { ServiceItem } from '../../types/catalogue';
import { ActionResult, getAuthHeaders } from './category';
import { parseServerError } from '../errorParser';

function unwrap<T>(resData: any, fallback: T): T {
  if (resData && typeof resData === 'object' && 'data' in resData) return resData.data;
  return (resData ?? fallback) as T;
}

export async function getServiceItemsServerAction(subCategoryId?: string, isActive?: boolean): Promise<ServiceItem[]> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.get('/admin/catalog/service-items', {
      headers,
      params: {
        ...(subCategoryId ? { subCategoryId } : {}),
        ...(isActive === undefined ? {} : { isActive }),
      },
    });
    const data = unwrap<ServiceItem[]>(response.data, []);
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    console.error('[getServiceItemsServerAction]', error?.response?.data || error.message);
    return [];
  }
}

export async function getServiceItemByIdServerAction(id: string): Promise<ServiceItem | null> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.get(`/admin/catalog/service-items/${id}`, { headers });
    return unwrap<ServiceItem | null>(response.data, null);
  } catch (error: any) {
    console.error('[getServiceItemByIdServerAction]', error?.response?.data || error.message);
    return null;
  }
}

// Fields accepted by CreateServiceItemDto/UpdateServiceItemDto. The model/DTO also has
// freeGifts, includedItems, ambienceItems, hygieneEssentials, careItems, thingsToKnow,
// beforeYouBook — no editor section writes those, so they're omitted here rather than guessed.
export interface ServiceItemPayload {
  subCategoryId?: string;
  genderId?: string;
  suiteId?: string;
  name: string;
  slug?: string;
  thumbnailKey?: string;
  thumbnailType?: 'IMAGE' | 'VIDEO';
  cardTitle: string;
  cardSubtitle?: string;
  cardTemplate?: 'REGULAR' | 'PREMIUM';
  shortDescription?: string;
  tags?: string[];
  isActive?: boolean;
  isPublished?: boolean;
  displayOrder?: number;
  features?: unknown;
  overview?: unknown;
  procedureSteps?: unknown;
  itemsUsed?: unknown;
  skilledPros?: unknown;
  prePostCare?: unknown;
  disclaimer?: unknown;
  whatsIncluded?: unknown;
  faqs?: unknown;
  trustedLoved?: unknown;
  reviews?: unknown;
  customReviews?: unknown;
}

export async function saveServiceItemServerAction(
  id: string | null,
  payload: ServiceItemPayload
): Promise<ActionResult<ServiceItem>> {
  try {
    const headers = await getAuthHeaders();
    if (id) {
      const response = await axiosInstance.patch(`/admin/catalog/service-items/${id}`, payload, { headers });
      return { ok: true, data: unwrap(response.data, response.data) };
    } else {
      const response = await axiosInstance.post('/admin/catalog/service-items', payload, { headers });
      return { ok: true, data: unwrap(response.data, response.data) };
    }
  } catch (error: any) {
    console.error('[saveServiceItemServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to save service item') };
  }
}

export async function updateServiceItemSlugServerAction(
  id: string,
  slug: string
): Promise<ActionResult<ServiceItem>> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.patch(`/admin/catalog/service-items/${id}/slug`, { slug }, { headers });
    return { ok: true, data: unwrap(response.data, response.data) };
  } catch (error: any) {
    console.error('[updateServiceItemSlugServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to update service item slug') };
  }
}

export async function updateServiceItemStatusServerAction(
  id: string,
  isActive: boolean
): Promise<ActionResult<ServiceItem>> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.patch(`/admin/catalog/service-items/${id}/status`, { isActive }, { headers });
    return { ok: true, data: unwrap(response.data, response.data) };
  } catch (error: any) {
    console.error('[updateServiceItemStatusServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to update service item status') };
  }
}

export async function updateServiceItemPublishStatusServerAction(
  id: string,
  isPublished: boolean
): Promise<ActionResult<ServiceItem>> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.patch(`/admin/catalog/service-items/${id}/publish-status`, {
      isPublished,
    }, { headers });
    return { ok: true, data: unwrap(response.data, response.data) };
  } catch (error: any) {
    console.error('[updateServiceItemPublishStatusServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to update service item publish status') };
  }
}

export async function deleteServiceItemServerAction(id: string): Promise<ActionResult<void>> {
  try {
    const headers = await getAuthHeaders();
    await axiosInstance.delete(`/admin/catalog/service-items/${id}`, { headers });
    return { ok: true, data: undefined };
  } catch (error: any) {
    console.error('[deleteServiceItemServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to delete service item') };
  }
}
