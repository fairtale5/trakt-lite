import { writable } from 'svelte/store';
import * as m from '$lib/features/i18n/messages';

/**
 * Interface for a homepage section configuration.
 */
export interface HomepageSection {
  id: string; // Unique identifier for the section
  titleKey?: keyof typeof m | null; // Key for Svelte-i18n for default sections
  title: string; // Resolved title for display (can be from i18n key or custom list name)
  enabled: boolean; // Whether the section is currently visible on the homepage
  componentName: string; // The actual Svelte component name to render
  props?: Record<string, any>; // Props to pass to the component (e.g., listId for custom lists)
  isCustom?: boolean; // Flag to identify if the section was added by the user (e.g., a custom list)
  isDefault?: boolean; // Flag to identify if this is a non-removable default section
}

// Define the initial default order and state of homepage sections
const defaultSectionsData: Omit<HomepageSection, 'title'>[] = [
  { id: 'monthInReview', titleKey: 'month_in_review_label', enabled: true, componentName: 'MonthInReview', isDefault: true },
  { id: 'upNext', titleKey: 'up_next_title', enabled: true, componentName: 'UpNextList', isDefault: true },
  { id: 'userWatchlist', titleKey: 'user_watchlist_title', enabled: true, componentName: 'UserWatchlist', isDefault: true },
  { id: 'released', titleKey: 'released_movies_title', enabled: true, componentName: 'ReleasedList', isDefault: true },
  { id: 'upcoming', titleKey: 'upcoming_schedule_title', enabled: true, componentName: 'UpcomingList', isDefault: true },
  { id: 'unreleased', titleKey: 'unreleased_movies_title', enabled: true, componentName: 'UnreleasedList', isDefault: true },
  { id: 'socialActivity', titleKey: 'social_activity_title', enabled: true, componentName: 'SocialActivityList', isDefault: true },
];

function resolveSectionTitles(sections: Omit<HomepageSection, 'title'>[]): HomepageSection[] {
  return sections.map(section => {
    let title = section.id; // Fallback title
    if (section.titleKey && m[section.titleKey]) {
      // @ts-expect-error - m[section.titleKey] is a function call
      title = m[section.titleKey]();
    } else if (section.props?.listName) {
      title = section.props.listName;
    }
    return { ...section, title };
  });
}

const initialDefaultSections = resolveSectionTitles(defaultSectionsData.map(s => ({ ...s })));

// TODO: Load persisted config from localStorage if available
const { subscribe, set, update } = writable<HomepageSection[]>(initialDefaultSections);

function updateOrder(newOrder: HomepageSection[]) {
  update(currentSections => {
    const newOrderMap = new Map(newOrder.map((s, i) => [s.id, i]));
    const currentOrderMap = new Map(currentSections.map((s,i) => [s.id, i]));

    const sortedSections = [...currentSections].sort((a, b) => {
      const aOrder = newOrderMap.get(a.id);
      const bOrder = newOrderMap.get(b.id);
      const currentAOrder = currentOrderMap.get(a.id) ?? Infinity;
      const currentBOrder = currentOrderMap.get(b.id) ?? Infinity;

      if (aOrder !== undefined && bOrder !== undefined) return aOrder - bOrder;
      if (aOrder !== undefined) return -1;
      if (bOrder !== undefined) return 1;
      return currentAOrder - currentBOrder;
    });
    return sortedSections;
  });
}

function toggleSection(sectionId: string) {
  update(sections => {
    const sectionIndex = sections.findIndex(s => s.id === sectionId);
    if (sectionIndex === -1) return sections;

    const sectionsCopy = sections.map(s => ({ ...s }));
    sectionsCopy[sectionIndex].enabled = !sectionsCopy[sectionIndex].enabled;
    return sectionsCopy;
  });
}

function resetToDefault() {
  update(currentSections => {
    const customAddedSections = currentSections.filter(s => s.isCustom && !defaultSectionsData.some(ds => ds.id === s.id))
                                          .map(s => ({ ...s, enabled: false })); // Disable custom sections

    const newDefaults = resolveSectionTitles(defaultSectionsData.map(s => ({ ...s })));

    // Ensure all default sections are present and custom ones are appended correctly
    const finalSections: HomepageSection[] = [];
    const processedIds = new Set<string>();

    newDefaults.forEach(nds => {
      finalSections.push(nds);
      processedIds.add(nds.id);
    });

    customAddedSections.forEach(cas => {
      if (!processedIds.has(cas.id)) { // Should always be true due to filter logic
        finalSections.push(cas);
        processedIds.add(cas.id);
      }
    });
    return finalSections;
  });
}

function applyCouchmoneyView() {
  // Couchmoney View Order: Up Next, User Watchlist, Upcoming Schedule.
  // Other default sections are disabled. Custom sections are also disabled.
  const couchmoneySectionOrder = ['upNext', 'userWatchlist', 'upcoming'];

  update(sections => {
    const newSections = sections.map(section => {
      let enabled = false;
      if (couchmoneySectionOrder.includes(section.id)) {
        enabled = true; // Enable sections part of the Couchmoney view
      } else if (section.isDefault) {
        enabled = false; // Disable other default sections
      } else if (section.isCustom) {
        enabled = false; // Disable custom sections
      }

      return { ...section, enabled };
    });

    newSections.sort((a, b) => {
      const aEnabled = a.enabled;
      const bEnabled = b.enabled;
      const aCouchmoneyIndex = couchmoneySectionOrder.indexOf(a.id);
      const bCouchmoneyIndex = couchmoneySectionOrder.indexOf(b.id);

      if (aEnabled && !bEnabled) return -1; // Enabled items first
      if (!aEnabled && bEnabled) return 1;  // Enabled items first

      if (aEnabled && bEnabled) { // Both are enabled (must be Couchmoney items)
        return aCouchmoneyIndex - bCouchmoneyIndex;
      }

      // Both are disabled
      if (a.isCustom && !b.isCustom) return 1; // Custom disabled items last
      if (!a.isCustom && b.isCustom) return -1; // Default disabled items before custom disabled

      // If both are default disabled or both custom disabled, maintain original default order
      const initialAIndex = defaultSectionsData.findIndex(s => s.id === a.id);
      const initialBIndex = defaultSectionsData.findIndex(s => s.id === b.id);
      return (initialAIndex === -1 ? Infinity : initialAIndex) - (initialBIndex === -1 ? Infinity : initialBIndex);
    });
    return newSections;
  });
}

function addCustomListSection(list: { id: string | number; name: string }) {
  const sectionId = `custom_list_trakt_${list.id}`;
  update(sections => {
    if (sections.find(s => s.id === sectionId)) {
      return sections;
    }
    const newSection: HomepageSection = {
      id: sectionId,
      title: list.name,
      enabled: false,
      componentName: 'CustomUserLists',
      props: { listId: String(list.id), listName: list.name },
      isCustom: true,
      titleKey: null,
    };

    const firstDisabledIndex = sections.findIndex(s => !s.enabled);
    if (firstDisabledIndex !== -1) {
      return [...sections.slice(0, firstDisabledIndex), newSection, ...sections.slice(firstDisabledIndex)];
    }
    return [...sections, newSection];
  });
}

function removeCustomListSection(sectionId: string) {
  update(sections => {
    return sections.filter(s => {
      if (s.id === sectionId) {
        return !s.isCustom;
      }
      return true;
    });
  });
}


export const homepageConfig = {
  subscribe,
  updateOrder,
  toggleSection,
  resetToDefault,
  applyCouchmoneyView,
  addCustomListSection,
  removeCustomListSection,
  getDefaultSections: () => resolveSectionTitles(defaultSectionsData.map(s => ({ ...s }))),
};
