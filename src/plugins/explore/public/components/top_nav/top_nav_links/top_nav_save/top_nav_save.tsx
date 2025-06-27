/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * TODO:
 * - make this file work correctly with the new saved explore
 * - write unit tests
 */

import { i18n } from '@osd/i18n';
import React from 'react';
import { TopNavMenuIconRun, TopNavMenuIconUIData } from '../types';
import { ExploreServices } from '../../../../types';
import { ExecutionContextSearch } from '../../../../../../expressions';
import { IndexPattern, Query } from '../../../../../../data/common';
import { SavedExplore } from '../../../../types/saved_explore_types';
import {
  OnSaveProps,
  SavedObjectSaveModal,
  SavedObjectSaveOpts,
  SaveResult,
  showSaveModal,
} from '../../../../../../saved_objects/public';
import { updateLegacyPropertiesInSavedObject } from '../../../../saved_explore/transforms';
import { getRootBreadcrumbs } from '../../../../application/legacy/discover/application/helpers/breadcrumbs';
import { setSavedSearch } from '../../../../application/utils/state_management/slices';

export const saveTopNavData: TopNavMenuIconUIData = {
  tooltip: i18n.translate('explore.topNav.saveTitle', {
    defaultMessage: 'Save',
  }),
  ariaLabel: i18n.translate('explore.topNav.saveAriaLabel', {
    defaultMessage: `Save search`,
  }),
  testId: 'discoverSaveButton',
  iconType: 'save',
  controlType: 'icon',
};

export const getSaveButtonRun = (
  services: ExploreServices,
  startSyncingQueryStateWithUrl: () => void,
  searchContext: ExecutionContextSearch,
  indexPattern: IndexPattern | undefined,
  savedExplore?: SavedExplore
): TopNavMenuIconRun => () => {
  if (!savedExplore) return;

  const onSave = async ({
    newTitle,
    newCopyOnSave,
    isTitleDuplicateConfirmed,
    onTitleDuplicate,
  }: OnSaveProps): Promise<SaveResult | undefined> => {
    const {
      chrome,
      core,
      data: { search },
      history,
      store,
      toastNotifications,
    } = services;
    const legacyState = store.getState().legacy;

    const currentTitle = savedExplore.title;
    savedExplore.title = newTitle;
    savedExplore.copyOnSave = newCopyOnSave;
    const saveOptions: SavedObjectSaveOpts = {
      confirmOverwrite: false,
      isTitleDuplicateConfirmed,
      onTitleDuplicate,
    };

    updateLegacyPropertiesInSavedObject(savedExplore, {
      columns: legacyState.columns,
      sort: legacyState.sort,
    });

    // TODO: SearchSource should be saved in savedExplore instead of constructing it here
    // Here constructing it for saving
    const searchSource = search.searchSource.createEmpty();
    searchSource.setField('query', searchContext.query as Query);
    searchSource.setField('filter', searchContext.filters);
    searchSource.setField('index', indexPattern);
    savedExplore.searchSource = searchSource;

    try {
      const id = await savedExplore.save(saveOptions);

      // If the title is a duplicate, the id will be an empty string. Checking for this condition here
      if (id) {
        toastNotifications.addSuccess({
          title: i18n.translate('explore.notifications.savedExploreTitle', {
            defaultMessage: `Search '{savedExploreTitle}' was saved`,
            values: {
              savedExploreTitle: savedExplore.title,
            },
          }),
          'data-test-subj': 'saveSearchSuccess',
        });

        if (id !== legacyState.savedSearch) {
          history().push(`/view/${encodeURIComponent(id)}`);
        } else {
          chrome.docTitle.change(savedExplore.lastSavedTitle);
          chrome.setBreadcrumbs([...getRootBreadcrumbs(), { text: savedExplore.title }]);
        }

        // set App state to clean
        store.dispatch(setSavedSearch(id));

        // starts syncing `_g` portion of url with query services
        startSyncingQueryStateWithUrl();

        return { id };
      }
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

    const saveModal = (
      <SavedObjectSaveModal
        onSave={onSave}
        onClose={() => {}}
        title={savedExplore.title ?? ''}
        showCopyOnSave={!!savedExplore.id}
        // TODO: Does this need to be type "explore"?
        objectType="discover"
        description={i18n.translate('explore.localMenu.saveSaveSearchDescription', {
          defaultMessage:
            'Save your Discover search so you can use it in visualizations and dashboards',
        })}
        showDescription={false}
      />
    );
    showSaveModal(saveModal, core.i18n.Context);
  };
};
