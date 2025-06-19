<script lang="ts">
  import type { ListedItem } from '$lib/requests/queries/users/userListItemsQuery';
  import { UrlBuilder } from '$lib/utils/url/UrlBuilder';
  import MediaSummaryCard from '$lib/sections/lists/components/MediaSummaryCard.svelte';
  import type { MediaCardProps } from '$lib/sections/lists/components/MediaCardProps';
  import type { EpisodeCardProps as EpisodeSpecificProps } from '$lib/sections/lists/components/EpisodeCardProps'; // Renamed to avoid conflict
  import Image from '$lib/components/image/Image.svelte';


  /**
   * What: Renders a single item from a user's custom list using MediaSummaryCard
   *       for movies, shows, and episodes. Persons are handled with a simpler display.
   *
   * How:
   * - It receives a `ListedItem` object as a prop.
   * - It transforms this `ListedItem` into the props structure expected by `MediaSummaryCard`.
   * - For 'person' type, it renders a custom, simpler block.
   */
  export let item: ListedItem;

  // Reactive declaration for props passed to MediaSummaryCard
  let cardProps: (MediaCardProps | EpisodeSpecificProps) | null = null;

  // --- Mappers for MediaSummaryCard ---
  // These map Trakt API image objects to the structure MediaSummaryCard/CardCover might expect.
  // Assuming CardCover takes a simple URL for src.
  // The actual `MovieObject`, `ShowObject`, `EpisodeObject` often have `poster`, `thumb`, `cover` etc.
  // We need to ensure the paths are correctly resolved to URLs.
  // UrlBuilder.tmdbImage is used for this.

  // Helper to create image objects for MediaSummaryCard if needed,
  // but MediaSummaryCard seems to construct URLs internally or via CardCover using paths.
  // The `media` object passed to MediaSummaryCard should contain image paths as per Trakt API.
  // e.g. item.movie.poster.path, item.show.cover.url.thumb etc.
  // MediaSummaryCard's CardCover uses `media.thumb.url` for movies, `media.cover.url.thumb` for shows.
  // For episodes, it's `rest.episode.cover.url`.

  // This reactive block will re-calculate cardProps whenever 'item' changes.
  $: {
    if (item.type === 'movie' && item.movie) {
      cardProps = {
        type: 'movie',
        // @ts-expect-error - item.movie is TraktMovie, MediaInput is expected. Assume structure is compatible enough or needs casting.
        media: {
          ...item.movie,
          // Ensuring image structures match what MediaSummaryCard/CardCover might expect if they need specific fields like .url
          // Movie's CardCover uses media.thumb.url
          thumb: { url: UrlBuilder.tmdbImage(item.movie.poster?.path, 'poster', 'w300') }, // Example, adjust size as needed
        },
        style: 'summary',
        variant: 'default',
      };
    } else if (item.type === 'show' && item.show) {
      cardProps = {
        type: 'show',
        // @ts-expect-error - item.show is TraktShow, MediaInput is expected.
        media: {
          ...item.show,
          // Show's CardCover uses media.cover.url.thumb
          cover: { url: { thumb: UrlBuilder.tmdbImage(item.show.poster?.path, 'poster', 'w300') } },
        },
        style: 'summary',
        variant: 'default',
      };
    } else if (item.type === 'episode' && item.episode && item.show) {
      cardProps = {
        type: 'episode', // This is for the outer MediaCardProps type discriminator
        // @ts-expect-error - item.show is TraktShow, MediaInput is expected for 'media' part of EpisodeCardProps.
        media: { // This is the Show part for an Episode card
             ...item.show,
             // Ensure image paths are available if MediaSummaryCard needs them for the show part of an episode view
        },
        episode: { // This is the EpisodeEntry part
            ...item.episode,
            // Episode's CardCover uses episode.cover.url
            cover: { url: UrlBuilder.tmdbImage(item.episode.still?.path, 'still', 'w300') }, // Use still for episode cover
        },
        style: 'summary',
        variant: 'default', // This 'variant' is from EpisodeCardProps
      };
    } else {
      cardProps = null; // For 'person' or unknown types
    }
  }

  // For person display
  $: personName = item.type === 'person' ? item.person?.name : '';
  $: personImageUrl = item.type === 'person' && item.person?.profile?.path
    ? UrlBuilder.tmdbImage(item.person.profile.path, 'profile', 'w185')
    : null;
  $: personUrl = item.type === 'person' && item.person?.ids.slug
    ? UrlBuilder.person(item.person.ids.slug)
    : '#';

</script>

{#if cardProps && (item.type === 'movie' || item.type === 'show' || item.type === 'episode')}
  <MediaSummaryCard {...cardProps} />
{:else if item.type === 'person' && item.person}
  <a href={personUrl} class="person-summary-card block rounded-lg border border-shade-700 bg-shade-850 p-3 text-shade-100 transition-colors hover:bg-shade-800">
    <div class="flex items-center gap-3">
      {#if personImageUrl}
        <Image src={personImageUrl} alt="Profile of {personName}" class="h-20 w-20 rounded-full object-cover" />
      {:else}
        <div class="flex h-20 w-20 items-center justify-center rounded-full bg-shade-700 text-xs text-shade-300">No Image</div>
      {/if}
      <div>
        <h4 class="text-md font-semibold text-purple-300">{personName}</h4>
        <p class="text-sm capitalize text-shade-300">Person</p>
        {#if item.listed_at}
          <p class="text-xs text-shade-400">Added: {new Date(item.listed_at).toLocaleDateString()}</p>
        {/if}
      </div>
    </div>
  </a>
{:else}
  <!-- Fallback for unknown item types or if data is missing -->
  <div class="p-2 text-shade-400">
    <p>Unsupported item type or data missing for: {item.id} (Type: {item.type})</p>
  </div>
{/if}

<style>
  .person-summary-card:hover h4 {
    text-decoration: underline;
  }
</style>
