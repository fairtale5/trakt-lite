<script lang="ts">
  import type { MediaListSummary } from '$lib/requests/models/MediaListSummary';

  /**
   * What: This component renders a single custom list item.
   * How: It displays the list name and the number of items in the list.
   */
  export let list: MediaListSummary;
</script>

<div>
  <h4>{list.name}</h4>
  <p>{list.itemCount} items</p>
  <!-- Add more details or link to the list if necessary -->
</div>

<style>
  div {
    padding: 8px;
    border: 1px solid var(--shade-700); /* Example border */
    border-radius: 4px;
    margin-bottom: 8px;
  }
  h4 {
    margin: 0 0 4px 0;
    font-size: 1.1em;
    color: var(--purple-300); /* Example color */
  }
  p {
    margin: 0;
    font-size: 0.9em;
    color: var(--shade-300); /* Example color */
  }
</style>
