<script lang="ts">
  import * as m from "$lib/features/i18n/messages";
  import UserWatchlistItem from "./UserWatchlistItem.svelte";
  import { useUserWatchlist, type CombinedWatchlistItem } from "./useUserWatchlist";

  /**
   * What: This component displays the user's combined Trakt watchlist.
   * How: It uses `useUserWatchlist` to fetch and combine movie and show watchlist items,
   *      sorted by the date they were added. It then renders each item.
   */
  const { data: watchlistItems, isLoading, isError, error } = useUserWatchlist();
</script>

{#if $isLoading}
  <p>Loading your watchlist...</p>
{:else if $isError}
  <p>Error loading your watchlist: {$error?.message}</p>
{:else if $watchlistItems && $watchlistItems.length > 0}
  <h2>{m.user_watchlist_title()}</h2>
  <ul>
    {#each $watchlistItems as item (item.itemType + '-' + (item.movie?.ids?.trakt || item.show?.ids?.trakt))}
      <li>
        <UserWatchlistItem {item} />
      </li>
    {/each}
  </ul>
{:else}
  <p>Your watchlist is empty or could not be loaded.</p>
{/if}
