import axiosInstance from '../axios';
import { parseServerError } from '../errorParser';
import { getAuthHeaders, type ActionResult } from './category';

/**
 * Force-invalidates every cached catalog response (Redis + Cloudflare edge)
 * via POST /admin/catalog/cache/flush.
 *
 * Normal catalog edits already trigger this same invalidation on the
 * backend — this is the manual escape hatch for when a response was cached
 * before a backend change (new field on /catalog/home, a direct DB write,
 * a seed script) and the 24h backstop TTL would otherwise keep serving the
 * stale shape. The endpoint is fire-and-forget on the backend and returns
 * 202; Redis clears within moments, the edge purge a few seconds later.
 */
export async function flushCatalogCacheServerAction(): Promise<
  ActionResult<{ message: string }>
> {
  try {
    const headers = await getAuthHeaders();
    const response = await axiosInstance.post(
      '/admin/catalog/cache/flush',
      {},
      { headers },
    );
    const message =
      (response.data && typeof response.data === 'object' && 'message' in response.data
        ? (response.data as { message?: string }).message
        : undefined) ?? 'Catalog cache invalidation triggered.';
    return { ok: true, data: { message } };
  } catch (error: any) {
    console.error(
      '[flushCatalogCacheServerAction]',
      error?.response?.data || error.message,
    );
    return {
      ok: false,
      message: parseServerError(error, 'Failed to clear catalog cache'),
    };
  }
}
