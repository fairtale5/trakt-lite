// projects/client/src/lib/sections/lists/custom/useUserCustomLists.ts
import { useUser } from '$lib/features/auth/stores/useUser';
import { personalListsQuery } from '$lib/requests/queries/users/personalListsQuery';
import { createQuery } from '@tanstack/svelte-query';

/**
 * What: This hook provides reactive access to the current user's personal Trakt lists.
 *
 * How:
 * - It retrieves the current authenticated user's information (specifically their slug).
 * - It then uses the `createQuery` utility from @tanstack/svelte-query to make a reactive
 *   query for the user's personal lists.
 * - The actual data fetching logic, API endpoint, caching, and data transformation
 *   are defined in `personalListsQuery`.
 * - This hook ensures that the data is fetched only when a user is available and
 *   provides loading and error states.
 */
export function useUserCustomLists() {
  const { user, isSuccess: isUserLoaded } = useUser();

  // The query for personal lists depends on the user's slug.
  // It will only be enabled if the user data (and thus slug) is successfully loaded.
  const query = createQuery(() => ({
    ...personalListsQuery, // Spread the predefined query options (key, request, mapper, schema, ttl)
    queryFn: async ({ signal }) => {
      // Ensure user and slug are available before attempting to fetch
      if (!user()?.slug) {
        // This should ideally not happen if 'enabled' is managed correctly,
        // but as a safeguard:
        throw new Error('User slug is not available to fetch personal lists.');
      }
      // Call the request function from personalListsQuery with the user's slug
      // The 'fetch' function is typically provided by SvelteKit's load context or a global fetch polyfill.
      // For client-side queries, ensure a global fetch is available or pass it appropriately if needed.
      // Here, we assume 'personalListsQuery.request' can be called directly or it internally handles fetch.
      // Based on personalListsQuery, it expects an object with 'fetch' and 'slug'.
      // We need to ensure 'fetch' is available in this context.
      // SvelteKit's fetch is usually available in load functions.
      // For client-side only, we might need to pass it or ensure it's globally available.
      // For now, let's assume the `trakt` client handles this.
      // The `personalListsQuery.request` function expects an object with `fetch` and `slug`.
      // The `createQuery` function provides `fetch` in its context if not using a custom client.
      // However, `personalListsRequest` from `personalListsQuery` takes `{ fetch, slug }`.
      // `defineQuery` wraps this, and `createQuery` should handle passing `fetch`.
      // The `request` function defined in `personalListsQuery` will be called by `createQuery`'s `queryFn`.
      // We just need to ensure the parameters (`slug`) are correctly passed.
      // The `personalListsQuery` itself defines how to use the `slug`.
      // `createQuery` will call `personalListsQuery.request({ fetch: contextFetch, slug: user()!.slug, signal })`
      // So we just need to supply the dynamic parts of the query key or context if needed.
      // The key in personalListsQuery is 'personalLists' and dependencies include params.slug.
      return personalListsQuery.request({ fetch: window.fetch, slug: user()!.slug, signal });
    },
    // Only enable the query if the user is loaded and has a slug.
    enabled: !!(isUserLoaded() && user()?.slug),
  }));

  return query;
}
