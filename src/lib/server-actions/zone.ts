'use server';

import axiosInstance from '../axios';
import {
  OperationalZone,
  Coordinate,
  ZoneServiceItemConfig,
  ZoneDurationConfig,
  ZonePackageConfig,
  ZoneAddOnConfig,
  ZoneSuiteConfig,
} from '../../types/catalogue';
import { ActionResult, getAuthHeaders } from './category';
import { parseServerError } from '../errorParser';
import { fetchAllPaginated, PaginatedEnvelope } from './pagination';

function unwrap<T>(resData: any, fallback: T): T {
  if (resData && typeof resData === 'object' && 'data' in resData) return resData.data;
  return (resData ?? fallback) as T;
}

// AdminOperationalZoneController — list/detail/metadata-edit/delete for zone entities.
export async function getZonesServerAction(filters?: { city?: string; isActive?: boolean }): Promise<OperationalZone[]> {
  try {
    const headers = await getAuthHeaders();
    return await fetchAllPaginated<OperationalZone>((page, limit) =>
      axiosInstance.get<PaginatedEnvelope<OperationalZone>>('/admin/zones', {
        headers,
        params: {
          city: filters?.city || undefined,
          isActive: filters?.isActive === undefined ? undefined : String(filters.isActive),
          page,
          limit,
        },
      })
    );
  } catch (error: any) {
    console.error('[getZonesServerAction]', error?.response?.data || error.message);
    return [];
  }
}

// Single-page counterpart to getZonesServerAction — one backend call, no fetchAllPaginated walk.
// Used by ZonesView's own list rendering/pagination.
export async function getZonesPagedServerAction(params: {
  page?: number;
  limit?: number;
  q?: string;
  city?: string;
  isActive?: boolean;
}): Promise<PaginatedEnvelope<OperationalZone>> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 10;
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.get<PaginatedEnvelope<OperationalZone>>('/admin/zones', {
      headers,
      params: {
        ...(params.city ? { city: params.city } : {}),
        ...(params.isActive === undefined ? {} : { isActive: String(params.isActive) }),
        ...(params.q ? { q: params.q } : {}),
        page,
        limit,
      },
    });
    return response.data;
  } catch (error: any) {
    console.error('[getZonesPagedServerAction]', error?.response?.data || error.message);
    return { data: [], pagination: { total: 0, page, limit, totalPages: 1 } };
  }
}

export async function getZoneByIdServerAction(id: string): Promise<OperationalZone | null> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.get(`/admin/zones/detail/${id}`, { headers });
    return unwrap<OperationalZone | null>(response.data, null);
  } catch (error: any) {
    console.error('[getZoneByIdServerAction]', error?.response?.data || error.message);
    return null;
  }
}

// ZoneController (not AdminOperationalZoneController) — computes and stores full H3 hex
// coverage from a drawn polygon in one atomic transaction. Matches CreateZoneDto. Note the
// doubled path: AdminZoneModule mounts at admin/zones and this controller additionally
// declares @Controller('admin/zones'), so the real route is /admin/zones/admin/zones.
export interface CreateZoneWithPolygonPayload {
  name: string;
  city: string;
  coordinates: Coordinate[];
}

export async function createZoneWithPolygonServerAction(
  payload: CreateZoneWithPolygonPayload
): Promise<ActionResult<OperationalZone>> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.post('/admin/zones/admin/zones', payload, { headers });
    return { ok: true, data: unwrap(response.data, response.data) };
  } catch (error: any) {
    console.error('[createZoneWithPolygonServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to create zone') };
  }
}

// Matches UpdateOperationalZoneDto. Deliberately excludes h3Index: it has no matching column
// on OperationalZone (boundary lives on OperationalZoneHex instead) and the backend 500s if
// it's ever sent. There is no endpoint to redraw a zone's boundary after creation — only
// name/city/isActive can be changed here; a new boundary means creating a new zone.
export interface UpdateZonePayload {
  name?: string;
  city?: string;
  isActive?: boolean;
}

export async function updateZoneServerAction(
  id: string,
  payload: UpdateZonePayload
): Promise<ActionResult<OperationalZone>> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.patch(`/admin/zones/detail/${id}`, payload, { headers });
    return { ok: true, data: unwrap(response.data, response.data) };
  } catch (error: any) {
    console.error('[updateZoneServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to update zone') };
  }
}

export async function deleteZoneServerAction(id: string): Promise<ActionResult<void>> {
  try {
    const headers = await getAuthHeaders();
    await axiosInstance.delete(`/admin/zones/detail/${id}`, { headers });
    return { ok: true, data: undefined };
  } catch (error: any) {
    console.error('[deleteZoneServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to delete zone') };
  }
}

// ---- Zone Service-Item Configs (availability + surge multiplier) ----
// The list endpoint only accepts an optional zoneId filter (no serviceItemId filter) — passing
// none returns every config row across all zones, which callers filter client-side.

export async function getZoneServiceItemConfigsServerAction(): Promise<ZoneServiceItemConfig[]> {
  try {
    const headers = await getAuthHeaders();
    return await fetchAllPaginated<ZoneServiceItemConfig>((page, limit) =>
      axiosInstance.get<PaginatedEnvelope<ZoneServiceItemConfig>>('/admin/zones/service-item-configs', {
        headers,
        params: { page, limit },
      })
    );
  } catch (error: any) {
    console.error('[getZoneServiceItemConfigsServerAction]', error?.response?.data || error.message);
    return [];
  }
}

// zoneId-scoped, single-page counterpart to getZoneServiceItemConfigsServerAction — the same
// GET endpoint, but with the zoneId filter applied server-side instead of pulling every zone's
// rows and filtering client-side (see ZoneDetailView, the only caller: this is the fix for its
// old zones × catalog-items full-table pull). getZoneServiceItemConfigsServerAction (unfiltered,
// full list) stays alive — ZoneConfigModal/ServiceZoneCard/DurationModal/PackModal/
// ZoneOverrideModal still need the complete cross-zone list for their "already configured in
// zone X" checks and "apply to all zones" fan-out, which have no zoneId to scope by up front.
export async function getZoneServiceItemConfigsPagedServerAction(
  zoneId: string,
  page = 1,
  limit = 10
): Promise<PaginatedEnvelope<ZoneServiceItemConfig>> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.get<PaginatedEnvelope<ZoneServiceItemConfig>>(
      '/admin/zones/service-item-configs',
      { headers, params: { zoneId, page, limit } }
    );
    return response.data;
  } catch (error: any) {
    console.error('[getZoneServiceItemConfigsPagedServerAction]', error?.response?.data || error.message);
    return { data: [], pagination: { total: 0, page, limit, totalPages: 1 } };
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
    return await fetchAllPaginated<ZoneDurationConfig>((page, limit) =>
      axiosInstance.get<PaginatedEnvelope<ZoneDurationConfig>>('/admin/zones/duration-configs', {
        headers,
        params: { page, limit },
      })
    );
  } catch (error: any) {
    console.error('[getZoneDurationConfigsServerAction]', error?.response?.data || error.message);
    return [];
  }
}

// See getZoneServiceItemConfigsPagedServerAction's comment above — same zoneId-scoped, single-page
// pattern.
export async function getZoneDurationConfigsPagedServerAction(
  zoneId: string,
  page = 1,
  limit = 10
): Promise<PaginatedEnvelope<ZoneDurationConfig>> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.get<PaginatedEnvelope<ZoneDurationConfig>>(
      '/admin/zones/duration-configs',
      { headers, params: { zoneId, page, limit } }
    );
    return response.data;
  } catch (error: any) {
    console.error('[getZoneDurationConfigsPagedServerAction]', error?.response?.data || error.message);
    return { data: [], pagination: { total: 0, page, limit, totalPages: 1 } };
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
    return await fetchAllPaginated<ZonePackageConfig>((page, limit) =>
      axiosInstance.get<PaginatedEnvelope<ZonePackageConfig>>('/admin/zones/package-configs', {
        headers,
        params: { page, limit },
      })
    );
  } catch (error: any) {
    console.error('[getZonePackageConfigsServerAction]', error?.response?.data || error.message);
    return [];
  }
}

// See getZoneServiceItemConfigsPagedServerAction's comment above — same zoneId-scoped, single-page
// pattern.
export async function getZonePackageConfigsPagedServerAction(
  zoneId: string,
  page = 1,
  limit = 10
): Promise<PaginatedEnvelope<ZonePackageConfig>> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.get<PaginatedEnvelope<ZonePackageConfig>>(
      '/admin/zones/package-configs',
      { headers, params: { zoneId, page, limit } }
    );
    return response.data;
  } catch (error: any) {
    console.error('[getZonePackageConfigsPagedServerAction]', error?.response?.data || error.message);
    return { data: [], pagination: { total: 0, page, limit, totalPages: 1 } };
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
    return await fetchAllPaginated<ZoneAddOnConfig>((page, limit) =>
      axiosInstance.get<PaginatedEnvelope<ZoneAddOnConfig>>('/admin/zones/add-on-configs', {
        headers,
        params: { page, limit },
      })
    );
  } catch (error: any) {
    console.error('[getZoneAddOnConfigsServerAction]', error?.response?.data || error.message);
    return [];
  }
}

// See getZoneServiceItemConfigsPagedServerAction's comment above — same zoneId-scoped, single-page
// pattern.
export async function getZoneAddOnConfigsPagedServerAction(
  zoneId: string,
  page = 1,
  limit = 10
): Promise<PaginatedEnvelope<ZoneAddOnConfig>> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.get<PaginatedEnvelope<ZoneAddOnConfig>>(
      '/admin/zones/add-on-configs',
      { headers, params: { zoneId, page, limit } }
    );
    return response.data;
  } catch (error: any) {
    console.error('[getZoneAddOnConfigsPagedServerAction]', error?.response?.data || error.message);
    return { data: [], pagination: { total: 0, page, limit, totalPages: 1 } };
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

// ---- Zone Suite Configs (per-zone suite availability, no pricing) ----
// Controls which Suites show up in a zone's category browse flow — see ZoneSuiteConfig in
// wellness-backend/prisma/schema/zone.prisma. Same "list has no per-entity filter" caveat as
// the four config lists above.

export async function getZoneSuiteConfigsServerAction(): Promise<ZoneSuiteConfig[]> {
  try {
    const headers = await getAuthHeaders();
    return await fetchAllPaginated<ZoneSuiteConfig>((page, limit) =>
      axiosInstance.get<PaginatedEnvelope<ZoneSuiteConfig>>('/admin/zones/suite-configs', {
        headers,
        params: { page, limit },
      })
    );
  } catch (error: any) {
    console.error('[getZoneSuiteConfigsServerAction]', error?.response?.data || error.message);
    return [];
  }
}

// See getZoneServiceItemConfigsPagedServerAction's comment above — same zoneId-scoped, single-page
// pattern.
export async function getZoneSuiteConfigsPagedServerAction(
  zoneId: string,
  page = 1,
  limit = 10
): Promise<PaginatedEnvelope<ZoneSuiteConfig>> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.get<PaginatedEnvelope<ZoneSuiteConfig>>(
      '/admin/zones/suite-configs',
      { headers, params: { zoneId, page, limit } }
    );
    return response.data;
  } catch (error: any) {
    console.error('[getZoneSuiteConfigsPagedServerAction]', error?.response?.data || error.message);
    return { data: [], pagination: { total: 0, page, limit, totalPages: 1 } };
  }
}

export interface ZoneSuiteConfigPayload {
  zoneId: string;
  suiteId: string;
  isAvailable?: boolean;
}

export async function saveZoneSuiteConfigServerAction(
  id: string | null,
  payload: ZoneSuiteConfigPayload
): Promise<ActionResult<ZoneSuiteConfig>> {
  try {
    const headers = await getAuthHeaders();
    const response = id
      ? await axiosInstance.patch(`/admin/zones/suite-configs/${id}`, payload, { headers })
      : await axiosInstance.post('/admin/zones/suite-configs', payload, { headers });
    return { ok: true, data: unwrap(response.data, response.data) };
  } catch (error: any) {
    console.error('[saveZoneSuiteConfigServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to save zone suite availability') };
  }
}

export async function deleteZoneSuiteConfigServerAction(id: string): Promise<ActionResult<void>> {
  try {
    const headers = await getAuthHeaders();
    await axiosInstance.delete(`/admin/zones/suite-configs/${id}`, { headers });
    return { ok: true, data: undefined };
  } catch (error: any) {
    console.error('[deleteZoneSuiteConfigServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to remove zone suite availability') };
  }
}
