import axiosInstance from '../axios';
import { getAuthHeaders, ActionResult } from './category';
import { parseServerError } from '../errorParser';
import { PaginatedEnvelope } from './pagination';
import {
  AudienceFilter,
  BroadcastAudienceType,
  BroadcastFilter,
  CreateBroadcastPayload,
  NotificationBroadcast,
} from '../../types/notification';

function unwrap<T>(resData: any, fallback: T): T {
  if (resData && typeof resData === 'object' && 'data' in resData) return resData.data;
  return (resData ?? fallback) as T;
}

const BASE = '/admin/notifications/broadcast';

// Live count for ALL_*/SEGMENT_* audiences — SELECTED_* isn't accepted here,
// the panel counts its own chosen recipientIds client-side (see backend
// AudiencePreviewQueryDto).
export async function getAudiencePreviewServerAction(
  audienceType: Exclude<BroadcastAudienceType, 'SELECTED_USERS' | 'SELECTED_PARTNERS'>,
  filter?: AudienceFilter
): Promise<{ count: number }> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.get(`${BASE}/audience-preview`, {
      headers,
      params: { audienceType, ...filter },
    });
    return unwrap(response.data, { count: 0 });
  } catch (error: any) {
    console.error('[getAudiencePreviewServerAction]', error?.response?.data || error.message);
    return { count: 0 };
  }
}

export async function createBroadcastServerAction(
  payload: CreateBroadcastPayload
): Promise<ActionResult<NotificationBroadcast>> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.post(BASE, payload, { headers });
    return { ok: true, data: unwrap(response.data, response.data) };
  } catch (error: any) {
    console.error('[createBroadcastServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to send broadcast') };
  }
}

export async function getBroadcastsPagedServerAction(params: {
  page?: number;
  limit?: number;
  status?: BroadcastFilter['status'];
}): Promise<PaginatedEnvelope<NotificationBroadcast>> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 10;
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.get<PaginatedEnvelope<NotificationBroadcast>>(BASE, {
      headers,
      params: {
        ...(params.status?.length ? { status: params.status.join(',') } : {}),
        page,
        limit,
      },
    });
    return response.data;
  } catch (error: any) {
    console.error('[getBroadcastsPagedServerAction]', error?.response?.data || error.message);
    return { data: [], pagination: { total: 0, page, limit, totalPages: 1 } };
  }
}

export async function getBroadcastByIdServerAction(id: string): Promise<NotificationBroadcast | null> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.get(`${BASE}/${id}`, { headers });
    return unwrap<NotificationBroadcast | null>(response.data, null);
  } catch (error: any) {
    console.error('[getBroadcastByIdServerAction]', error?.response?.data || error.message);
    return null;
  }
}
