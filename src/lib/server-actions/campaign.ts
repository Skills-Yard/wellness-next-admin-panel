'use server';

import axiosInstance from '../axios';
import { PromotionalCampaign, CampaignType, CampaignTargetType, MediaType } from '../../types/catalogue';
import { ActionResult, getAuthHeaders } from './category';
import { parseServerError } from '../errorParser';
import { fetchAllPaginated, PaginatedEnvelope } from './pagination';

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
    const [active, inactive] = await Promise.all([
      fetchAllPaginated<PromotionalCampaign>((page, limit) =>
        axiosInstance.get<PaginatedEnvelope<PromotionalCampaign>>('/admin/catalog/promotional-campaign', {
          headers,
          params: { isActive: true, page, limit },
        })
      ),
      fetchAllPaginated<PromotionalCampaign>((page, limit) =>
        axiosInstance.get<PaginatedEnvelope<PromotionalCampaign>>('/admin/catalog/promotional-campaign', {
          headers,
          params: { isActive: false, page, limit },
        })
      ),
    ]);
    const byId = new Map<string, PromotionalCampaign>();
    [...active, ...inactive].forEach(c => byId.set(c.id, c));
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

// Matches CreatePromotionalCampaignDto/UpdatePromotionalCampaignDto. The nullable fields below
// must be sent as explicit `null` to clear them on an existing campaign, not omitted — Prisma's
// update() treats an absent key as "leave this column alone", not "clear it", so `undefined`
// silently no-ops instead of clearing (e.g. switching an existing campaign back to "All zones").
export interface CampaignPayload {
  type: CampaignType;
  targetType?: CampaignTargetType;
  categoryId?: string | null;
  subCategoryId?: string | null;
  serviceItemId?: string | null;
  zoneId?: string | null;
  title?: string | null;
  subtitle?: string | null;
  highlightText?: string | null;
  mediaType: MediaType;
  s3Key: string;
  cdnUrl?: string | null;
  ctaText?: string | null;
  ctaDeeplink?: string | null;
  displayOrder?: number;
  isActive?: boolean;
  // Not widened to `| null` like the fields above — see the comment in CampaignModal.tsx's
  // handleSubmit on why clearing these two isn't safe to fix the same way yet.
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
