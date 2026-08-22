'use server';

import axiosInstance from '../axios';
import { Booking } from '../../types/booking';
import { getAuthHeaders, ActionResult } from './category';
import { fetchAllPaginated, PaginatedEnvelope } from './pagination';

function unwrap<T>(resData: any, fallback: T): T {
  if (resData && typeof resData === 'object' && 'data' in resData) return resData.data;
  return (resData ?? fallback) as T;
}

// Deliberately doesn't catch-and-return-[] on failure (unlike most list actions in this
// directory) — its only callers (Dashboard, the Bookings list page) need to tell "genuinely no
// bookings" apart from "the request failed", so they can show a retry state instead of silently
// rendering an empty/zeroed page as if it were real data. Let the error propagate; callers catch it.
export async function getBookingsServerAction(): Promise<Booking[]> {
  const headers = await getAuthHeaders();
  return fetchAllPaginated<Booking>((page, limit) =>
    axiosInstance.get<PaginatedEnvelope<Booking>>('/admin/bookings/all', {
      headers,
      params: { page, limit },
    })
  );
}

// Single-page counterpart to getBookingsServerAction — one backend call, no fetchAllPaginated
// walk. Used by BookingListTable's own list rendering/pagination.
//
// q searches customer name + partner name only — phone is encrypted at rest and not
// substring-searchable server-side (see GetBookingsQueryDto.q on the backend), so the old
// phone-search affordance in the search box's placeholder text is gone rather than pretended.
//
// status is passed straight through to the backend's `status` filter, which now accepts either
// one value (e.g. "COMPLETED") or a comma-separated list (e.g.
// "IN_PROGRESS,PARTNER_ARRIVED,PARTNER_EN_ROUTE") matched with an IN (...) — see
// GetBookingsQueryDto.status on the backend and BookingListTable's TAB_STATUS for the groupings
// each tab sends.
export async function getBookingsPagedServerAction(params: {
  page?: number;
  limit?: number;
  q?: string;
  status?: string;
}): Promise<PaginatedEnvelope<Booking>> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 10;
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.get<PaginatedEnvelope<Booking>>('/admin/bookings/all', {
      headers,
      params: {
        ...(params.status ? { status: params.status } : {}),
        ...(params.q ? { q: params.q } : {}),
        page,
        limit,
      },
    });
    return response.data;
  } catch (error: any) {
    console.error('[getBookingsPagedServerAction]', error?.response?.data || error.message);
    return { data: [], pagination: { total: 0, page, limit, totalPages: 1 } };
  }
}

export async function getBookingByIdServerAction(id: string): Promise<Booking | null> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.get(`/admin/bookings/${id}`, { headers });
    return unwrap<Booking | null>(response.data, null);
  } catch (error: any) {
    console.error('[getBookingByIdServerAction]', error?.response?.data || error.message);
    return null;
  }
}

export async function cancelBookingServerAction(id: string, reason?: string): Promise<ActionResult<any>> {
  try {
    const headers = await getAuthHeaders();
    const res = await axiosInstance.post(
      `/admin/bookings/${id}/cancel`,
      { reason: reason?.trim() || 'Cancelled by Admin' },
      { headers }
    );
    return { ok: true, data: res.data };
  } catch (error: any) {
    return { ok: false, message: error?.response?.data?.message || 'Failed to cancel booking' };
  }
}

export async function updateBookingServerAction(id: string, payload: Partial<Booking>): Promise<ActionResult<any>> {
  try {
    const headers = await getAuthHeaders();
    const res = await axiosInstance.patch(`/admin/bookings/${id}`, payload, { headers });
    return { ok: true, data: res.data };
  } catch (error: any) {
    return { ok: false, message: error?.response?.data?.message || 'Failed to update booking' };
  }
}
