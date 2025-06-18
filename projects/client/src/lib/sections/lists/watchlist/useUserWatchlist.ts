// projects/client/src/lib/sections/lists/watchlist/useUserWatchlist.ts
import { derived } from 'svelte/store';
import { createQuery } from '@tanstack/svelte-query';
import { movieWatchlistQuery, type WatchlistMovie } from '$lib/requests/queries/users/movieWatchlistQuery';
import { showWatchlistQuery, type WatchlistShow } from '$lib/requests/queries/users/showWatchlistQuery';
import { useUser } from '$lib/features/auth/stores/useUser';
import { DEFAULT_PAGE_SIZE } from '$lib/utils/constants'; // Assuming this is a sensible limit

// Define a common type for watchlist items after combining
export type CombinedWatchlistItem = (WatchlistMovie | WatchlistShow) & { itemType: 'movie' | 'show' };

/**
 * What: This hook provides a reactive, combined, and sorted list of the user's Trakt watchlist items (movies and shows).
 *
 * How:
 * - It fetches the user's movie watchlist and show watchlist separately using TanStack Svelte Query.
 *   Default sort is 'rank' (Trakt's default for watchlist) or 'added' if preferred. Let's use 'added' for "most recent".
 *   It fetches the first page with a defined limit.
 * - It uses a Svelte `derived` store to combine the results of these two queries once both are successful.
 * - Each item in the combined list is augmented with an `itemType` field ('movie' or 'show').
 * - The combined list is then sorted by the `listed_at` date in descending order.
 * - The hook returns the reactive derived store containing the combined list,
 *   as well as loading and error states that reflect the status of both underlying queries.
 */
export function useUserWatchlist() {
  const { user, isSuccess: isUserLoaded } = useUser();
  const commonQueryParams = {
    sort: 'added', // Sort by when it was added to the watchlist
    page: 1,
    limit: DEFAULT_PAGE_SIZE, // Or a specific limit for homepage
    filter: {}, // No specific filters for now
  } as const;

  const moviesQuery = createQuery(() => ({
    ...movieWatchlistQuery,
    queryFn: async ({ signal }) => movieWatchlistQuery.request({
      fetch: window.fetch,
      ...commonQueryParams,
      signal,
    }),
    enabled: !!(isUserLoaded() && user()?.slug), // Depends on user session
  }));

  const showsQuery = createQuery(() => ({
    ...showWatchlistQuery,
    queryFn: async ({ signal }) => showWatchlistQuery.request({
      fetch: window.fetch,
      ...commonQueryParams,
      signal,
    }),
    enabled: !!(isUserLoaded() && user()?.slug), // Depends on user session
  }));

  const combinedWatchlist = derived(
    [moviesQuery, showsQuery],
    ([$moviesQuery, $showsQuery], set) => {
      if ($moviesQuery.isSuccess && $showsQuery.isSuccess) {
        const movies = $moviesQuery.data.entries.map(m => ({ ...m, itemType: 'movie' as const }));
        const shows = $showsQuery.data.entries.map(s => ({ ...s, itemType: 'show' as const }));

        const combined = [...movies, ...shows];

        // Sort by listed_at date, most recent first
        combined.sort((a, b) => new Date(b.listed_at).getTime() - new Date(a.listed_at).getTime());
        set(combined);
      } else if ($moviesQuery.isLoading || $showsQuery.isLoading) {
        // Still loading one or both
        set(undefined); // Or an empty array / specific loading state if preferred
      } else {
        // Error in one or both, or not yet loaded
        set([]);
      }
    },
    [] as CombinedWatchlistItem[] // Initial value for the derived store
  );

  return {
    data: combinedWatchlist,
    isLoading: derived([moviesQuery, showsQuery], ([$moviesQuery, $showsQuery]) => $moviesQuery.isLoading || $showsQuery.isLoading),
    isError: derived([moviesQuery, showsQuery], ([$moviesQuery, $showsQuery]) => $moviesQuery.isError || $showsQuery.isError),
    error: derived([moviesQuery, showsQuery], ([$moviesQuery, $showsQuery]) => $moviesQuery.error || $showsQuery.error),
  };
}
