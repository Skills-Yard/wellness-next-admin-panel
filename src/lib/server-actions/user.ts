import axiosInstance from '../axios';
import { parseServerError } from '../errorParser';
import {
  User,
  UserFilter,
  UserAddress,
  UserDeviceToken,
  UserNotificationPreference,
  UpdateUserPayload,
} from '../../types/user';

function unwrap<T>(resData: any, fallback: T): T {
  if (resData && typeof resData === 'object' && 'data' in resData) return resData.data;
  return (resData ?? fallback) as T;
}

export async function getAuthHeadersClientOrServer() {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('wellness_admin_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const token = cookieStore.get('wellness_admin_token')?.value;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch (e) {
    return {};
  }
}

export async function getUsersServerAction(filter?: UserFilter): Promise<User[]> {
  try {
    const headers = await getAuthHeadersClientOrServer();
    const response = await axiosInstance.get('/admin/users', {
      headers,
      params: {
        ...(filter?.skip !== undefined ? { skip: filter.skip } : {}),
        ...(filter?.take !== undefined ? { take: filter.take } : {}),
        include: '_count',
      },
    });
    const data = unwrap<User[]>(response.data, []);
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    console.error('[getUsersServerAction]', error?.response?.data || error.message);
    return [];
  }
}

export async function getUserByIdServerAction(id: string): Promise<User | null> {
  try {
    const headers = await getAuthHeadersClientOrServer();
    const response = await axiosInstance.get(`/admin/users/${id}`, { headers });
    return unwrap<User | null>(response.data, null);
  } catch (error: any) {
    console.error('[getUserByIdServerAction]', error?.response?.data || error.message);
    return null;
  }
}

export async function updateUserServerAction(
  id: string,
  payload: UpdateUserPayload
): Promise<{ ok: boolean; data?: User; message?: string }> {
  try {
    const headers = await getAuthHeadersClientOrServer();
    const response = await axiosInstance.patch(`/admin/users/${id}`, payload, { headers });
    return { ok: true, data: unwrap(response.data, response.data) };
  } catch (error: any) {
    console.error('[updateUserServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to update user') };
  }
}

export async function deleteUserServerAction(id: string): Promise<{ ok: boolean; message?: string }> {
  try {
    const headers = await getAuthHeadersClientOrServer();
    await axiosInstance.delete(`/admin/users/${id}`, { headers });
    return { ok: true };
  } catch (error: any) {
    console.error('[deleteUserServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to delete user') };
  }
}

// User Addresses
export async function addUserAddressServerAction(
  userId: string,
  dto: any
): Promise<{ ok: boolean; data?: UserAddress; message?: string }> {
  try {
    const headers = await getAuthHeadersClientOrServer();
    const response = await axiosInstance.post(`/admin/users/${userId}/addresses`, dto, { headers });
    return { ok: true, data: unwrap(response.data, response.data) };
  } catch (error: any) {
    console.error('[addUserAddressServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to add address') };
  }
}

export async function updateUserAddressServerAction(
  addressId: string,
  dto: any
): Promise<{ ok: boolean; data?: UserAddress; message?: string }> {
  try {
    const headers = await getAuthHeadersClientOrServer();
    const response = await axiosInstance.patch(`/admin/users/addresses/${addressId}`, dto, { headers });
    return { ok: true, data: unwrap(response.data, response.data) };
  } catch (error: any) {
    console.error('[updateUserAddressServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to update address') };
  }
}

export async function deleteUserAddressServerAction(
  addressId: string
): Promise<{ ok: boolean; message?: string }> {
  try {
    const headers = await getAuthHeadersClientOrServer();
    await axiosInstance.delete(`/admin/users/addresses/${addressId}`, { headers });
    return { ok: true };
  } catch (error: any) {
    console.error('[deleteUserAddressServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to delete address') };
  }
}

// Device Tokens
export async function upsertUserDeviceTokenServerAction(
  userId: string,
  dto: any
): Promise<{ ok: boolean; data?: UserDeviceToken; message?: string }> {
  try {
    const headers = await getAuthHeadersClientOrServer();
    const response = await axiosInstance.put(`/admin/users/${userId}/device-token`, dto, { headers });
    return { ok: true, data: unwrap(response.data, response.data) };
  } catch (error: any) {
    console.error('[upsertUserDeviceTokenServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to update device token') };
  }
}

export async function updateUserDeviceTokenServerAction(
  tokenId: string,
  dto: any
): Promise<{ ok: boolean; data?: UserDeviceToken; message?: string }> {
  try {
    const headers = await getAuthHeadersClientOrServer();
    const response = await axiosInstance.patch(`/admin/users/device-tokens/${tokenId}`, dto, { headers });
    return { ok: true, data: unwrap(response.data, response.data) };
  } catch (error: any) {
    console.error('[updateUserDeviceTokenServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to update device token') };
  }
}

// Notification Preferences
export async function updateUserNotificationPreferenceServerAction(
  userId: string,
  data: Partial<UserNotificationPreference>
): Promise<{ ok: boolean; data?: UserNotificationPreference; message?: string }> {
  try {
    const headers = await getAuthHeadersClientOrServer();
    const response = await axiosInstance.patch(
      `/admin/users/${userId}/notification-preference`,
      data,
      { headers }
    );
    return { ok: true, data: unwrap(response.data, response.data) };
  } catch (error: any) {
    console.error('[updateUserNotificationPreferenceServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to update notification preferences') };
  }
}
