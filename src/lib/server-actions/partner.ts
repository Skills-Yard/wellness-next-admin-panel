'use server';

import axiosInstance from '../axios';
import { getAuthHeaders, ActionResult } from './category';
import { parseServerError } from '../errorParser';
import {
  Partner,
  PartnerFilter,
  PartnerServiceItem,
  PartnerAvailabilityItem,
  PartnerBooking,
  PartnerReview,
} from '../../types/partner';

function unwrap<T>(resData: any, fallback: T): T {
  if (resData && typeof resData === 'object' && 'data' in resData) return resData.data;
  return (resData ?? fallback) as T;
}

export async function getPartnersServerAction(filter?: PartnerFilter): Promise<Partner[]> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.get('/admin/partners', {
      headers,
      params: {
        ...(filter?.status ? { status: filter.status } : {}),
        ...(filter?.isActive !== undefined ? { isActive: filter.isActive } : {}),
        ...(filter?.city ? { city: filter.city } : {}),
        ...(filter?.skip !== undefined ? { skip: filter.skip } : {}),
        ...(filter?.take !== undefined ? { take: filter.take } : {}),
      },
    });
    const data = unwrap<Partner[]>(response.data, []);
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    console.error('[getPartnersServerAction]', error?.response?.data || error.message);
    return [];
  }
}

export async function getPartnerByIdServerAction(id: string): Promise<Partner | null> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.get(`/admin/partners/${id}`, { headers });
    return unwrap<Partner | null>(response.data, null);
  } catch (error: any) {
    console.error('[getPartnerByIdServerAction]', error?.response?.data || error.message);
    return null;
  }
}

export async function approvePartnerServerAction(id: string): Promise<ActionResult<Partner>> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.patch(`/admin/partners/${id}/approve`, {}, { headers });
    return { ok: true, data: unwrap(response.data, response.data) };
  } catch (error: any) {
    console.error('[approvePartnerServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to approve partner') };
  }
}

export async function rejectPartnerServerAction(id: string, reason?: string): Promise<ActionResult<Partner>> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.patch(`/admin/partners/${id}/reject`, { reason }, { headers });
    return { ok: true, data: unwrap(response.data, response.data) };
  } catch (error: any) {
    console.error('[rejectPartnerServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to reject partner') };
  }
}

export async function suspendPartnerServerAction(id: string): Promise<ActionResult<Partner>> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.patch(`/admin/partners/${id}/suspend`, {}, { headers });
    return { ok: true, data: unwrap(response.data, response.data) };
  } catch (error: any) {
    console.error('[suspendPartnerServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to suspend partner') };
  }
}

export async function deletePartnerServerAction(id: string): Promise<ActionResult<void>> {
  try {
    const headers = await getAuthHeaders();
    await axiosInstance.delete(`/admin/partners/${id}`, { headers });
    return { ok: true, data: undefined };
  } catch (error: any) {
    console.error('[deletePartnerServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to delete partner') };
  }
}

export async function approvePartnerKycServerAction(id: string): Promise<ActionResult<{ success: boolean; message: string }>> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.patch(`/admin/partners/${id}/approve-kyc`, {}, { headers });
    return { ok: true, data: unwrap(response.data, response.data) };
  } catch (error: any) {
    console.error('[approvePartnerKycServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to approve KYC') };
  }
}

export async function rejectPartnerKycServerAction(id: string, reason: string): Promise<ActionResult<{ success: boolean; message: string }>> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.patch(`/admin/partners/${id}/reject-kyc`, { reason }, { headers });
    return { ok: true, data: unwrap(response.data, response.data) };
  } catch (error: any) {
    console.error('[rejectPartnerKycServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to reject KYC') };
  }
}

export async function getPartnerKycDocUrlsServerAction(id: string): Promise<Record<string, string>> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.get(`/admin/partners/${id}/kyc/document-urls`, { headers });
    return unwrap<Record<string, string>>(response.data, {});
  } catch (error: any) {
    console.error('[getPartnerKycDocUrlsServerAction]', error?.response?.data || error.message);
    return {};
  }
}

export async function verifyPartnerBankServerAction(id: string, isVerified: boolean): Promise<ActionResult<any>> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.patch(`/admin/partners/${id}/verify-bank`, { isVerified }, { headers });
    return { ok: true, data: unwrap(response.data, response.data) };
  } catch (error: any) {
    console.error('[verifyPartnerBankServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to verify bank account') };
  }
}

// Services
export async function getPartnerServicesServerAction(id: string): Promise<PartnerServiceItem[]> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.get(`/admin/partners/${id}/services`, { headers });
    const data = unwrap<PartnerServiceItem[]>(response.data, []);
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    console.error('[getPartnerServicesServerAction]', error?.response?.data || error.message);
    return [];
  }
}

export async function setPartnerServicesServerAction(id: string, serviceItemIds: string[]): Promise<ActionResult<PartnerServiceItem[]>> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.post(`/admin/partners/${id}/services`, { serviceItemIds }, { headers });
    return { ok: true, data: unwrap(response.data, response.data) };
  } catch (error: any) {
    console.error('[setPartnerServicesServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to update partner services') };
  }
}

export async function updatePartnerServiceServerAction(
  id: string,
  serviceItemId: string,
  payload: { customPrice?: number; isActive?: boolean }
): Promise<ActionResult<PartnerServiceItem>> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.patch(`/admin/partners/${id}/services/${serviceItemId}`, payload, { headers });
    return { ok: true, data: unwrap(response.data, response.data) };
  } catch (error: any) {
    console.error('[updatePartnerServiceServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to update service') };
  }
}

export async function removePartnerServiceServerAction(id: string, serviceItemId: string): Promise<ActionResult<void>> {
  try {
    const headers = await getAuthHeaders();
    await axiosInstance.delete(`/admin/partners/${id}/services/${serviceItemId}`, { headers });
    return { ok: true, data: undefined };
  } catch (error: any) {
    console.error('[removePartnerServiceServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to remove service') };
  }
}

// Availability
export async function getPartnerAvailabilityServerAction(id: string): Promise<PartnerAvailabilityItem[]> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.get(`/admin/partners/${id}/availability`, { headers });
    const data = unwrap<PartnerAvailabilityItem[]>(response.data, []);
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    console.error('[getPartnerAvailabilityServerAction]', error?.response?.data || error.message);
    return [];
  }
}

export async function setPartnerAvailabilityServerAction(
  id: string,
  schedules: PartnerAvailabilityItem[]
): Promise<ActionResult<PartnerAvailabilityItem[]>> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.post(`/admin/partners/${id}/availability`, { schedules }, { headers });
    return { ok: true, data: unwrap(response.data, response.data) };
  } catch (error: any) {
    console.error('[setPartnerAvailabilityServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to update schedule') };
  }
}

// Bookings
export async function getPartnerBookingsServerAction(id: string): Promise<PartnerBooking[]> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.get(`/admin/partners/${id}/bookings`, { headers });
    const data = unwrap<PartnerBooking[]>(response.data, []);
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    console.error('[getPartnerBookingsServerAction]', error?.response?.data || error.message);
    return [];
  }
}

// Reviews
export async function getPartnerReviewsServerAction(id: string): Promise<PartnerReview[]> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.get(`/admin/partners/${id}/reviews`, { headers });
    const data = unwrap<PartnerReview[]>(response.data, []);
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    console.error('[getPartnerReviewsServerAction]', error?.response?.data || error.message);
    return [];
  }
}
