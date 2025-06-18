<script lang="ts">
  import type { Writable } from 'svelte/store';
  import * as m from '$lib/features/i18n/messages';
  import Sidebar from '../filter/_internal/Sidebar.svelte'; // Using the generic sidebar component
  import HomepageCustomizer from '$lib/components/homepage-customizer/HomepageCustomizer.svelte';

  /**
   * What: This component renders the sidebar for homepage customization.
   *
   * How:
   * - It wraps the generic `Sidebar.svelte` component.
   * - It receives an `isOpen` store (Writable<boolean>) to control its visibility.
   * - It sets a specific title for the sidebar related to customization.
   * - The content of the sidebar is the `HomepageCustomizer` component,
   *   which allows users to reorder and toggle homepage sections.
   */
  export let isOpen: Writable<boolean>;

  const title = m.customize_homepage_title();
</script>

<Sidebar {isOpen} {title}>
  <!--
    Slot for the main content of the customization sidebar.
    This is where the HomepageCustomizer component is embedded.
  -->
  <div slot="content" class="h-full overflow-y-auto">
    <HomepageCustomizer />
  </div>

  <!--
    Slot for sidebar actions (e.g., Save, Reset buttons).
    Currently empty, but could be used for global actions related to customization.
    The HomepageCustomizer itself has buttons for "Reset" and "Couchmoney View".
  -->
  <div slot="actions">
    <!-- Placeholder for future global action buttons if needed -->
  </div>
</Sidebar>
