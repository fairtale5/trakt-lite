<script lang="ts">
  import { writable } from 'svelte/store';
  import * as m from '$lib/features/i18n/messages';
  import { Filter as FilterIcon } from 'lucide-svelte'; // Placeholder icon
  import Tooltip from '$lib/components/Tooltip.svelte';
  import CustomizeSidebar from './CustomizeSidebar.svelte';

  /**
   * What: This component provides a button to open the homepage customization sidebar.
   *
   * How:
   * - It uses a Svelte writable store (`isSidebarOpen`) to manage the visibility of the sidebar.
   * - Clicking the button toggles the `isSidebarOpen` state.
   * - It renders the `CustomizeSidebar` component, passing the `isOpen` store to it.
   * - A tooltip provides information about the button's function.
   */

  const isSidebarOpen = writable(false);

  function toggleSidebar() {
    isSidebarOpen.update((n) => !n);
  }
</script>

<button
  type="button"
  class="group relative flex items-center justify-center rounded-full text-shade-300 hover:bg-shade-800 hover:text-shade-100 focus:outline-none focus:ring-1 focus:ring-inset focus:ring-purple-500"
  aria-label={m.customize_label()}
  on:click={toggleSidebar}
>
  <FilterIcon class="h-7 w-7 p-1" /> <!-- Placeholder: Replace with a customization-specific icon -->
  <Tooltip position="left" text={m.customize_label()} />
</button>

<CustomizeSidebar isOpen={isSidebarOpen} />
