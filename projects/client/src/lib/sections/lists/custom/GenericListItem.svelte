<script lang="ts">
  import type { ListedItem } from '$lib/requests/queries/users/userListItemsQuery';
  import { UrlBuilder } from '$lib/utils/url/UrlBuilder'; // For links
  import MediaCard from '$lib/components/cards/MediaCard.svelte'; // A more sophisticated card might be good

  /**
   * What: Renders a single item from a user's custom list.
   * This item can be a movie, show, episode, or person.
   *
   * How:
   * - It receives a `ListedItem` object as a prop.
   * - It determines the type of the item (movie, show, episode, person).
   * - It displays the title and type, and potentially other details like year or a poster via MediaCard.
   * - It links to the item's page on Trakt or within the app.
   */
  export let item: ListedItem;

  $: title = item.movie?.title || item.show?.title || item.episode?.name || item.person?.name || 'Unknown Title';
  $: itemTypeDisplay = item.type === 'episode' ? `${item.show?.title} S${item.episode?.season}E${item.episode?.number}` : item.type;

  // Determine URL for the item
  $: itemUrl = (() => {
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
  })();

  // Props for MediaCard (example structure, adapt as needed based on MediaCard's actual props)
  // This assumes MediaCard can handle various item types or we extract common props.
  // For simplicity, we might only pass basic info if MediaCard is too specific.
  // Let's assume a simplified usage or direct display if MediaCard is complex.

  // Fallback data for MediaCard if item structure is not directly compatible
  const cardData = {
    mediaType: item.type === 'episode' ? 'show' : item.type, // MediaCard might expect 'show' for episodes
    title: title,
    posterPath: item.movie?.poster?.path ?? item.show?.poster?.path ?? item.person?.profile?.path,
    // backdropPath: item.movie?.backdrop?.path ?? item.show?.backdrop?.path, // if needed
    ids: item.movie?.ids ?? item.show?.ids ?? item.episode?.ids ?? item.person?.ids,
    url: itemUrl,
    // Add other props MediaCard might need, like year, rating, etc.
    // year: item.movie?.year ?? item.show?.year,
    // For episodes, MediaCard might expect show-level info primarily.
  };

</script>

{#if item}
  <!-- Using a simple div for now, MediaCard integration can be more complex -->
  <a href={itemUrl} class="item-link block rounded-lg border border-shade-700 p-3 transition-colors hover:bg-shade-800">
    <div class="flex items-center gap-3">
      <!-- Basic image placeholder - ideally use an <Image /> component -->
      {#if cardData.posterPath}
        <img
          src={UrlBuilder.tmdbImage(cardData.posterPath, 'poster', 'w92')}
          alt="Poster for {title}"
          class="h-20 w-auto rounded object-cover"
          loading="lazy"
        />
      {:else}
        <div class="flex h-20 w-[58px] items-center justify-center rounded bg-shade-750 text-xs text-shade-300">No Image</div>
      {/if}
      <div>
        <h4 class="text-md font-semibold text-purple-300 group-hover:underline">{title}</h4>
        <p class="text-sm capitalize text-shade-300">{itemTypeDisplay}</p>
        {#if item.listed_at}
          <p class="text-xs text-shade-400">Added: {new Date(item.listed_at).toLocaleDateString()}</p>
        {/if}
      </div>
    </div>
  </a>
  <!-- Example of using MediaCard - this would replace the div above if MediaCard is suitable -->
  <!-- <MediaCard
    mediaType={cardData.mediaType as any}
    tmdbId={cardData.ids?.tmdb}
    traktId={cardData.ids?.trakt}
    slug={cardData.ids?.slug}
    title={cardData.title}
    posterPath={cardData.posterPath}
    url={cardData.url}
    year={cardData.year}
    variant="listitem"
  /> -->
{:else}
  <p>Loading item data...</p>
{/if}

<style>
  .item-link:hover h4 {
    text-decoration: underline;
  }
</style>
