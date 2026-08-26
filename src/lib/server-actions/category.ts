import axiosInstance from '../axios';
import { ServiceCategory } from '../../types/catalogue';
import { parseServerError } from '../errorParser';
import { fetchAllPaginated, PaginatedEnvelope } from './pagination';

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string };

// Was `'use server'` + a bare `cookies()` read — every function in this directory that imported
// getAuthHeaders was therefore a genuine Next.js Server Action, which meant the actual axios
// call to the backend ran inside the Next.js server process: the browser's Network tab never
// saw the real request/response at all, just an opaque POST to the current page with a
// `Next-Action` header, and any backend error got folded into that same 200 response instead of
// showing up as a failed request. Dropping `'use server'` here (and from every file that spreads
// from this one) makes these plain client-side calls instead — same pattern getUsersServerAction
// already used — so they show up in the Network tab like any normal fetch, with real status
// codes and real response bodies. `cookies()` only works in an actual server context, so this
// reads the token from localStorage on the client and falls back to the (dynamically imported,
// so it's never bundled for the client) cookie read for the rare server-rendered case.
export async function getAuthHeaders() {
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

// The backend wraps every response as { success, data, meta }. Every admin
// catalog GET/POST/PATCH below returns the payload straight from that `data` key.
function unwrap<T>(resData: any, fallback: T): T {
  if (resData && typeof resData === 'object' && 'data' in resData) return resData.data;
  return (resData ?? fallback) as T;
}

export async function getCategoriesServerAction(isActive?: boolean): Promise<ServiceCategory[]> {
  try {
    const headers = await getAuthHeaders();
    return await fetchAllPaginated<ServiceCategory>((page, limit) =>
      axiosInstance.get<PaginatedEnvelope<ServiceCategory>>('/admin/catalog/categories', {
        headers,
        params: { ...(isActive === undefined ? {} : { isActive }), page, limit },
      })
    );
  } catch (error: any) {
    console.error('[getCategoriesServerAction]', error?.response?.data || error.message);
    return [];
  }
}

// Single-page counterpart to getCategoriesServerAction — one backend call, no fetchAllPaginated
// walk. Used by CategoriesView's own Section 1 (Main Categories) table/pagination; the tab
// switcher (CategoryTabs) and Sections 1B/2's suite/gender derivations keep reading the full
// `categories` list off CatalogueContext, unchanged.
export async function getCategoriesPagedServerAction(params: {
  page?: number;
  limit?: number;
  q?: string;
  isActive?: boolean;
}): Promise<PaginatedEnvelope<ServiceCategory>> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 10;
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.get<PaginatedEnvelope<ServiceCategory>>('/admin/catalog/categories', {
      headers,
      params: {
        ...(params.isActive === undefined ? {} : { isActive: params.isActive }),
        ...(params.q ? { q: params.q } : {}),
        page,
        limit,
      },
    });
    return response.data;
  } catch (error: any) {
    console.error('[getCategoriesPagedServerAction]', error?.response?.data || error.message);
    return { data: [], pagination: { total: 0, page, limit, totalPages: 1 } };
  }
}

export async function getCategoryByIdServerAction(id: string): Promise<ServiceCategory | null> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.get(`/admin/catalog/categories/${id}`, { headers });
    return unwrap<ServiceCategory | null>(response.data, null);
  } catch (error: any) {
    console.error('[getCategoryByIdServerAction]', error?.response?.data || error.message);
    return null;
  }
}

// Fields accepted by CreateCategoryDto/UpdateCategoryDto — this is the complete list.
// The backend runs ValidationPipe with `whitelist: true`, so ANY property not declared on
// the DTO is silently stripped from the request rather than rejected — keep this in sync
// with wellness-backend/src/modules/catalog/dtos/category/create-category.dto.ts.
export interface CategoryPayload {
  name: string;
  slug?: string;
  title: string;
  subtitle?: string;
  sectionHeading?: string;
  sectionSubheading?: string;
  displayOrder?: number;
  iconKey?: string;
  homeBannerKey?: string;
  homeBannerType?: 'IMAGE' | 'VIDEO';
}

export async function saveCategoryServerAction(
  id: string | null,
  payload: CategoryPayload
): Promise<ActionResult<ServiceCategory>> {
  try {
    const headers = await getAuthHeaders();
    if (id) {
      const response = await axiosInstance.patch(`/admin/catalog/categories/${id}`, payload, { headers });
      return { ok: true, data: unwrap(response.data, response.data) };
    } else {
      const response = await axiosInstance.post('/admin/catalog/categories', payload, { headers });
      return { ok: true, data: unwrap(response.data, response.data) };
    }
  } catch (error: any) {
    console.error('[saveCategoryServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to save category') };
  }
}

export async function updateCategoryStatusServerAction(
  id: string,
  isActive: boolean
): Promise<ActionResult<ServiceCategory>> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.patch(`/admin/catalog/categories/${id}/status`, { isActive }, { headers });
    return { ok: true, data: unwrap(response.data, response.data) };
  } catch (error: any) {
    console.error('[updateCategoryStatusServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to update category status') };
  }
}

export async function updateCategorySlugServerAction(
  id: string,
  slug: string
): Promise<ActionResult<ServiceCategory>> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.patch(`/admin/catalog/categories/${id}/slug`, { slug }, { headers });
    return { ok: true, data: unwrap(response.data, response.data) };
  } catch (error: any) {
    console.error('[updateCategorySlugServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to update category slug') };
  }
}

export async function deleteCategoryServerAction(id: string): Promise<ActionResult<void>> {
  try {
    const headers = await getAuthHeaders();
    await axiosInstance.delete(`/admin/catalog/categories/${id}`, { headers });
    return { ok: true, data: undefined };
  } catch (error: any) {
    console.error('[deleteCategoryServerAction]', error?.response?.data || error.message);
    return { ok: false, message: parseServerError(error, 'Failed to delete category') };
  }
}
