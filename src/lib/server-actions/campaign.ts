'use server';

import axiosInstance from '../axios';
import { PromotionalCampaign, CampaignType, CampaignTargetType, MediaType } from '../../types/catalogue';
import { ActionResult, getAuthHeaders } from './category';
import { parseServerError } from '../errorParser';

function unwrap<T>(resData: any, fallback: T): T {
  if (resData && typeof resData === 'object' && 'data' in resData) return resData.data;
  return (resData ?? fallback) as T;
}

// GetPromotionalCampaignQueryDto defaults isActive to true when the query param is omitted, so
// a plain GET only ever returns active campaigns. The admin panel needs to manage inactive ones
// too, so this fetches both slices and merges them (de-duped by id) into one list.
export async function getCampaignsServerAction(): Promise<PromotionalCampaign[]> {
  try {
    const headers = await getAuthHeaders();
    const [activeRes, inactiveRes] = await Promise.all([
      axiosInstance.get('/admin/catalog/promotional-campaign', { headers, params: { isActive: true } }),
      axiosInstance.get('/admin/catalog/promotional-campaign', { headers, params: { isActive: false } }),
    ]);
    const active = unwrap<PromotionalCampaign[]>(activeRes.data, []);
    const inactive = unwrap<PromotionalCampaign[]>(inactiveRes.data, []);
    const byId = new Map<string, PromotionalCampaign>();
    [...(Array.isArray(active) ? active : []), ...(Array.isArray(inactive) ? inactive : [])].forEach(c => byId.set(c.id, c));
    return Array.from(byId.values()).sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  } catch (error: any) {
    console.error('[getCampaignsServerAction]', error?.response?.data || error.message);
    return [];
  }
}

export async function getCampaignByIdServerAction(id: string): Promise<PromotionalCampaign | null> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.get(`/admin/catalog/promotional-campaign/${id}`, { headers });
    return unwrap<PromotionalCampaign | null>(response.data, null);
  } catch (error: any) {
    console.error('[getCampaignByIdServerAction]', error?.response?.data || error.message);
    return null;
  }
}

// Matches CreatePromotionalCampaignDto/UpdatePromotionalCampaignDto.
export interface CampaignPayload {
  type: CampaignType;
  targetType?: CampaignTargetType;
  categoryId?: string;
  subCategoryId?: string;
  serviceItemId?: string;
  zoneId?: string;
  title?: string;
  subtitle?: string;
  mediaType: MediaType;
  s3Key: string;
  cdnUrl?: string;
  ctaText?: string;
  ctaDeeplink?: string;
  displayOrder?: number;
  isActive?: boolean;
  startsAt?: string;
  endsAt?: string;
}

export async function saveCampaignServerAction(
  id: string | null,
  payload: CampaignPayload
): Promise<ActionResult<PromotionalCampaign>> {
  try {
    const headers = await getAuthHeaders();
    const response = id
      ? await axiosInstance.patch(`/admin/catalog/promotional-campaign/${id}`, payload, { headers })
      : await axiosInstance.post('/admin/catalog/promotional-campaign', payload, { headers });
    return { ok: true, data: unwrap(response.data, response.data) };
  } catch (error: any) {
    console.error('[saveCampaignServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to save campaign') };
  }
}

export async function updateCampaignStatusServerAction(
  id: string,
  isActive: boolean
): Promise<ActionResult<PromotionalCampaign>> {
  try {
    const headers = await getAuthHeaders();
    // UpdatePromotionalCampaignQueryDto requires `id` as a query param too (in addition to the
    // path param) — the service ignores it, but ValidationPipe 400s without it.
    const response = await axiosInstance.patch(`/admin/catalog/promotional-campaign/${id}/status`, null, {
      headers,
      params: { id, isActive },
    });
    return { ok: true, data: unwrap(response.data, response.data) };
  } catch (error: any) {
    console.error('[updateCampaignStatusServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to update campaign status') };
  }
}

export async function deleteCampaignServerAction(id: string): Promise<ActionResult<void>> {
  try {
    const headers = await getAuthHeaders();
    await axiosInstance.delete(`/admin/catalog/promotional-campaign/${id}`, { headers });
    return { ok: true, data: undefined };
  } catch (error: any) {
    console.error('[deleteCampaignServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to delete campaign') };
  }
}
