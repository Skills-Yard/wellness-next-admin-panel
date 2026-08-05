'use server';

import axiosInstance from '../axios';
import {
  OperationalZone,
  ZoneServiceItemConfig,
  ZoneDurationConfig,
  ZonePackageConfig,
  ZoneAddOnConfig,
} from '../../types/catalogue';
import { ActionResult, getAuthHeaders } from './category';
import { parseServerError } from '../errorParser';

function unwrap<T>(resData: any, fallback: T): T {
  if (resData && typeof resData === 'object' && 'data' in resData) return resData.data;
  return (resData ?? fallback) as T;
}

// Zones themselves are created/managed outside this admin panel (see AdminOperationalZoneController) —
// this is a read-only list used to populate zone pickers elsewhere in the catalogue.
export async function getZonesServerAction(): Promise<OperationalZone[]> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.get('/admin/zones', { headers });
    const data = unwrap<OperationalZone[]>(response.data, []);
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    console.error('[getZonesServerAction]', error?.response?.data || error.message);
    return [];
  }
}

// ---- Zone Service-Item Configs (availability + surge multiplier) ----
// The list endpoint only accepts an optional zoneId filter (no serviceItemId filter) — passing
// none returns every config row across all zones, which callers filter client-side.

export async function getZoneServiceItemConfigsServerAction(): Promise<ZoneServiceItemConfig[]> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.get('/admin/zones/service-item-configs', { headers });
    const data = unwrap<ZoneServiceItemConfig[]>(response.data, []);
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    console.error('[getZoneServiceItemConfigsServerAction]', error?.response?.data || error.message);
    return [];
  }
}

export interface ZoneServiceItemConfigPayload {
  zoneId: string;
  serviceItemId: string;
  isAvailable?: boolean;
  surgeMultiplier?: number;
}

export async function saveZoneServiceItemConfigServerAction(
  id: string | null,
  payload: ZoneServiceItemConfigPayload
): Promise<ActionResult<ZoneServiceItemConfig>> {
  try {
    const headers = await getAuthHeaders();
    const response = id
      ? await axiosInstance.patch(`/admin/zones/service-item-configs/${id}`, payload, { headers })
      : await axiosInstance.post('/admin/zones/service-item-configs', payload, { headers });
    return { ok: true, data: unwrap(response.data, response.data) };
  } catch (error: any) {
    console.error('[saveZoneServiceItemConfigServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to save zone availability') };
  }
}

export async function deleteZoneServiceItemConfigServerAction(id: string): Promise<ActionResult<void>> {
  try {
    const headers = await getAuthHeaders();
    await axiosInstance.delete(`/admin/zones/service-item-configs/${id}`, { headers });
    return { ok: true, data: undefined };
  } catch (error: any) {
    console.error('[deleteZoneServiceItemConfigServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to remove zone availability') };
  }
}

// ---- Zone Duration Configs (per-zone price override) ----

export async function getZoneDurationConfigsServerAction(): Promise<ZoneDurationConfig[]> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.get('/admin/zones/duration-configs', { headers });
    const data = unwrap<ZoneDurationConfig[]>(response.data, []);
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    console.error('[getZoneDurationConfigsServerAction]', error?.response?.data || error.message);
    return [];
  }
}

export interface ZoneDurationConfigPayload {
  zoneId: string;
  serviceDurationId: string;
  price: number;
  discountedPrice?: number;
}

export async function saveZoneDurationConfigServerAction(
  id: string | null,
  payload: ZoneDurationConfigPayload
): Promise<ActionResult<ZoneDurationConfig>> {
  try {
    const headers = await getAuthHeaders();
    const response = id
      ? await axiosInstance.patch(`/admin/zones/duration-configs/${id}`, payload, { headers })
      : await axiosInstance.post('/admin/zones/duration-configs', payload, { headers });
    return { ok: true, data: unwrap(response.data, response.data) };
  } catch (error: any) {
    console.error('[saveZoneDurationConfigServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to save zone duration price') };
  }
}

export async function deleteZoneDurationConfigServerAction(id: string): Promise<ActionResult<void>> {
  try {
    const headers = await getAuthHeaders();
    await axiosInstance.delete(`/admin/zones/duration-configs/${id}`, { headers });
    return { ok: true, data: undefined };
  } catch (error: any) {
    console.error('[deleteZoneDurationConfigServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to remove zone duration price') };
  }
}

// ---- Zone Package Configs (per-zone price override) ----

export async function getZonePackageConfigsServerAction(): Promise<ZonePackageConfig[]> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.get('/admin/zones/package-configs', { headers });
    const data = unwrap<ZonePackageConfig[]>(response.data, []);
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    console.error('[getZonePackageConfigsServerAction]', error?.response?.data || error.message);
    return [];
  }
}

export interface ZonePackageConfigPayload {
  zoneId: string;
  servicePackageId: string;
  price: number;
  originalPrice?: number;
  savings?: number;
  savingsPercent?: number;
}

export async function saveZonePackageConfigServerAction(
  id: string | null,
  payload: ZonePackageConfigPayload
): Promise<ActionResult<ZonePackageConfig>> {
  try {
    const headers = await getAuthHeaders();
    const response = id
      ? await axiosInstance.patch(`/admin/zones/package-configs/${id}`, payload, { headers })
      : await axiosInstance.post('/admin/zones/package-configs', payload, { headers });
    return { ok: true, data: unwrap(response.data, response.data) };
  } catch (error: any) {
    console.error('[saveZonePackageConfigServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to save zone package price') };
  }
}

export async function deleteZonePackageConfigServerAction(id: string): Promise<ActionResult<void>> {
  try {
    const headers = await getAuthHeaders();
    await axiosInstance.delete(`/admin/zones/package-configs/${id}`, { headers });
    return { ok: true, data: undefined };
  } catch (error: any) {
    console.error('[deleteZonePackageConfigServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to remove zone package price') };
  }
}

// ---- Zone Add-On Configs (per-zone price override) ----

export async function getZoneAddOnConfigsServerAction(): Promise<ZoneAddOnConfig[]> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.get('/admin/zones/add-on-configs', { headers });
    const data = unwrap<ZoneAddOnConfig[]>(response.data, []);
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    console.error('[getZoneAddOnConfigsServerAction]', error?.response?.data || error.message);
    return [];
  }
}

export interface ZoneAddOnConfigPayload {
  zoneId: string;
  serviceAddOnId: string;
  price: number;
}

export async function saveZoneAddOnConfigServerAction(
  id: string | null,
  payload: ZoneAddOnConfigPayload
): Promise<ActionResult<ZoneAddOnConfig>> {
  try {
    const headers = await getAuthHeaders();
    const response = id
      ? await axiosInstance.patch(`/admin/zones/add-on-configs/${id}`, payload, { headers })
      : await axiosInstance.post('/admin/zones/add-on-configs', payload, { headers });
    return { ok: true, data: unwrap(response.data, response.data) };
  } catch (error: any) {
    console.error('[saveZoneAddOnConfigServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to save zone add-on price') };
  }
}

export async function deleteZoneAddOnConfigServerAction(id: string): Promise<ActionResult<void>> {
  try {
    const headers = await getAuthHeaders();
    await axiosInstance.delete(`/admin/zones/add-on-configs/${id}`, { headers });
    return { ok: true, data: undefined };
  } catch (error: any) {
    console.error('[deleteZoneAddOnConfigServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to remove zone add-on price') };
  }
}
