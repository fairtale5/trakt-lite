<script lang="ts">
  import type { CombinedWatchlistItem } from "./useUserWatchlist";

  /**
   * What: Renders a single item from the combined (movie/show) watchlist.
   * How: Displays the title and type of the watchlist item.
   */
  export let item: CombinedWatchlistItem;

  // Helper to get the title, as movies and shows have it in different nested objects
  $: title = item.itemType === 'movie' ? item.movie?.title : item.show?.title;
  $: year = item.itemType === 'movie' ? item.movie?.year : item.show?.year;
</script>

<div>
  <h4>{title || 'N/A'} {#if year}({year}){/if}</h4>
  <p>Type: {item.itemType}</p>
  <p><small>Added: {new Date(item.listed_at).toLocaleDateString()}</small></p>
  <!-- Add more details like poster image if available in item data -->
</div>

<style>
  div {
    padding: 8px;
    border: 1px solid var(--shade-600);
    border-radius: 4px;
    margin-bottom: 8px;
  }
  h4 {
    margin: 0 0 4px 0;
    font-size: 1.1em;
    color: var(--purple-400); /* Example color */
  }
  p {
    margin: 2px 0;
    font-size: 0.9em;
  }
  p small {
    color: var(--shade-400);
  }
</style>
