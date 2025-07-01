/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { CoreStart } from 'src/core/public';
import { SavedExplore } from '../../../saved_explore';
import { ExploreServices } from '../../../types';
import { ExecutionContextSearch } from '../../../../../expressions/common';
import { IndexPattern } from '../../../../../data/public';
import { Query } from '../../../../../data/common';
import { SaveResult } from '../../../../../saved_objects/public';
import { LegacyState, setSavedSearch } from '../../../application/utils/state_management/slices';

export async function saveSavedExplore({
  savedExplore,
  newTitle,
  saveOptions,
  searchContext,
  services,
  startSyncingQueryStateWithUrl,
  newCopyOnSave,
  indexPattern,
}: {
  savedExplore: SavedExplore;
  newTitle: string;
  saveOptions: { isTitleDuplicateConfirmed: boolean; onTitleDuplicate: () => void };
  searchContext?: ExecutionContextSearch;
  services: Partial<CoreStart> & ExploreServices;
  startSyncingQueryStateWithUrl: () => void;
  newCopyOnSave?: boolean;
  indexPattern?: IndexPattern;
}): Promise<SaveResult | undefined> {
  const {
    toastNotifications,
    chrome,
    history,
    store,
    data: { search },
  } = services;

  const currentTitle = savedExplore.title;
  savedExplore.title = newTitle;
  if (newCopyOnSave !== undefined) {
    savedExplore.copyOnSave = newCopyOnSave;
  }

  const state: LegacyState = store.getState().legacy; // store is defined before the view is loaded
  savedExplore.columns = state.columns;
  savedExplore.sort = state.sort;

  if (searchContext) {
    const searchSource = search.searchSource.createEmpty();
    searchSource.setField('query', searchContext.query as Query);
    searchSource.setField('filter', searchContext.filters);
    searchSource.setField('index', indexPattern);
    savedExplore.searchSource = searchSource;
  }

  try {
    // update or creating existing save explore
    const originalId = savedExplore.id;

    const id = await savedExplore.save(saveOptions);

    // toast only display when creating new savedExplore objects, not updating existing ones.
    if (id && id !== originalId) {
      toastNotifications.addSuccess({
        title: i18n.translate('explore.notifications.SavedExploreTitle', {
          defaultMessage: `Search '{savedQueryTitle}' was saved`,
          values: {
            savedQueryTitle: savedExplore?.title,
          },
        }),
        'data-test-subj': 'savedExploreSuccess',
      });
      history().push(`/view/${encodeURIComponent(id)}`);
      // Update browser title and breadcrumbs
      chrome.docTitle.change(newTitle);
      chrome.setBreadcrumbs([{ text: 'Explore', href: '#/' }, { text: newTitle }]);
    }

    store.dispatch(setSavedSearch(id));

    // starts syncing `_g` portion of url with query services
    startSyncingQueryStateWithUrl();
    return { id };
  } catch (error) {
    toastNotifications.addDanger({
      title: i18n.translate('explore.explore.discover.notifications.notSavedExploreTitle', {
        defaultMessage: `Search '{savedExploreTitle}' was not saved.`,
        values: {
          savedExploreTitle: savedExplore.title,
        },
      }),
      text: (error as Error).message,
    });

    // Reset the original title
    savedExplore.title = currentTitle;

    throw error;
  }
}
