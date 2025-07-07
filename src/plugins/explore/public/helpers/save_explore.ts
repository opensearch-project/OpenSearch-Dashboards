/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { CoreStart } from 'src/core/public';
import { SavedExplore } from '../saved_explore';
import { ExploreServices } from '../types';
import { ExecutionContextSearch } from '../../../expressions/common';
import { getRootBreadcrumbs } from '../application/legacy/discover/application/helpers/breadcrumbs';
import { Query } from '../../../data/common';
import { SaveResult } from '../../../saved_objects/public';
import { LegacyState, setSavedSearch } from '../application/utils/state_management/slices';
import { updateLegacyPropertiesInSavedObject } from '../saved_explore/transforms';

export async function saveSavedExplore({
  savedExplore,
  newTitle,
  saveOptions,
  searchContext,
  services,
  startSyncingQueryStateWithUrl,
  newCopyOnSave,
}: {
  savedExplore: SavedExplore;
  newTitle: string;
  saveOptions: { isTitleDuplicateConfirmed: boolean; onTitleDuplicate: () => void };
  searchContext: ExecutionContextSearch;
  services: Partial<CoreStart> & ExploreServices;
  startSyncingQueryStateWithUrl: () => void;
  newCopyOnSave?: boolean;
}): Promise<SaveResult | undefined> {
  const { toastNotifications, chrome, history, store } = services;

  const currentTitle = savedExplore.title;
  savedExplore.title = newTitle;
  if (newCopyOnSave !== undefined) {
    savedExplore.copyOnSave = newCopyOnSave;
  }

  const state: LegacyState = store.getState().legacy; // store is defined before the view is loaded
  savedExplore.columns = state.columns;
  savedExplore.sort = state.sort;

  // Use transform approach similar to vis_builder - serialize state into saved object
  updateLegacyPropertiesInSavedObject(savedExplore, {
    columns: state.columns,
    sort: state.sort,
  });

  const searchSourceInstance = savedExplore.searchSourceFields;

  if (searchSourceInstance) {
    searchSourceInstance.query = searchContext.query as Query;
    searchSourceInstance.filter = searchContext.filters;
  }
  try {
    // update or creating existing save explore
    const originalId = savedExplore.id;

    const id = await savedExplore.save(saveOptions);

    if (id) {
      toastNotifications.addSuccess({
        title: i18n.translate('explore.notifications.SavedExploreTitle', {
          defaultMessage: `Search '{savedQueryTitle}' was saved`,
          values: {
            savedQueryTitle: savedExplore?.title,
          },
        }),
        'data-test-subj': 'savedExploreSuccess',
      });
    }
    if (id !== originalId) {
      history().push(`/view/${encodeURIComponent(id)}`);
    } else {
      // Update browser title and breadcrumbs
      chrome.docTitle.change(newTitle);
      chrome.setBreadcrumbs([...getRootBreadcrumbs(), { text: savedExplore.title }]);
    }

    store.dispatch(setSavedSearch(id));

    // starts syncing `_g` portion of url with query services
    startSyncingQueryStateWithUrl();
    return { id };
  } catch (error) {
    toastNotifications.addDanger({
      title: i18n.translate('explore.notifications.notSavedExploreTitle', {
        defaultMessage: `Search '{savedExploreTitle}' was not saved.`,
        values: {
          savedExploreTitle: savedExplore.title,
        },
      }),
      text: (error as Error).message,
    });

    // Reset the original title
    savedExplore.title = currentTitle;

    return { error };
  }
}
