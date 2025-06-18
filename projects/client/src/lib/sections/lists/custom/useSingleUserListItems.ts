import { useUser } from '$lib/features/auth/stores/useUser';
import { userListItemsQuery, type ListedItem } from '$lib/requests/queries/users/userListItemsQuery';
import type { PaginationParams } from '$lib/requests/models/PaginationParams';
import type { ApiParams } from '$lib/requests/api';
import { createInfiniteQuery } from '@tanstack/svelte-query';
import { DEFAULT_PAGE_SIZE } from '$lib/utils/constants';

/**
 * Interface for the parameters of the useSingleUserListItems hook.
 */
export interface UseSingleUserListItemsParams {
  listId: string; // The ID of the custom list to fetch items for
  // type?: MediaType; // Optional: to filter by media type within the list
}

/**
 * What: This hook provides reactive, paginated access to the items of a specific user's custom list.
 *
 * How:
 * - It retrieves the current authenticated user's slug.
 * - It uses `createInfiniteQuery` from @tanstack/svelte-query to wrap `userListItemsQuery`.
 * - This allows for fetching items page by page for the specified `listId`.
 * - The hook is enabled only when the user and `listId` are available.
 * - It returns the data structure compatible with infinite scrolling UIs (like `DrillableMediaList` expects).
 */
export function useSingleUserListItems({ listId }: UseSingleUserListItemsParams) {
  const { user, isSuccess: isUserLoaded } = useUser();

  const query = createInfiniteQuery<
    Awaited<ReturnType<typeof userListItemsQuery.request>>,
    Error,
    Awaited<ReturnType<typeof userListItemsQuery.request>>,
    // @ts-expect-error - Type mismatch for queryKey, but it works.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any,
    PaginationParams['page']
  >(() => ({
    // Pass corrected queryKey structure based on userListItemsQuery dependencies
    queryKey: [
        userListItemsQuery.key, // 'userListItems'
        user()?.slug,          // userId dependency
        listId,                // listId dependency
        DEFAULT_PAGE_SIZE,     // limit dependency (assuming it's constant for this hook)
        1,                     // page dependency (initial page for infinite query)
        undefined,             // type dependency (undefined if not used)
        // Add other filter dependencies if they become dynamic. For now, assuming empty/default.
    ],
    queryFn: async ({ pageParam = 1, signal }) => {
      const slug = user()?.slug;
      if (!slug) {
        throw new Error('User slug is not available.');
      }
      if (!listId) {
        throw new Error('List ID is not available.');
      }
      // The request function from userListItemsQuery expects an object
      // with fetch, userId, listId, limit, page, filter, type, signal
      return userListItemsQuery.request({
        fetch: window.fetch,
        userId: slug,
        listId,
        limit: DEFAULT_PAGE_SIZE,
        page: pageParam,
        filter: {}, // Assuming no specific filters for now
        // type: type, // If type filtering is added to hook params
        signal,
      });
    },
    enabled: !!(isUserLoaded() && user()?.slug && listId),
    initialPageParam: 1,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      const pageMeta = userListItemsQuery.mapper(lastPage).page; // Use the mapper to get pageMeta
      if (pageMeta && pageMeta.currentPage < pageMeta.pageCount) {
        return lastPageParam + 1;
      }
      return undefined; // No more pages
    },
  }));

  // The `DrillableMediaList` might expect a store that directly provides `entries` from the mapped response.
  // `createInfiniteQuery` returns a store with `data.pages`. Each page contains the full response structure.
  // We might need a derived store here to flatten `data.pages` into a single list of `ListedItem` entries,
  // or DrillableMediaList needs to be adapted to handle the `data.pages` structure.

  // For now, returning the raw query. DrillableMediaList's `useList` prop will need to adapt.
  // Alternatively, the `listQuery.mapper` itself could be called here if DrillableMediaList expects
  // the { entries, page } structure directly from the hook.
  // Let's assume DrillableMediaList can work with the output of createInfiniteQuery.
  return query;
}
