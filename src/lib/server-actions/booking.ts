'use server';

import axiosInstance from '../axios';
import { Booking } from '../../types/booking';
import { getAuthHeaders, ActionResult } from './category';

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
  const response = await axiosInstance.get('/admin/bookings/all', { headers });
  const data = unwrap<Booking[]>(response.data, []);
  return Array.isArray(data) ? data : [];
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
