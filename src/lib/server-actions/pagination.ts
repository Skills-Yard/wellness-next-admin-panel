// The backend now paginates every admin list endpoint (default 20/page, 100
// max per page) instead of returning everything in one call — see
// wellness-backend's PaginationQueryDto / TransformInterceptor. These admin
// screens still expect a complete array (they filter/sort/paginate
// client-side, e.g. PartnerListTable's own page controls), so this walks
// every backend page and concatenates — same "give me everything" contract
// the UI was already built against, just correct as a resource grows past
// one page instead of silently truncating at 20.
export interface PaginatedEnvelope<T> {
  data: T[];
  pagination?: { total: number; page: number; limit: number; totalPages: number };
}

export async function fetchAllPaginated<T>(
  fetchPage: (page: number, limit: number) => Promise<{ data: PaginatedEnvelope<T> }>,
  limit = 100
): Promise<T[]> {
  const first = await fetchPage(1, limit);
  const items = [...(first.data?.data ?? [])];
  const totalPages = first.data?.pagination?.totalPages ?? 1;
  for (let page = 2; page <= totalPages; page++) {
    const next = await fetchPage(page, limit);
    items.push(...(next.data?.data ?? []));
  }
  return items;
}
