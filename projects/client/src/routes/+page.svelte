<script lang="ts">
  import { page } from '$app/stores';
  import RenderFor from '$lib/guards/RenderFor.svelte'; // Corrected path
  import Redirect from '$lib/components/router/Redirect.svelte'; // Corrected path
  import Landing from '$lib/sections/landing/Landing.svelte';

  // Imports for homepage customization
  import { homepageConfig, type HomepageSection } from '$lib/features/homepage-customizer/homepageConfigStore';
  import { derived } from 'svelte/store';

  // Import existing homepage section components
  import MonthInReview from '$lib/sections/month-in-review/MonthInReview.svelte';
  import UpNextList from '$lib/sections/lists/progress/UpNextList.svelte';
  import ReleasedList from '$lib/sections/lists/watchlist/ReleasedList.svelte';
  import UpcomingList from '$lib/sections/lists/UpcomingList.svelte';
  import UnreleasedList from '$lib/sections/lists/watchlist/UnreleasedList.svelte';
  import SocialActivityList from '$lib/sections/lists/social/SocialActivityList.svelte';

  // Import component for rendering individual custom lists
  import CustomUserLists from '$lib/sections/lists/custom/CustomUserLists.svelte';

  // Import UserWatchlist component
  import UserWatchlist from '$lib/sections/lists/watchlist/UserWatchlist.svelte';

  // Import other new homepage section components (UnratedHistoryList)
  // This is not yet part of the configurable sections in this plan step but was imported
  // in the original file. We'll keep them for consistency.
  import UnratedHistoryList from '$lib/sections/lists/history/UnratedHistoryList.svelte';


  /**
   * What: This is the main landing page of the application.
   *
   * How:
   * - For unauthenticated users, it displays the `Landing.svelte` component.
   * - For authenticated users, it dynamically renders a series of homepage sections
   *   based on the configuration in `homepageConfigStore`.
   * - The order and visibility of these sections are user-configurable via the
   *   `HomepageCustomizer` interface.
   * - Custom lists added by the user are rendered using `CustomUserLists.svelte`.
   * - The User's Watchlist is rendered using `UserWatchlist.svelte`.
   */

  // --- Dynamically Rendered Authenticated Homepage ---
  // Map componentName strings from the store to actual Svelte component constructors
  const componentMap: Record<string, typeof import('*.svelte').default> = {
    MonthInReview,
    UpNextList,
    ReleasedList,
    UpcomingList,
    UnreleasedList,
    SocialActivityList,
    CustomUserLists,
    UserWatchlist, // Added UserWatchlist to the map
    // UnratedHistoryList, // Not yet in homepageConfigStore as a configurable item
  };

  // Derived store that filters for enabled sections and maintains their order
  const enabledSections = derived(homepageConfig, ($sections) => {
    return $sections.filter(section => section.enabled);
  });
</script>

<svelte:head>
  <title>Trakt Enhanced</title>
  <meta name="description" content="Enhanced Trakt.tv client" />
</svelte:head>

<RenderFor audience="public" let:isPublic>
  {#if isPublic}
    {#if $page.data.session}
      <!-- Authenticated user on a public-only page, redirect to home -->
      <Redirect href="/" />
    {:else}
      <Landing />
    {/if}
  {/if}
</RenderFor>

<RenderFor audience="authenticated" let:isAuthenticated>
  {#if isAuthenticated}
    <div class="flex flex-col gap-y-12">
      <!-- Dynamically render enabled homepage sections -->
      {#each $enabledSections as section (section.id)}
        {#if componentMap[section.componentName]}
          <svelte:component this={componentMap[section.componentName]} {...section.props} />
        {:else}
          <!-- Fallback for missing component mapping, helpful for debugging -->
          <div class="rounded-md bg-red-900/30 p-4 text-red-300 ring-1 ring-inset ring-red-500/50">
            <p class="font-semibold">Developer Warning:</p>
            <p>Component "<code>{section.componentName}</code>"
              for section "<code>{section.title || section.id}</code>" is not mapped correctly in <code>+page.svelte</code> or not available.
            </p>
            {#if section.props}
              <p class="mt-2 text-sm">Received props: <code>{JSON.stringify(section.props)}</code></p>
            {/if}
          </div>
        {/if}
      {/each}
    </div>
  {/if}
</RenderFor>
