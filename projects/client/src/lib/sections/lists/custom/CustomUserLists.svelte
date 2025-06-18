<script lang="ts">
  import DrillableMediaList from '$lib/sections/lists/drilldown/DrillableMediaList.svelte';
  import GenericListItem from './GenericListItem.svelte';
  import { useSingleUserListItems } from './useSingleUserListItems';
  import { UrlBuilder } from '$lib/utils/url/UrlBuilder';
  import { useUser } from '$lib/features/auth/stores/useUser';
  import type { ListedItem } from '$lib/requests/queries/users/userListItemsQuery';
  import { derived }_from_ 'svelte/store'; // Corrected import

  /**
   * What: This component displays the items of a single, specific custom Trakt list.
   *
   * How:
   * - It accepts `listId` and `listName` as props.
   * - It uses the `useSingleUserListItems` hook to fetch items for the specified list.
   * - It displays these items using the `DrillableMediaList` component.
   * - Each list item is rendered by `GenericListItem`.
   * - The title of the list is taken from the `listName` prop.
   */
  export let listId: string;
  export let listName: string; // To display as the title of the section

  const { user } = useUser(); // Needed for UrlBuilder.list

  // The useSingleUserListItems hook returns an infinite query store.
  // DrillableMediaList expects `useList` to be a function that returns such a store.
  const listItemsQuery = useSingleUserListItems({ listId });

  // Adapt the hook's return for DrillableMediaList's `useList` prop.
  // `useList` needs to be a function that returns a store with subscribe, fetchNextPage, etc.
  // The `useSingleUserListItems` hook already returns a TanStack Svelte Query infinite query object,
  // which has these properties and is suitable for `DrillableMediaList`.
  const useListProp = () => listItemsQuery;

  // The DrillableMediaList also expects the data to be mapped to a specific structure,
  // typically { entries: [], page: {} }. The `userListItemsQuery` (used by `useSingleUserListItems`)
  // already returns data in this shape after its mapper.
  // However, `createInfiniteQuery` wraps this in `data.pages`.
  // `DrillableMediaList`'s `DrillableListStoreAdapter` handles the `data.pages` from `createInfiniteQuery`.

  const listUrlBuilder = (item: ListedItem) => {
    // This function should build a URL to the item's detail page.
    // GenericListItem already handles this internally for its own link.
    // DrillableMediaList might use this if an item itself is a "list" to drill down further.
    // For basic media items, this might not be strictly necessary if GenericListItem handles navigation.
    // Returning '#' as a placeholder, or the item's own URL.
    switch (item.type) {
      case 'movie':
        return item.movie ? UrlBuilder.movie(item.movie.ids.slug) : '#';
      case 'show':
        return item.show ? UrlBuilder.show(item.show.ids.slug) : '#';
      case 'episode':
        return item.show && item.episode
          ? UrlBuilder.episode(item.show.ids.slug, item.episode.season, item.episode.number)
          : '#';
      case 'person':
        return item.person ? UrlBuilder.person(item.person.ids.slug) : '#';
      default:
        return '#';
    }
  };

  // Create a derived store for the title to ensure reactivity if listName prop changes.
  const title = derived(listName, ($listName) => $listName || 'Custom List');

</script>

{#if listId && listName}
  <DrillableMediaList
    type="list-items" {/* A type to indicate these are items within a list, not lists themselves */}
    id={`custom-list-${listId}`}
    title={$title}
    useList={useListProp}
    urlBuilder={listUrlBuilder}
    itemIdentifier={(item) => (item.movie?.ids.trakt ?? item.show?.ids.trakt ?? item.episode?.ids.trakt ?? item.person?.ids.trakt ?? Math.random()).toString() + '-' + item.type}
    emptyLabel="This list is empty."
    errorMessage="Could not load items for this list."
  >
    {#snippet item(listItem: ListedItem)}
      <GenericListItem item={listItem} />
    {/snippet}
  </DrillableMediaList>
{:else}
  <p class="text-shade-300">List ID and Name are required to display a custom list.</p>
{/if}

<style>
  /* Add any specific styling for this component if needed */
  /* DrillableMediaList will have its own internal styling */
</style>
