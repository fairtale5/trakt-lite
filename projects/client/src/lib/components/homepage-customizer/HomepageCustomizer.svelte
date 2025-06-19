<script lang="ts">
  import { homepageConfig, type HomepageSection } from '$lib/features/homepage-customizer/homepageConfigStore';
  import * as m from '$lib/features/i18n/messages';
  import { dndzone } from 'svelte-dnd-action';
  import CloseIcon from '$lib/components/icons/CloseIcon.svelte'; // Import project's CloseIcon
  import { derived, writable } from 'svelte/store';
  import ManageCustomListsModal from './ManageCustomListsModal.svelte';

  /**
   * What: This component provides the UI for customizing the homepage layout.
   *
   * How:
   * - It subscribes to `homepageConfigStore` to get the current list of sections.
   * - It separates sections into "Active" and "Disabled" lists based on their `enabled` state.
   * - Active sections can be reordered using drag-and-drop (via `svelte-dnd-action`).
   * - An "X" button on active sections moves them to the disabled list (or removes if custom and removable).
   * - Clicking a disabled section moves it to the active list.
   * - Provides buttons to "Revert to Default View" and apply "Couchmoney View".
   * - Includes a button to open the "ManageCustomListsModal" for adding/removing custom list sections.
   */

  const sections = homepageConfig;

  const activeSections = derived(sections, ($sections) => $sections.filter(s => s.enabled));
  const disabledSections = derived(sections, ($sections) => $sections.filter(s => !s.enabled));

  const dndConsiderDelay = 0;
  const dndTriggerDisabled = false;

  function handleDndFinalize(e: CustomEvent<{ items: HomepageSection[]; info: { id: string; source: string; trigger: string } }>) {
    // e.detail.items contains the new order of *only the items in this specific dndzone*
    // We need to merge this new order of active items with the existing disabled items.
    const newActiveOrder = e.detail.items;
    const currentDisabledItems = $disabledSections; // Get current disabled items from derived store

    homepageConfig.updateOrder([...newActiveOrder, ...currentDisabledItems]);
  }

  function toggleOrRemoveSection(section: HomepageSection) {
    // If it's a custom, non-default section, clicking "X" could mean "remove from config"
    // For now, "X" always means "disable". Removal is handled in the modal.
    // This could be changed: if section.isCustom && !section.isDefault, then homepageConfig.removeCustomListSection(section.id)
    homepageConfig.toggleSection(section.id);
  }

  function enableSection(sectionId: string) {
    homepageConfig.toggleSection(sectionId);
  }

  // Modal state
  const isModalOpen = writable(false);
  function openManageListsModal() {
    isModalOpen.set(true);
  }
</script>

<div class="customizer-container p-2">
  <div class="controls mb-4 flex flex-wrap items-center gap-2">
    <button class="btn-secondary" on:click={homepageConfig.resetToDefault}>
      {m.revert_to_default_view_button()}
    </button>
    <button class="btn-secondary" on:click={homepageConfig.applyCouchmoneyView}>
      {m.apply_couchmoney_view_button()}
    </button>
    <button class="btn-primary" on:click={openManageListsModal}>
      {m.add_manage_custom_lists_button()}
    </button>
  </div>

  <div class="sections-columns grid grid-cols-1 gap-4 md:grid-cols-2">
    <div>
      <h3 class="mb-2 text-lg font-semibold text-shade-100">{m.active_sections_title()}</h3>
      {#if $activeSections.length === 0}
        <p class="text-sm text-shade-300">No active sections. Enable sections from the list below or add custom lists.</p>
      {:else}
        <ul
          class="min-h-[50px] rounded-md border border-shade-700 bg-shade-850 p-2"
          use:dndzone={{ items: $activeSections, type: 'activeSection', flipDurationMs: 200, dragDisabled: dndTriggerDisabled, considerDelay: dndConsiderDelay }}
          on:finalize={handleDndFinalize}
        >
          {#each $activeSections as section (section.id)}
            <li
              class="mb-2 flex cursor-grab items-center justify-between rounded-md bg-shade-750 p-3 shadow hover:bg-shade-700"
              title={section.isCustom ? `Custom List: ${section.title}` : section.title}
            >
              <span class="text-shade-50">{section.title || section.titleKey}</span>
              <button
                class="ml-2 rounded p-1 text-red-400 hover:bg-red-900 hover:text-red-200"
                title="Disable section"
                on:click={() => toggleOrRemoveSection(section)}
              >
                <CloseIcon /> {/* Use project's CloseIcon */}
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    </div>

    <div>
      <h3 class="mb-2 text-lg font-semibold text-shade-100">{m.disabled_sections_title()}</h3>
      {#if $disabledSections.length === 0 && $activeSections.length > 0}
        <p class="text-sm text-shade-300">All available sections are active.</p>
      {:else if $disabledSections.length === 0 && $activeSections.length === 0}
         <p class="text-sm text-shade-300">No sections configured. Try adding custom lists or resetting to default.</p>
      {:else}
        <ul class="rounded-md border border-shade-700 bg-shade-850 p-2">
          {#each $disabledSections as section (section.id)}
            <li
              class="mb-2 flex cursor-pointer items-center justify-between rounded-md bg-shade-750 p-3 shadow hover:bg-shade-700"
              title={`Click to enable: ${section.isCustom ? `Custom List: ${section.title}` : section.title}`}
              on:click={() => enableSection(section.id)}
              role="button"
              tabindex="0"
              on:keydown={(e) => e.key === 'Enter' && enableSection(section.id)}
            >
              <span class="text-shade-50">{section.title || section.titleKey}</span>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  </div>
</div>

{#if $isModalOpen}
  <ManageCustomListsModal isOpen={isModalOpen} />
{/if}

<style>
  .customizer-container {
    color: var(--text-main);
  }

  .btn-primary {
    background-color: var(--purple-600);
    color: white;
    padding: 8px 12px;
    border-radius: 4px;
    border: none;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  .btn-primary:hover {
    background-color: var(--purple-700);
  }

  .btn-secondary {
    background-color: var(--shade-700);
    color: var(--shade-50);
    padding: 8px 12px;
    border-radius: 4px;
    border: 1px solid var(--shade-600);
    cursor: pointer;
    transition: background-color 0.2s;
  }
  .btn-secondary:hover {
    background-color: var(--shade-600);
  }

  ul > li {
    user-select: none;
  }
</style>
