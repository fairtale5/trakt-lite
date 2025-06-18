<script lang="ts">
  import { type Writable, writable, derived } from 'svelte/store';
  import { onMount, onDestroy } from 'svelte';
  import * as m from '$lib/features/i18n/messages';
  import Dialog from '$lib/components/dialogs/Dialog.svelte';
  import { useUserCustomLists } from '$lib/sections/lists/custom/useUserCustomLists';
  import { homepageConfig, type HomepageSection } from '$lib/features/homepage-customizer/homepageConfigStore';
  import type { MediaListSummary } from '$lib/requests/models/MediaListSummary'; // Type for user's lists

  /**
   * What: This modal allows users to select which of their personal Trakt lists
   *       can be added to the homepage configuration.
   *
   * How:
   * - Fetches all user's personal lists using `useUserCustomLists`.
   * - Displays each list with a checkbox. Checkboxes are pre-filled based on `homepageConfigStore`.
   * - On "Save", it updates `homepageConfigStore` by adding newly selected lists
   *   (as initially disabled sections) and removing deselected ones (if they were custom).
   */

  export let isOpen: Writable<boolean>; // Controls modal visibility from parent

  const dialogRef = writable<HTMLDialogElement>(); // Ref for the Dialog component

  // Fetch all user's custom lists
  const allUserListsQuery = useUserCustomLists();

  // Local store to manage checkbox states within the modal
  // Key: Trakt list ID (e.g., list.id), Value: boolean (checked or not)
  const selectedInModal = writable<Record<string, boolean>>({});

  // Derived store for currently configured custom list IDs from homepageConfig
  const configuredCustomListIds = derived(homepageConfig, ($config) => {
    const ids = new Set<string>();
    $config.forEach(section => {
      if (section.props?.listId && section.componentName === 'CustomUserLists') {
        ids.add(String(section.props.listId));
      }
    });
    return ids;
  });

  // Initialize selectedInModal when lists are loaded or config changes
  let unsubscribeFromAllLists: (() => void) | null = null;
  let unsubscribeFromConfigured: (() => void) | null = null;

  onMount(() => {
    // Effect to show/hide dialog based on isOpen prop
    const unsubscribeIsOpen = isOpen.subscribe($open => {
      if ($dialogRef && $open) {
        $dialogRef.showModal?.();
      } else if ($dialogRef && !$open) {
        $dialogRef.close?.();
      }
    });

    // Initialize checkboxes based on fetched lists and current homepage config
    unsubscribeFromAllLists = allUserListsQuery.data.subscribe($lists => {
      if ($lists && $lists.length > 0) {
        const currentSelections: Record<string, boolean> = {};
        const configuredIds = $configuredCustomListIds; // Get current value

        $lists.forEach(list => {
          currentSelections[String(list.id)] = configuredIds.has(String(list.id));
        });
        selectedInModal.set(currentSelections);
      }
    });

    // Also update if configured lists change while modal is open (e.g. another tab)
     unsubscribeFromConfigured = configuredCustomListIds.subscribe($configuredIds => {
        if ($allUserListsQuery.data && $allUserListsQuery.data.length > 0) {
            const currentSelections: Record<string, boolean> = {};
            $allUserListsQuery.data.forEach(list => {
                currentSelections[String(list.id)] = $configuredIds.has(String(list.id));
            });
            selectedInModal.set(currentSelections);
        }
    });


    return () => {
      unsubscribeIsOpen();
      unsubscribeFromAllLists?.();
      unsubscribeFromConfigured?.();
    };
  });

  function handleClose() {
    isOpen.set(false);
    // Reset selections if modal is closed without saving? Or keep them?
    // For now, they will re-initialize on next open based on config.
  }

  function handleSave() {
    if (!$allUserListsQuery.data) return;

    const currentSelections = $selectedInModal;
    const initialConfiguredIds = $configuredCustomListIds;

    $allUserListsQuery.data.forEach(list => {
      const listIdStr = String(list.id);
      const isSelectedNow = currentSelections[listIdStr] === true;
      const wasConfigured = initialConfiguredIds.has(listIdStr);

      if (isSelectedNow && !wasConfigured) {
        // Add to homepageConfig
        homepageConfig.addCustomListSection({
          id: list.id, // Trakt list ID
          name: list.name,
        });
      } else if (!isSelectedNow && wasConfigured) {
        // Remove from homepageConfig
        // The sectionId in store is `custom_list_trakt_${list.id}`
        homepageConfig.removeCustomListSection(`custom_list_trakt_${listIdStr}`);
      }
    });

    handleClose();
  }

  function toggleSelection(listId: string) {
    selectedInModal.update(current => ({
      ...current,
      [listId]: !current[listId],
    }));
  }

</script>

<Dialog title={m.manage_custom_lists_modal_title()} dialog={dialogRef} onClose={handleClose}>
  <div class="modal-content p-4 overflow-y-auto max-h-[60vh]">
    {#if $allUserListsQuery.isLoading}
      <p>{m.loading_label ? m.loading_label() : 'Loading lists...'}</p>
    {:else if $allUserListsQuery.isError}
      <p class="text-red-400">Error loading your custom lists: {$allUserListsQuery.error?.message}</p>
    {:else if $allUserListsQuery.data && $allUserListsQuery.data.length > 0}
      <ul class="space-y-2">
        {#each $allUserListsQuery.data as list (list.id)}
          {@const listIdStr = String(list.id)}
          <li>
            <label class="flex items-center space-x-2 p-2 rounded-md hover:bg-shade-800 cursor-pointer">
              <input
                type="checkbox"
                class="form-checkbox h-5 w-5 rounded text-purple-500 bg-shade-700 border-shade-600 focus:ring-purple-600"
                checked={$selectedInModal[listIdStr] === true}
                on:change={() => toggleSelection(listIdStr)}
              />
              <span class="text-shade-100">{list.name} ({list.itemCount} items)</span>
            </label>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="text-shade-300">You have no custom lists on Trakt.</p>
    {/if}
  </div>

  <div class="modal-actions flex justify-end gap-3 p-4 border-t border-shade-700">
    <button class="btn-secondary" on:click={handleClose}>
      {m.cancel_button()}
    </button>
    <button class="btn-primary" on:click={handleSave} disabled={$allUserListsQuery.isLoading || $allUserListsQuery.isError}>
      {m.save_button()}
    </button>
  </div>
</Dialog>

<style>
  .modal-content {
    /* Ensure content scrolls if it's too long */
  }
  .btn-primary {
    background-color: var(--purple-600);
    color: white;
    padding: 8px 16px;
    border-radius: 4px;
    border: none;
    cursor: pointer;
  }
  .btn-primary:hover {
    background-color: var(--purple-700);
  }
  .btn-primary:disabled {
    background-color: var(--shade-600);
    cursor: not-allowed;
  }
  .btn-secondary {
    background-color: var(--shade-700);
    color: var(--shade-50);
    padding: 8px 16px;
    border-radius: 4px;
    border: 1px solid var(--shade-600);
    cursor: pointer;
  }
  .btn-secondary:hover {
    background-color: var(--shade-600);
  }
</style>
