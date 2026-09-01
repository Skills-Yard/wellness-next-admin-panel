// Not a real Server Action despite the directory name — see category.ts's
// getAuthHeaders comment. Plain client-side axios calls so the browser
// Network tab sees real requests/responses.
import axiosInstance from '../axios';
import { getAuthHeaders, ActionResult } from './category';
import { parseServerError } from '../errorParser';
import { PaginatedEnvelope } from './pagination';
import { BusinessMembership, BusinessMembershipStatus } from '../../types/membership';

export interface MembershipFilter {
  status?: BusinessMembershipStatus[];
  businessId?: string;
  employeeId?: string;
  page?: number;
  limit?: number;
}

export interface MembershipPage {
  rows: BusinessMembership[];
  total: number;
  page: number;
  totalPages: number;
}

export async function getMembershipsServerAction(
  filter: MembershipFilter = {},
): Promise<MembershipPage> {
  try {
    const headers = await getAuthHeaders();
    const res = await axiosInstance.get<PaginatedEnvelope<BusinessMembership>>(
      '/admin/partners/memberships',
      {
        headers,
        params: {
          ...(filter.status?.length ? { status: filter.status.join(',') } : {}),
          ...(filter.businessId ? { businessId: filter.businessId } : {}),
          ...(filter.employeeId ? { employeeId: filter.employeeId } : {}),
          page: filter.page ?? 1,
          limit: filter.limit ?? 20,
        },
      },
    );
    return {
      rows: res.data.data ?? [],
      total: res.data.pagination?.total ?? 0,
      page: res.data.pagination?.page ?? 1,
      totalPages: res.data.pagination?.totalPages ?? 1,
    };
  } catch (error) {
    console.error('[getMembershipsServerAction]', error);
    return { rows: [], total: 0, page: 1, totalPages: 1 };
  }
}

export async function activateMembershipServerAction(
  id: string,
): Promise<ActionResult<BusinessMembership>> {
  try {
    const headers = await getAuthHeaders();
    const res = await axiosInstance.patch(
      `/admin/partners/memberships/${id}/activate`,
      {},
      { headers },
    );
    return { ok: true, data: res.data?.data ?? res.data };
  } catch (error) {
    console.error('[activateMembershipServerAction]', error);
    return { ok: false, message: parseServerError(error, 'Failed to activate membership') };
  }
}

export async function revokeMembershipServerAction(
  id: string,
  reason?: string,
): Promise<ActionResult<BusinessMembership>> {
  try {
    const headers = await getAuthHeaders();
    const res = await axiosInstance.patch(
      `/admin/partners/memberships/${id}/revoke`,
      { reason },
      { headers },
    );
    return { ok: true, data: res.data?.data ?? res.data };
  } catch (error) {
    console.error('[revokeMembershipServerAction]', error);
    return { ok: false, message: parseServerError(error, 'Failed to revoke membership') };
  }
}
