'use server';

import axiosInstance from '../axios';
import { Booking } from '../../types/booking';
import { getAuthHeaders, ActionResult } from './category';

function unwrap<T>(resData: any, fallback: T): T {
  if (resData && typeof resData === 'object' && 'data' in resData) return resData.data;
  return (resData ?? fallback) as T;
}

export async function getBookingsServerAction(): Promise<Booking[]> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.get('/admin/bookings/all', { headers });
    const data = unwrap<Booking[]>(response.data, []);
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    console.error('[getBookingsServerAction]', error?.response?.data || error.message);
    return [];
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
